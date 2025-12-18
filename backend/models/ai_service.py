import openai
import google.generativeai as genai
from typing import Optional, List
from ..config import settings
import re

class AIService:
    def __init__(self):
        # Initialize OpenAI client if API key is provided
        if settings.openai_api_key:
            self.openai_client = openai.OpenAI(api_key=settings.openai_api_key)
        else:
            self.openai_client = None
            
        # Initialize Gemini client if API key is provided
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.gemini_model = genai.GenerativeModel(settings.gemini_model)
        else:
            self.gemini_model = None
    
    def is_openai_available(self) -> bool:
        """Check if OpenAI API is configured and available"""
        return self.openai_client is not None
    
    def is_gemini_available(self) -> bool:
        """Check if Gemini API is configured and available"""
        return self.gemini_model is not None
    
    def _clean_questions(self, questions: List[str]) -> List[str]:
        """Clean and filter questions to ensure quality"""
        cleaned = []
        for question in questions:
            # Strip whitespace
            q = question.strip()
            
            # Skip empty questions
            if not q:
                continue
                
            # Skip questions that are too short
            if len(q) < 10:
                continue
                
            # Skip questions that look like instructions or meta-text
            if any(keyword in q.lower() for keyword in ['question', 'generate', 'following', 'below', 'above']):
                # But allow these words if they're part of an actual question
                if not re.match(r'^.*(question\s+\d+|generate\s+\d+).*$', q.lower()):
                    continue
            
            # Remove numbering if present at the beginning
            q = re.sub(r'^\d+[\.\)]?\s*', '', q)
            
            # Remove markdown-style formatting
            q = re.sub(r'^[*\-]\s*', '', q)
            
            # Ensure it ends with proper punctuation
            if q and q[-1] not in '.!?':
                q += '?'
                
            # Add to cleaned list if it passes all filters
            if q and len(q) >= 10:
                cleaned.append(q)
                
        return cleaned
    
    def generate_questions_openai(self, prompt: str, num_questions: int = 5) -> List[str]:
        """Generate questions using OpenAI API"""
        if not self.is_openai_available():
            raise ValueError("OpenAI API key not configured")
        
        try:
            response = self.openai_client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "You are an expert educational question designer specializing in creating exam questions. Your task is to generate high-quality educational questions based on the specified parameters. Follow the specified Bloom's taxonomy level and marks distribution precisely."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                n=1,
                temperature=0.7,
                frequency_penalty=0.3,
                presence_penalty=0.3
            )
            
            # Extract questions from the response
            content = response.choices[0].message.content.strip()
            
            # Split by newlines and filter out empty lines
            raw_questions = [q.strip() for q in content.split('\n') if q.strip() and not q.strip().startswith('#')]
            
            # Clean and filter questions
            questions = self._clean_questions(raw_questions)
            
            # Return up to num_questions
            return questions[:num_questions]
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    def generate_questions_gemini(self, prompt: str, num_questions: int = 5) -> List[str]:
        """Generate questions using Google Gemini API"""
        if not self.is_gemini_available():
            raise ValueError("Gemini API key not configured")
        
        try:
            prompt_with_instruction = f"You are an expert educational question designer specializing in creating exam questions. Your task is to generate high-quality educational questions based on the specified parameters. Follow the specified Bloom's taxonomy level and marks distribution precisely.\n\n{prompt}"
            
            response = self.gemini_model.generate_content(
                prompt_with_instruction,
                generation_config=genai.types.GenerationConfig(
                    candidate_count=1,
                    max_output_tokens=1500,
                    temperature=0.7
                )
            )
            
            # Parse the response to extract individual questions
            content = response.text.strip()
            raw_questions = [q.strip() for q in content.split('\n') if q.strip() and not q.strip().startswith('#')]
            
            # Clean and filter questions
            questions = self._clean_questions(raw_questions)
            
            # Return up to num_questions
            return questions[:num_questions]
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    def generate_questions(self, prompt: str, num_questions: int = 5, provider: str = "openai") -> List[str]:
        """Generate questions using the specified AI provider"""
        if provider == "openai" and self.is_openai_available():
            return self.generate_questions_openai(prompt, num_questions)
        elif provider == "gemini" and self.is_gemini_available():
            return self.generate_questions_gemini(prompt, num_questions)
        else:
            raise ValueError(f"Selected provider '{provider}' not available or not configured")

# Global instance
ai_service = AIService()