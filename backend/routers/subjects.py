from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal, Subject
from ..schemas import SubjectCreateRequest, SubjectResponse
from .auth import get_current_user

router = APIRouter(prefix="/subjects", tags=["subjects"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=SubjectResponse)
def create_subject(payload: SubjectCreateRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    subject = Subject(user_id=user.id, name=payload.name, class_name=payload.class_name, semester=payload.semester)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return SubjectResponse(id=subject.id, name=subject.name, class_name=subject.class_name, semester=subject.semester)

@router.get("/", response_model=list[SubjectResponse])
def list_subjects(db: Session = Depends(get_db), user=Depends(get_current_user)):
    subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
    return [SubjectResponse(id=s.id, name=s.name, class_name=s.class_name, semester=s.semester) for s in subjects]

@router.delete("/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(subject)
    db.commit()
    return {"ok": True}
