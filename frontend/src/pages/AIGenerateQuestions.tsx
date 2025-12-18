import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api'

type Subject = { id: number, name: string }

export default function AIGenerateQuestions() {
  const { token } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [marks, setMarks] = useState(5)
  const [bloomsLevel, setBloomsLevel] = useState('Remember')
  const [provider, setProvider] = useState('openai')
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiStatus, setAiStatus] = useState<{openai_available: boolean, gemini_available: boolean} | null>(null)

  useEffect(() => { 
    loadSubjects() 
    checkAIStatus()
  }, [])

  async function loadSubjects() {
    try {
      const data = await api('/subjects/', {}, token)
      setSubjects(data)
      if (data.length) setSubjectId(data[0].id)
    } catch (err: any) {
      console.error('Failed to load subjects:', err)
      setError('Failed to load subjects: ' + (err.message || 'Unknown error'))
    }
  }

  async function checkAIStatus() {
    try {
      const status = await api('/questions/ai-status', {}, token)
      setAiStatus(status)
    } catch (err: any) {
      console.error('Failed to check AI status:', err)
    }
  }

  async function generateQuestions() {
    if (!subjectId) {
      setError('Please select a subject')
      return
    }
    
    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Get subject name from ID
      const subject = subjects.find(s => s.id === subjectId)
      const subjectName = subject ? subject.name : 'Unknown Subject'
      
      const payload = {
        subject: subjectName,
        topic: topic.trim(),
        num_questions: numQuestions,
        marks: marks,
        blooms_level: bloomsLevel,
        provider: provider
      }
      
      const response = await api('/questions/ai-generate', { 
        method: 'POST', 
        body: JSON.stringify(payload) 
      }, token)
      
      setGeneratedQuestions(response.questions)
    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get Bloom's level description
  const getBloomsDescription = (level: string) => {
    const descriptions: Record<string, string> = {
      "Remember": "Recall facts and basic concepts",
      "Understand": "Explain ideas or concepts",
      "Apply": "Use information in new situations",
      "Analyze": "Draw connections among ideas",
      "Evaluate": "Justify a stand or decision",
      "Create": "Produce new or original work"
    };
    return descriptions[level] || "";
  };

  // Helper function to get marks guidance
  const getMarksGuidance = (marks: number) => {
    if (marks <= 2) return "Short answer (1-2 sentences)";
    if (marks <= 5) return "Medium answer (2-4 sentences)";
    if (marks <= 10) return "Long answer (4-8 sentences)";
    return "Essay-type answer (8+ sentences)";
  };

  return (
    <div className="card">
      <h2 className="section-title">AI-Powered Question Generation</h2>
      <p className="subtitle">
        Generate educational questions based on Bloom's Taxonomy levels and mark distribution
      </p>
      
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}
      
      <div className="grid" style={{ maxWidth: 800 }}>
        <div className="row">
          <select 
            className="select" 
            value={subjectId || ''} 
            onChange={e => setSubjectId(Number(e.target.value))}
            disabled={loading}
          >
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          
          <input 
            className="input" 
            placeholder="Enter topic (e.g., Photosynthesis, Newton's Laws)" 
            value={topic} 
            onChange={e => setTopic(e.target.value)} 
            disabled={loading}
          />
        </div>
        
        <div className="row">
          <div className="col">
            <label className="label">Bloom's Taxonomy Level</label>
            <select 
              className="select" 
              value={bloomsLevel} 
              onChange={e => setBloomsLevel(e.target.value)}
              disabled={loading}
            >
              <option value="Remember">Remember - {getBloomsDescription("Remember")}</option>
              <option value="Understand">Understand - {getBloomsDescription("Understand")}</option>
              <option value="Apply">Apply - {getBloomsDescription("Apply")}</option>
              <option value="Analyze">Analyze - {getBloomsDescription("Analyze")}</option>
              <option value="Evaluate">Evaluate - {getBloomsDescription("Evaluate")}</option>
              <option value="Create">Create - {getBloomsDescription("Create")}</option>
            </select>
          </div>
          
          <div className="col">
            <label className="label">Marks per Question</label>
            <input 
              className="input" 
              type="number" 
              placeholder="Marks" 
              value={marks} 
              onChange={e => setMarks(Number(e.target.value))} 
              min="1"
              max="20"
              disabled={loading}
            />
            {marks > 0 && (
              <div className="label" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                {getMarksGuidance(marks)}
              </div>
            )}
          </div>
          
          <div className="col">
            <label className="label">Number of Questions</label>
            <input 
              className="input" 
              type="number" 
              placeholder="Count" 
              value={numQuestions} 
              onChange={e => setNumQuestions(Number(e.target.value))} 
              min="1"
              max="20"
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="row">
          <div className="col">
            <label className="label">AI Provider</label>
            <select 
              className="select" 
              value={provider} 
              onChange={e => setProvider(e.target.value)}
              disabled={loading || !aiStatus}
            >
              <option value="" disabled>Select AI Provider</option>
              {aiStatus?.openai_available && (
                <option value="openai">OpenAI (GPT)</option>
              )}
              {aiStatus?.gemini_available && (
                <option value="gemini">Google Gemini</option>
              )}
              {!aiStatus?.openai_available && !aiStatus?.gemini_available && (
                <option value="" disabled>No AI providers configured</option>
              )}
            </select>
          </div>
        </div>
        
        <div>
          <button 
            className="btn btn-primary" 
            onClick={generateQuestions} 
            disabled={loading || (aiStatus ? (!aiStatus.openai_available && !aiStatus.gemini_available) : false)}
            style={{ minWidth: 200 }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                Generating with AI...
              </>
            ) : (
              'Generate Questions'
            )}
          </button>
          
          {aiStatus && !aiStatus.openai_available && !aiStatus.gemini_available && (
            <div className="alert alert-warning" style={{ marginTop: 16 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              No AI providers are configured. Please set up OpenAI or Gemini API keys in the backend.
            </div>
          )}
        </div>
      </div>
      
      {generatedQuestions.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="section-title">Generated Questions</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn"
                onClick={() => {
                  // Copy to clipboard
                  navigator.clipboard.writeText(generatedQuestions.join('\n'))
                }}
                style={{ padding: '6px 12px' }}
              >
                Copy All
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setGeneratedQuestions([])}
                style={{ padding: '6px 12px' }}
              >
                Generate More
              </button>
            </div>
          </div>
          
          <div className="card" style={{ backgroundColor: 'var(--light-gray-50)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, padding: '8px 0' }}>
              <div className="label">
                Subject: {subjects.find(s => s.id === subjectId)?.name || 'N/A'} | 
                Topic: {topic || 'N/A'} | 
                Marks: {marks} | 
                Bloom's: {bloomsLevel}
              </div>
            </div>
            
            <ol style={{ paddingLeft: 20 }}>
              {generatedQuestions.map((question, index) => (
                <li key={index} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div>{question}</div>
                    <button 
                      className="btn btn-outline"
                      onClick={() => navigator.clipboard.writeText(question)}
                      style={{ padding: '2px 6px', fontSize: '0.8rem', minWidth: 'auto' }}
                    >
                      Copy
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
      
      {generatedQuestions.length === 0 && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="icon-circle" style={{ margin: '0 auto 16px', width: 48, height: 48 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h4 style={{ margin: '0 0 8px 0' }}>AI Question Generator</h4>
          <p className="label" style={{ margin: 0 }}>
            Fill in the form above to generate educational questions tailored to your specifications
          </p>
        </div>
      )}
    </div>
  )
}