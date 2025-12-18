from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: Optional[str] = None
    contact_number: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str

class ProfileResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    department: Optional[str] = None
    contact_number: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    contact_number: Optional[str] = None

class SubjectCreateRequest(BaseModel):
    name: str
    class_name: str
    semester: Optional[str] = None

class SubjectResponse(BaseModel):
    id: int
    name: str
    class_name: str
    semester: Optional[str] = None

class QuestionLabel(BaseModel):
    module_no: Optional[int] = None
    marks: Optional[int] = None
    blooms_level: Optional[str] = None

class QuestionCreateRequest(BaseModel):
    subject_id: int
    text: str
    label: QuestionLabel

class QuestionResponse(BaseModel):
    id: int
    subject_id: int
    text: str
    module_no: Optional[int] = None
    marks: Optional[int] = None
    blooms_level: Optional[str] = None
    verified: bool

class QuestionUpdateRequest(BaseModel):
    module_no: Optional[int] = None
    marks: Optional[int] = None
    blooms_level: Optional[str] = None
    verified: Optional[bool] = None

class PaperStructureItem(BaseModel):
    module_no: int
    subparts: List[Dict[str, Any]]

class GeneratePaperRequest(BaseModel):
    subject_id: int
    class_name: str
    exam_type: str
    semester: Optional[str] = None
    structure: List[PaperStructureItem]
    allow_repeat: bool = False

class PaperItemResponse(BaseModel):
    position: int
    subpart: Optional[str] = None
    module_no: Optional[int] = None
    marks: Optional[int] = None
    blooms_level: Optional[str] = None
    question_id: Optional[int] = None
    question_text: Optional[str] = None
    accepted: bool

class PaperResponse(BaseModel):
    paper_id: int
    items: List[PaperItemResponse]

class ReplaceRequest(BaseModel):
    position: int
    subpart: Optional[str] = None

class SubjectStats(BaseModel):
    subject_id: int
    name: str
    class_name: str
    semester: Optional[str] = None
    total_questions: int
    verified_questions: int
    total_papers: int

class StatsResponse(BaseModel):
    total_subjects: int
    total_questions: int
    verified_questions: int
    total_papers: int
    subjects: List[SubjectStats]