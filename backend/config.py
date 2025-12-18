import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "AQPGS"
    jwt_secret: str = os.getenv("JWT_SECRET", "change_me")
    jwt_algorithm: str = "HS256"
    db_url: str = os.getenv("DATABASE_URL", "sqlite:///aqpgs.db")
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:3000,http://127.0.0.1:3000")
    
    # AI API Keys
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    
    # AI Model Settings
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-pro")

settings = Settings()