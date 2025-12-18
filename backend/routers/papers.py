from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from ..database import SessionLocal, Question, QuestionPaper, QuestionPaperItem, Subject
from ..schemas import GeneratePaperRequest, PaperResponse, PaperItemResponse, ReplaceRequest
from .auth import get_current_user
import random

router = APIRouter(prefix="/papers", tags=["papers"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def combine_questions(questions, target_marks):
    """
    Intelligently combine questions to match target marks.
    For example: 2 questions of 4 marks each to make 8 marks.
    """
    if not questions:
        return None
        
    # Sort questions by marks
    sorted_questions = sorted(questions, key=lambda q: q.marks or 0)
    
    # Try to find exact match first
    for q in sorted_questions:
        if q.marks == target_marks:
            return q
    
    # Try combinations for higher marks
    if target_marks > max(q.marks or 0 for q in sorted_questions):
        # Combine multiple questions to reach target
        combined = []
        current_marks = 0
        for q in sorted_questions:
            if current_marks + (q.marks or 0) <= target_marks:
                combined.append(q)
                current_marks += q.marks or 0
                if current_marks == target_marks:
                    break
        
        # If we couldn't reach exact target, use what we have
        if combined:
            return combined
    
    # For lower target marks, try to split or find approximate
    return sorted_questions[0] if sorted_questions else None

def pick_question(db: Session, user_id: int, subject_id: int, module_no: int, marks: int, blooms_level: str, semester: str, exam_type: str, allow_repeat: bool):
    base = db.query(Question).filter(Question.user_id == user_id, Question.subject_id == subject_id)
    if not allow_repeat:
        base = base.filter(or_(Question.last_used_semester != semester, Question.last_used_semester.is_(None)))
        base = base.filter(or_(Question.last_used_exam_type != exam_type, Question.last_used_exam_type.is_(None)))
    
    # Get all questions for this module and bloom's level
    candidates = base.filter(and_(Question.module_no == module_no, Question.blooms_level == blooms_level)).all()
    
    if not candidates:
        # Fallback to any question in module
        candidates = base.filter(Question.module_no == module_no).all()
        if not candidates:
            # Last resort: any question
            candidates = base.all()
    
    if not candidates:
        return None
    
    # Try to find exact match or combine questions
    exact_match = [q for q in candidates if q.marks == marks]
    if exact_match:
        return random.choice(exact_match)
    
    # Try to combine questions for higher marks
    if marks > max(q.marks or 0 for q in candidates):
        # Look for combinations that sum to target marks
        possible_combinations = []
        for i in range(len(candidates)):
            for j in range(i+1, len(candidates)):
                if (candidates[i].marks or 0) + (candidates[j].marks or 0) == marks:
                    possible_combinations.append([candidates[i], candidates[j]])
        
        if possible_combinations:
            return random.choice(possible_combinations)
    
    # Return closest available question
    candidates.sort(key=lambda q: abs((q.marks or 0) - marks))
    return candidates[0] if candidates else None

@router.post("/generate", response_model=PaperResponse)
def generate(payload: GeneratePaperRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    subject = db.query(Subject).filter(Subject.id == payload.subject_id, Subject.user_id == user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Check if there are questions for this subject
    question_count = db.query(Question).filter(Question.subject_id == payload.subject_id, Question.user_id == user.id).count()
    if question_count == 0:
        raise HTTPException(status_code=400, detail="No questions found for this subject. Please upload questions first.")
    
    paper = QuestionPaper(user_id=user.id, subject_id=subject.id, class_name=payload.class_name, exam_type=payload.exam_type, semester=payload.semester, structure=[s.model_dump() for s in payload.structure])
    db.add(paper)
    db.flush()
    items = []
    for idx, item in enumerate(payload.structure, start=1):
        for sp in item.subparts:
            target_marks = int(sp.get("marks", 0))
            q_result = pick_question(db, user.id, subject.id, item.module_no, target_marks, str(sp.get("blooms_level")), payload.semester or "", payload.exam_type, payload.allow_repeat)
            
            # Handle combined questions
            question_id = None
            question_text = None
            is_combined = isinstance(q_result, list)
            
            if is_combined:
                # Combined questions - create a merged text
                combined_texts = [q.text for q in q_result if q.text]
                question_text = " [COMBINED] " + " ".join(combined_texts[:2])  # Limit to 2 for readability
                # Use first question's ID as reference
                question_id = q_result[0].id if q_result else None
            elif q_result:
                question_id = q_result.id
                question_text = q_result.text
            
            qi = QuestionPaperItem(
                paper_id=paper.id, 
                position=idx, 
                subpart=str(sp.get("label")) if sp.get("label") else None, 
                module_no=item.module_no, 
                marks=target_marks,
                blooms_level=str(sp.get("blooms_level")), 
                question_id=question_id, 
                accepted=False
            )
            db.add(qi)
            db.flush()
            
            # Create response item with question text
            response_item = PaperItemResponse(
                position=qi.position, 
                subpart=qi.subpart, 
                module_no=qi.module_no, 
                marks=qi.marks, 
                blooms_level=qi.blooms_level, 
                question_id=question_id, 
                question_text=question_text,
                accepted=qi.accepted
            )
            items.append(response_item)
            
    db.commit()
    return PaperResponse(paper_id=paper.id, items=items)

@router.post("/{paper_id}/accept")
def accept(paper_id: int, position: int = Query(...), subpart: str | None = Query(None), db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(QuestionPaperItem).join(QuestionPaper, QuestionPaperItem.paper_id == QuestionPaper.id).filter(QuestionPaper.id == paper_id, QuestionPaper.user_id == user.id, QuestionPaperItem.position == position)
    if subpart is None:
        # accept any subpart at the given position
        item = q.first()
    else:
        item = q.filter(QuestionPaperItem.subpart == subpart).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.accepted = True
    if item.question_id:
        q = db.get(Question, item.question_id)
        if q:
            q.used_count = (q.used_count or 0) + 1
            paper = db.get(QuestionPaper, paper_id)
            q.last_used_semester = paper.semester
            q.last_used_exam_type = paper.exam_type
            db.add(q)
    db.add(item)
    db.commit()
    return {"ok": True}

@router.post("/{paper_id}/replace", response_model=PaperItemResponse)
def replace(paper_id: int, payload: ReplaceRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(QuestionPaperItem).join(QuestionPaper, QuestionPaperItem.paper_id == QuestionPaper.id).filter(QuestionPaper.id == paper_id, QuestionPaper.user_id == user.id, QuestionPaperItem.position == payload.position, QuestionPaperItem.subpart == payload.subpart).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    paper = db.get(QuestionPaper, paper_id)
    # Get target marks from the original item
    target_marks = item.marks or 0
    q_result = pick_question(db, user.id, paper.subject_id, item.module_no, target_marks, item.blooms_level or "", paper.semester or "", paper.exam_type, False)
    
    if not q_result:
        raise HTTPException(status_code=404, detail="No alternative found")
    
    # Handle combined questions for replacement
    question_id = None
    question_text = None
    is_combined = isinstance(q_result, list)
    
    if is_combined:
        # Combined questions - create a merged text
        combined_texts = [q.text for q in q_result if q.text]
        question_text = " [COMBINED] " + " ".join(combined_texts[:2])  # Limit to 2 for readability
        # Use first question's ID as reference
        question_id = q_result[0].id if q_result else None
    elif q_result:
        question_id = q_result.id
        question_text = q_result.text
    
    item.replaced_by_question_id = question_id
    item.question_id = question_id
    item.accepted = False
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return PaperItemResponse(
        position=item.position, 
        subpart=item.subpart, 
        module_no=item.module_no, 
        marks=item.marks, 
        blooms_level=item.blooms_level, 
        question_id=question_id, 
        question_text=question_text,
        accepted=item.accepted
    )

@router.get("/{paper_id}/details")
def get_paper_details(paper_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    paper = db.query(QuestionPaper).filter(QuestionPaper.id == paper_id, QuestionPaper.user_id == user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    items = db.query(QuestionPaperItem).filter(QuestionPaperItem.paper_id == paper_id).all()
    details = []
    for item in items:
        q_text = ""
        if item.question_id:
            q = db.get(Question, item.question_id)
            if q:
                q_text = q.text
        details.append({"position": item.position, "subpart": item.subpart, "module_no": item.module_no, "marks": item.marks, "blooms_level": item.blooms_level, "question_id": item.question_id, "question_text": q_text, "accepted": item.accepted})
    return {"paper_id": paper.id, "subject_id": paper.subject_id, "class_name": paper.class_name, "exam_type": paper.exam_type, "semester": paper.semester, "items": details}

@router.get("/{paper_id}/export")
def export_paper(paper_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    paper = db.query(QuestionPaper).filter(QuestionPaper.id == paper_id, QuestionPaper.user_id == user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    items = db.query(QuestionPaperItem).filter(QuestionPaperItem.paper_id == paper_id).all()
    content = f"Question Paper - {paper.exam_type}\nClass: {paper.class_name}\nSemester: {paper.semester or 'N/A'}\n\n"
    for item in items:
        if item.question_id:
            q = db.get(Question, item.question_id)
            if q:
                part = item.subpart or ""
                # Check if it's a combined question
                if "[COMBINED]" in (q.text or ""):
                    content += f"{part}. {q.text}\n   Marks: {item.marks}, Bloom's: {item.blooms_level} [Combined Question]\n\n"
                else:
                    content += f"{part}. {q.text}\n   Marks: {item.marks}, Bloom's: {item.blooms_level}\n\n"
    return {"filename": f"paper_{paper.id}.txt", "content": content}

@router.get("/", response_model=list[PaperResponse])
def list_papers(subject_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    papers = db.query(QuestionPaper).filter(QuestionPaper.user_id == user.id, QuestionPaper.subject_id == subject_id).all()
    result = []
    for p in papers:
        items = db.query(QuestionPaperItem).filter(QuestionPaperItem.paper_id == p.id).all()
        # Include question texts in the response
        response_items = []
        for i in items:
            question_text = None
            if i.question_id:
                q = db.get(Question, i.question_id)
                if q:
                    question_text = q.text
            response_items.append(PaperItemResponse(
                position=i.position, 
                subpart=i.subpart, 
                module_no=i.module_no, 
                marks=i.marks, 
                blooms_level=i.blooms_level, 
                question_id=i.question_id, 
                question_text=question_text,
                accepted=i.accepted
            ))
        result.append(PaperResponse(paper_id=p.id, items=response_items))
    return result