from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Query
from sqlalchemy.orm import Session
from ..database import SessionLocal, Question, Subject, User
from ..schemas import QuestionResponse
from .auth import get_current_user
from ..models.ml_service import predict_labels
import os
import csv
import io
from docx import Document
import pdfplumber
from typing import List, Optional
from pydantic import BaseModel
from ..models.ai_service import ai_service

router = APIRouter(prefix="/questions", tags=["questions"])

class AIQuestionRequest(BaseModel):
    subject: str
    topic: str
    num_questions: int = 5
    marks: int = 5
    blooms_level: str = "Remember"
    provider: str = "openai"  # "openai" or "gemini"

class AIQuestionResponse(BaseModel):
    questions: List[str]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload", response_model=list[QuestionResponse])
async def upload_question_bank(subject_id: int = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    ext = os.path.splitext(file.filename or "")[1].lower()
    content = await file.read()
    created = []
    def push_line(qtext: str):
        if not qtext or not qtext.strip():
            return
        m, b, mk = predict_labels(qtext.strip())
        q = Question(user_id=user.id, subject_id=subject.id, text=qtext.strip(), module_no=m, marks=mk, blooms_level=b, verified=False)
        db.add(q)
        db.flush()
        created.append(q)
    if ext == ".csv":
        text = content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            push_line(row.get("question_text") or row.get("text") or "")
    elif ext in (".txt", ".md"):
        text = content.decode("utf-8", errors="ignore")
        for line in text.splitlines():
            push_line(line)
    elif ext in (".docx",):
        buf = io.BytesIO(content)
        doc = Document(buf)
        for p in doc.paragraphs:
            push_line(p.text)
    elif ext in (".pdf",):
        buf = io.BytesIO(content)
        with pdfplumber.open(buf) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    for line in text.splitlines():
                        push_line(line)
    db.commit()
    return [QuestionResponse(
        id=q.id, 
        subject_id=subject.id, 
        text=q.text, 
        module_no=q.module_no, 
        marks=q.marks, 
        blooms_level=q.blooms_level, 
        verified=q.verified
    ) for q in created]

@router.get("/", response_model=list[QuestionResponse])
def list_questions(
    subject_id: int,
    module_no: Optional[int] = Query(None),
    blooms_level: Optional[str] = Query(None),
    verified: Optional[bool] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    query = db.query(Question).filter(Question.subject_id == subject_id, Question.user_id == user.id)
    if module_no is not None:
        query = query.filter(Question.module_no == module_no)
    if blooms_level:
        query = query.filter(Question.blooms_level == blooms_level)
    if verified is not None:
        query = query.filter(Question.verified == verified)
    if q:
        query = query.filter(Question.text.contains(q))
    return [QuestionResponse(id=ques.id, text=ques.text, module_no=ques.module_no, marks=ques.marks, blooms_level=ques.blooms_level, verified=ques.verified) for ques in query.all()]

@router.post("/ai-generate", response_model=AIQuestionResponse)
async def generate_questions_with_ai(payload: AIQuestionRequest, user=Depends(get_current_user)):
    """
    Generate questions using AI APIs (OpenAI or Gemini) based on subject, topic, and requirements.
    """
    try:
        # Create a more detailed prompt for the AI based on the request parameters
        blooms_description = {
            "Remember": "Recall or recognize information, facts, definitions, or procedures. Use verbs like: define, list, identify, name, recall, state.",
            "Understand": "Grasp the meaning of information, interpret ideas, or compare and contrast concepts. Use verbs like: explain, summarize, classify, describe, discuss.",
            "Apply": "Use learned information in new situations or solve problems. Use verbs like: apply, solve, use, demonstrate, calculate, illustrate.",
            "Analyze": "Break down information into parts and determine relationships or organization. Use verbs like: analyze, differentiate, examine, categorize, compare.",
            "Evaluate": "Make judgments based on criteria and standards. Use verbs like: evaluate, critique, justify, assess, defend, argue.",
            "Create": "Combine elements to form a new whole or original product. Use verbs like: design, construct, compose, formulate, invent, propose."
        }
        
        blooms_guidance = blooms_description.get(payload.blooms_level, "Generate appropriate questions for this cognitive level.")
        
        marks_guidance = ""
        if payload.marks <= 2:
            marks_guidance = "These are short answer questions that require brief, specific responses (1-2 sentences). Example: 'Define DBMS.'"
        elif payload.marks <= 5:
            marks_guidance = "These are medium-length questions that require explanations with some detail (2-4 sentences). Example: 'Explain the advantages of using the DBMS approach.'"
        elif payload.marks <= 10:
            marks_guidance = "These are long answer questions that require comprehensive explanations with examples (4-8 sentences). Example: 'Explain the component modules of DBMS and their interaction with the help of a diagram.'"
        else:
            marks_guidance = "These are essay-type questions that require detailed, well-structured responses with multiple points and examples (8+ sentences). Example: 'Design an ER diagram for a Hospital Management System with at least 5 entities and show relationships.'"
        
        # Few-shot examples based on the existing question bank
        few_shot_examples = """
EXAMPLE QUESTIONS FOR DIFFERENT MARKS AND BLOOM'S LEVELS:

2 marks (Remember):
- Define the following terms: i) Database ii) DBMS catalog iii) Entity iv) Snapshot v) Degree of a relationship

5 marks (Understand):
- Explain the different categories of data models.
- List and explain advantages of using DBMS approach

6 marks (Apply):
- Write the ER diagram for an employee database with specified constraints.

8 marks (Analyze):
- Explain the component modules of DBMS and their interaction with the help of a diagram.

10 marks (Evaluate/Create):
- Explain 1NF and 2NF with examples.
- Design an ER diagram for a Hospital Management System with at least 5 entities and show relationships.
"""
        
        prompt = f"""You are an expert educational question designer specializing in creating exam questions. Your task is to generate high-quality educational questions based on the specified parameters.

GENERATE {payload.num_questions} EDUCATIONAL QUESTIONS WITH THESE SPECIFICATIONS:

SUBJECT: {payload.subject}
TOPIC: {payload.topic}
MARKS PER QUESTION: {payload.marks}
BLOOM'S TAXONOMY LEVEL: {payload.blooms_level}

BLOOM'S LEVEL DESCRIPTION:
{blooms_guidance}

LENGTH GUIDANCE:
{marks_guidance}

FEW-SHOT EXAMPLES:
{few_shot_examples}

IMPORTANT INSTRUCTIONS:
1. Each question must be appropriate for the specified Bloom's level ({payload.blooms_level})
2. Each question should require approximately {payload.marks} marks to answer
3. Questions should be clear, educationally appropriate, and directly related to the topic
4. Do NOT number the questions
5. Place each question on a separate line
6. Do NOT include answer keys or explanations
7. Do NOT use markdown or special formatting
8. Focus on quality over quantity - it's better to generate fewer excellent questions than many poor ones
9. Make questions specific and actionable, similar to the examples provided
10. Avoid vague or overly general questions

Generate the questions now, one per line:"""

        # Generate questions using the specified AI provider
        questions = ai_service.generate_questions(
            prompt=prompt,
            num_questions=payload.num_questions,
            provider=payload.provider
        )

        # Filter out any empty or invalid questions
        filtered_questions = [q for q in questions if q.strip() and len(q.strip()) > 10]
        
        # If we don't have enough questions, try to generate more
        if len(filtered_questions) < payload.num_questions and filtered_questions:
            # Try to generate more questions
            additional_prompt = f"{prompt}\n\nPrevious questions were not satisfactory. Please generate {payload.num_questions} NEW, DISTINCT questions following the same guidelines:"
            additional_questions = ai_service.generate_questions(
                prompt=additional_prompt,
                num_questions=payload.num_questions,
                provider=payload.provider
            )
            # Combine and deduplicate
            all_questions = filtered_questions + [q for q in additional_questions if q.strip() and len(q.strip()) > 10]
            # Remove duplicates while preserving order
            seen = set()
            filtered_questions = []
            for q in all_questions:
                if q not in seen:
                    seen.add(q)
                    filtered_questions.append(q)
        
        # Return up to the requested number of questions
        return AIQuestionResponse(questions=filtered_questions[:payload.num_questions])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI question generation failed: {str(e)}")

@router.get("/ai-status")
def get_ai_status():
    """
    Check which AI providers are configured and available.
    """
    return {
        "openai_available": ai_service.is_openai_available(),
        "gemini_available": ai_service.is_gemini_available(),
        "providers": [
            {"name": "openai", "available": ai_service.is_openai_available()},
            {"name": "gemini", "available": ai_service.is_gemini_available()}
        ]
    }