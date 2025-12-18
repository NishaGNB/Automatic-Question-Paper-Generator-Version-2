from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
from .config import settings

engine = create_engine(settings.db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    department = Column(String(100))
    contact_number = Column(String(30))
    created_at = Column(DateTime, default=datetime.utcnow)
    subjects = relationship("Subject", back_populates="user")

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    class_name = Column(String(100), nullable=False)
    semester = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="subjects")
    questions = relationship("Question", back_populates="subject")
    papers = relationship("QuestionPaper", back_populates="subject")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    text = Column(Text, nullable=False)
    module_no = Column(Integer)
    marks = Column(Integer)
    blooms_level = Column(String(10))
    verified = Column(Boolean, default=False)
    used_count = Column(Integer, default=0)
    last_used_semester = Column(String(50))
    last_used_exam_type = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    subject = relationship("Subject", back_populates="questions")

class QuestionPaper(Base):
    __tablename__ = "question_papers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_name = Column(String(100), nullable=False)
    exam_type = Column(String(50), nullable=False)
    semester = Column(String(50))
    structure = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    subject = relationship("Subject", back_populates="papers")
    items = relationship("QuestionPaperItem", back_populates="paper")

class QuestionPaperItem(Base):
    __tablename__ = "question_paper_items"
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    position = Column(Integer, nullable=False)
    subpart = Column(String(5))
    module_no = Column(Integer)
    marks = Column(Integer)
    blooms_level = Column(String(10))
    question_id = Column(Integer, ForeignKey("questions.id"))
    accepted = Column(Boolean, default=False)
    replaced_by_question_id = Column(Integer, ForeignKey("questions.id"))
    paper = relationship("QuestionPaper", back_populates="items")

def init_db():
    Base.metadata.create_all(bind=engine)
