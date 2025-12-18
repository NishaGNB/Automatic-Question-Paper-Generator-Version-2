# Automated Question Paper Generator System

AQPGS is a comprehensive educational tool that automates the creation of question papers based on Bloom's Taxonomy levels and mark distributions. The system leverages machine learning and AI technologies to categorize questions and generate customized exam papers.

## Features

- **Smart Paper Generation**: Automatically generate question papers based on Bloom's taxonomy levels and mark distribution
- **AI-Powered Question Generation**: Create new questions using OpenAI or Google Gemini APIs
- **Subject Management**: Organize subjects, classes, and semesters in one centralized location
- **Question Bank**: Build and maintain comprehensive question banks with categorization by difficulty and topic
- **Paper Structure Definition**: Define paper structures with sections, marks distribution, and question types
- **Intelligent Question Selection**: Automatically selects appropriate questions based on criteria
- **Export Functionality**: Export generated papers in multiple formats

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite (with SQLAlchemy ORM)
- **Machine Learning**: Scikit-learn for question categorization
- **AI Integration**: OpenAI API and Google Gemini API

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with custom design system

## Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn
- OpenAI API key (optional, for AI features)
- Google Gemini API key (optional, for AI features)

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables (create a `.env` file in the backend directory):
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. Run the backend server:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Access the application at `http://localhost:5173`
2. Sign up for a new account or log in if you already have one
3. Create subjects for your question bank
4. Upload existing questions or generate new ones using AI
5. Define paper structures with specific mark distributions and Bloom's levels
6. Generate question papers based on your specifications
7. Review, accept, or replace questions as needed
8. Export the final paper

## AI Question Generation

The system supports AI-powered question generation using:
- **OpenAI GPT models**
- **Google Gemini models**

To use this feature:
1. Configure your API keys in the backend `.env` file
2. Navigate to the "AI Generate" section in the application
3. Specify subject, topic, Bloom's level, and marks per question
4. Generate questions that match your exact requirements

## Bloom's Taxonomy Levels

The system supports all six levels of Bloom's Taxonomy:
1. **Remember**: Recall facts and basic concepts
2. **Understand**: Explain ideas or concepts
3. **Apply**: Use information in new situations
4. **Analyze**: Draw connections among ideas
5. **Evaluate**: Justify a stand or decision
6. **Create**: Produce new or original work

## Project Structure

```
.
├── backend/                 # Backend API (FastAPI)
│   ├── models/             # ML models and AI service
│   ├── routers/            # API routes
│   ├── scripts/            # Training and utility scripts
│   ├── utils/              # Utility functions
│   ├── config.py           # Configuration
│   ├── database.py         # Database models
│   ├── main.py             # Main application entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # Frontend application (React)
│   ├── src/
│   │   ├── auth/           # Authentication context
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── api.ts          # API client
│   │   └── App.tsx         # Main application component
│   └── index.html          # HTML template
├── questions.csv           # Sample question bank
└── scripts/                # Manual workflow test
```

## API Documentation

Once the backend is running, you can access the interactive API documentation at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Machine Learning Models

The system uses trained ML models for automatic categorization of questions:
- **Bloom's Taxonomy Classifier**: Classifies questions according to Bloom's levels
- **Marks Predictor**: Predicts appropriate marks for questions
- **Module Identifier**: Identifies the module/topic of questions

Models are trained using the scripts in the `backend/scripts/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For support or inquiries, please open an issue on the GitHub repository.
