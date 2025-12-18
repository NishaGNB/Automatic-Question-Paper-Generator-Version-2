from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import SessionLocal, User
from ..schemas import SignupRequest, LoginRequest, TokenResponse, ProfileResponse, ProfileUpdateRequest
from ..utils.auth import hash_password, verify_password, create_access_token, decode_token
import jwt
from jwt import ExpiredSignatureError

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=payload.name, email=payload.email, password_hash=hash_password(payload.password), department=payload.department, contact_number=payload.contact_number)
    db.add(user)
    db.flush()
    user_id = user.id
    db.commit()
    token = create_access_token(user_id)
    return TokenResponse(access_token=token)

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.id)
    return TokenResponse(access_token=token)

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        user_id = decode_token(token)
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me", response_model=ProfileResponse)
def me(user: User = Depends(get_current_user)):
    return ProfileResponse(id=user.id, name=user.name, email=user.email, department=user.department, contact_number=user.contact_number)

@router.put("/me", response_model=ProfileResponse)
def update_me(payload: ProfileUpdateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.name is not None:
        user.name = payload.name
    if payload.department is not None:
        user.department = payload.department
    if payload.contact_number is not None:
        user.contact_number = payload.contact_number
    db.add(user)
    db.commit()
    db.refresh(user)
    return ProfileResponse(id=user.id, name=user.name, email=user.email, department=user.department, contact_number=user.contact_number)