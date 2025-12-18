import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api'

type Subject = { id: number, name: string }
type Item = { position: number, module_no: number, subparts: { label: string, marks: number, blooms_level: string }[] }
type GeneratedItem = { 
  position: number, 
  subpart?: string, 
  module_no?: number, 
  marks?: number, 
  blooms_level?: string, 
  question_id?: number, 
  question_text?: string,
  accepted: boolean 
}

export default function GeneratePaper() {
  const { token } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [className, setClassName] = useState('')
  const [semester, setSemester] = useState('')
  const [examType, setExamType] = useState('Mid')
  const [structureJSON, setStructureJSON] = useState('[]')
  const [paperId, setPaperId] = useState<number | null>(null)
  const [items, setItems] = useState<GeneratedItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => { loadSubjects() }, [])
  
  useEffect(() => {
    // Try to pre-load saved structure from Structure builder (localStorage)
    const saved = localStorage.getItem('aqpgs_structure')
    if (saved) setStructureJSON(saved)
  }, [])
  
  const nav = useNavigate()
  
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
  
  async function generate() {
    if (!subjectId) {
      setError('Please select a subject')
      return
    }
    
    if (!className) {
      setError('Please enter a class name')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      let structure: Item[] = []
      try {
        structure = JSON.parse(structureJSON)
      } catch (parseError) {
        throw new Error('Invalid JSON structure. Please check your structure.')
      }
      
      if (!Array.isArray(structure) || structure.length === 0) {
        throw new Error('Structure is empty. Please add questions in the Structure Builder.')
      }
      
      const res = await api('/papers/generate', { 
        method: 'POST', 
        body: JSON.stringify({ 
          subject_id: subjectId, 
          class_name: className, 
          exam_type: examType, 
          semester, 
          structure 
        }) 
      }, token)
      
      setPaperId(res.paper_id)
      setItems(res.items)
    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate paper. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  async function accept(it: GeneratedItem) {
    if (!paperId) return
    
    try {
      await api(`/papers/${paperId}/accept?position=${it.position}${it.subpart ? `&subpart=${encodeURIComponent(it.subpart)}` : ''}`, { method: 'POST' }, token)
      setItems(items.map(x => x === it ? { ...x, accepted: true } : x))
    } catch (err: any) {
      console.error('Accept error:', err)
      setError('Failed to accept question: ' + (err.message || 'Unknown error'))
    }
  }
  
  async function replace(it: GeneratedItem) {
    if (!paperId) return
    
    try {
      const r = await api(`/papers/${paperId}/replace`, { 
        method: 'POST', 
        body: JSON.stringify({ position: it.position, subpart: it.subpart }) 
      }, token)
      setItems(items.map(x => x === it ? r : x))
    } catch (err: any) {
      console.error('Replace error:', err)
      setError('Failed to replace question: ' + (err.message || 'Unknown error'))
    }
  }
  
  return (
    <div className="card">
      <h2 className="section-title">Generate Paper</h2>
      
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
      
      <div className="grid" style={{ maxWidth: 700 }}>
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
            placeholder="Class/Section" 
            value={className} 
            onChange={e => setClassName(e.target.value)} 
            disabled={loading}
          />
          <input 
            className="input" 
            placeholder="Semester" 
            value={semester} 
            onChange={e => setSemester(e.target.value)} 
            disabled={loading}
          />
          <input 
            className="input" 
            placeholder="Exam Type" 
            value={examType} 
            onChange={e => setExamType(e.target.value)} 
            disabled={loading}
          />
        </div>
        <div className="grid">
          <label className="label">Structure JSON</label>
          <textarea 
            className="textarea" 
            placeholder="[]" 
            value={structureJSON} 
            onChange={e => setStructureJSON(e.target.value)} 
            disabled={loading}
            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={generate} 
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                Generating...
              </>
            ) : (
              'Generate Paper'
            )}
          </button>
          <button 
            className="btn" 
            onClick={() => { 
              const s = localStorage.getItem('aqpgs_structure'); 
              if (s) setStructureJSON(s); 
              else alert('No saved structure found. Open Structure page to save one.') 
            }}
            disabled={loading}
          >
            Load From Structure Builder
          </button>
          <button 
            className="btn" 
            onClick={() => nav('/structure')}
            disabled={loading}
          >
            Open Structure Builder
          </button>
        </div>
      </div>
      
      {items.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 className="section-title">Generated Questions</h3>
          <div style={{ marginBottom: 12, padding: 12, backgroundColor: 'var(--primary-50)', borderRadius: 8, border: '1px solid var(--primary-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-700)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <strong style={{ color: 'var(--primary-800)' }}>Intelligent Question Combination</strong>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--primary-700)' }}>
              When higher-mark questions aren't available, the system intelligently combines lower-mark questions to meet your requirements.
            </p>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Module</th>
                  <th>Marks</th>
                  <th>Bloom's Level</th>
                  <th>Question</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.subpart || ''}</td>
                    <td>{it.module_no || ''}</td>
                    <td>{it.marks || ''}</td>
                    <td>{it.blooms_level || ''}</td>
                    <td style={{ maxWidth: 400 }}>
                      {it.question_text ? (
                        <div>
                          {it.question_text}
                          {it.question_text.includes('[COMBINED]') && (
                            <span style={{ 
                              display: 'inline-block', 
                              marginLeft: 8, 
                              padding: '2px 6px', 
                              backgroundColor: 'var(--accent-yellow-100)', 
                              color: 'var(--accent-yellow-800)', 
                              borderRadius: 4, 
                              fontSize: '0.75rem' 
                            }}>
                              Combined
                            </span>
                          )}
                        </div>
                      ) : it.question_id ? `Loading... (${it.question_id})` : 'No question assigned'}
                    </td>
                    <td>
                      {it.accepted ? (
                        <span style={{ color: 'var(--accent-green-600)', fontWeight: 500 }}>Accepted</span>
                      ) : (
                        <span style={{ color: 'var(--accent-red-600)', fontWeight: 500 }}>Pending</span>
                      )}
                    </td>
                    <td className="row" style={{ gap: 8 }}>
                      <button 
                        className="btn btn-success" 
                        onClick={() => accept(it)}
                        disabled={it.accepted}
                      >
                        {it.accepted ? 'Accepted' : 'Accept'}
                      </button>
                      <button 
                        className="btn" 
                        onClick={() => replace(it)}
                      >
                        Replace
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {items.length === 0 && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="icon-circle" style={{ margin: '0 auto 16px', width: 48, height: 48 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h4 style={{ margin: '0 0 8px 0' }}>No Paper Generated Yet</h4>
          <p className="label" style={{ margin: 0 }}>
            Fill in the form above and click "Generate Paper" to create a question paper
          </p>
        </div>
      )}
    </div>
  )
}