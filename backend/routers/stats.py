from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal, Subject, Question, QuestionPaper
from .auth import get_current_user
from ..schemas import StatsResponse, SubjectStats

router = APIRouter(prefix="/stats", tags=["stats"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=StatsResponse)
def stats(db: Session = Depends(get_db), user=Depends(get_current_user)):
    subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
    total_subjects = len(subjects)
    total_questions = db.query(Question).filter(Question.user_id == user.id).count()
    verified_questions = db.query(Question).filter(Question.user_id == user.id, Question.verified.is_(True)).count()
    total_papers = db.query(QuestionPaper).filter(QuestionPaper.user_id == user.id).count()
    subject_stats = []
    for s in subjects:
        tq = db.query(Question).filter(Question.subject_id == s.id).count()
        vq = db.query(Question).filter(Question.subject_id == s.id, Question.verified.is_(True)).count()
        tp = db.query(QuestionPaper).filter(QuestionPaper.subject_id == s.id).count()
        subject_stats.append(SubjectStats(subject_id=s.id, name=s.name, class_name=s.class_name, semester=s.semester, total_questions=tq, verified_questions=vq, total_papers=tp))
    return StatsResponse(total_subjects=total_subjects, total_questions=total_questions, verified_questions=verified_questions, total_papers=total_papers, subjects=subject_stats)
