import { useEffect, useState, useRef } from 'react'
import { IconUpload } from '../components/Icons'
import { useAuth } from '../auth/AuthContext'
import { API_BASE, api } from '../api'

type Subject = { id: number, name: string }
type Question = { id: number, text: string, module_no?: number, marks?: number, blooms_level?: string, verified: boolean }

export default function UploadQuestions() {
  const { token } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [uploaded, setUploaded] = useState<Question[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [previewLines, setPreviewLines] = useState<string[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  
  useEffect(() => { loadSubjects() }, [])
  
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
  
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement> | File) {
    const f = (e as any).target ? (e as React.ChangeEvent<HTMLInputElement>).target.files?.[0] : (e as File)
    if (!f) return
    
    if (!subjectId) {
      setError('Please select a subject first')
      return
    }
    
    setError(null)
    setUploading(true)
    
    try {
      const form = new FormData()
      form.append('file', f)
      form.append('subject_id', String(subjectId))
      
      const res = await fetch(`${API_BASE}/questions/upload`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token || ''}` }, 
        body: form 
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || `Upload failed with status ${res.status}`)
      }
      
      const data = await res.json()
      setUploaded(data)
      setPreviewLines(null)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(ev: React.DragEvent) {
    ev.preventDefault()
    setDragOver(false)
    const f = ev.dataTransfer.files?.[0]
    if (f) {
      readPreviewAndUpload(f)
    }
  }

  function readPreviewAndUpload(f: File) {
    if (f.type === 'text/csv' || f.name.toLowerCase().endsWith('.csv') || f.type.startsWith('text')) {
      const r = new FileReader()
      r.onload = () => {
        try {
          const txt = r.result as string
          const lines = txt.split(/\r?\n/).slice(0, 10).filter(Boolean)
          setPreviewLines(lines)
        } catch (err) {
          setPreviewLines([`Error reading file: ${err}`])
        }
      }
      r.readAsText(f)
    } else {
      setPreviewLines([`File ${f.name} selected — will be uploaded.`])
    }
    // auto-upload after preview
    onFileChange(f)
  }
  
  async function verify(q: Question) {
    try {
      const upd = await api(`/questions/${q.id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ verified: true }) 
      }, token)
      setUploaded(uploaded.map(x => x.id === q.id ? upd : x))
    } catch (err: any) {
      console.error('Verify error:', err)
      setError('Failed to verify question: ' + (err.message || 'Unknown error'))
    }
  }
  
  return (
    <div className="grid">
      <div className="card">
        <h2 className="section-title">Upload Question Bank</h2>
        
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
        
        <div className="row">
          <select 
            className="select" 
            value={subjectId || ''} 
            onChange={e => setSubjectId(Number(e.target.value))}
            disabled={uploading}
          >
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{ 
              flex: 1, 
              border: dragOver ? '2px dashed var(--primary)' : '2px dashed var(--border)', 
              borderRadius: 8, 
              padding: 16, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              backgroundColor: dragOver ? 'var(--primary-50)' : 'transparent'
            }}
          >
            <input 
              ref={fileRef} 
              style={{ display: 'none' }} 
              type="file" 
              accept=".csv,.txt,.md,.pdf,.docx" 
              onChange={onFileChange} 
              disabled={uploading}
            />
            <button 
              className="btn btn-primary" 
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                  Uploading...
                </>
              ) : (
                <>
                  <IconUpload />
                  Choose File
                </>
              )}
            </button>
            <div style={{ color: 'var(--text-secondary)', fontSize: '.9rem' }}>
              Drag & drop or click to select a file<br />
              <span style={{ fontSize: '.8rem' }}>Supports CSV, TXT, DOCX, PDF files</span>
            </div>
          </div>
        </div>
        
        {previewLines && (
          <div style={{ marginTop: 16 }}>
            <div className="label">Preview (first lines)</div>
            <pre className="textarea" style={{ 
              whiteSpace: 'pre-wrap', 
              maxHeight: 200, 
              overflowY: 'auto',
              fontSize: '0.85rem'
            }}>
              {previewLines.join('\n')}
            </pre>
          </div>
        )}
        
        <div style={{ marginTop: 20, padding: 16, backgroundColor: 'var(--light-gray-50)', borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 12px 0' }}>How to format your question bank:</h4>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>
              <strong>CSV format:</strong> Include a column named "question_text" or "text" with your questions
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Text files:</strong> One question per line
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>DOCX/PDF:</strong> Questions will be extracted from document text
            </li>
            <li>
              After upload, questions will be automatically categorized by module, marks, and Bloom's level
            </li>
          </ul>
        </div>
      </div>
      
      {uploaded.length > 0 && (
        <div className="card">
          <h3 className="section-title">Uploaded Questions ({uploaded.length})</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Text</th>
                  <th>Module</th>
                  <th>Marks</th>
                  <th>Bloom's Level</th>
                  <th>Verified</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {uploaded.map(q => (
                  <tr key={q.id}>
                    <td style={{ maxWidth: 400 }}>{q.text}</td>
                    <td>{q.module_no ?? '—'}</td>
                    <td>{q.marks ?? '—'}</td>
                    <td>{q.blooms_level ?? '—'}</td>
                    <td>{q.verified ? 'Yes' : 'No'}</td>
                    <td>
                      {!q.verified && (
                        <button 
                          className="btn btn-success" 
                          onClick={() => verify(q)}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          Verify
                        </button>
                      )}
                      {q.verified && (
                        <span style={{ color: 'var(--accent-green-600)', fontWeight: 500 }}>
                          Verified
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {uploaded.length === 0 && !uploading && !error && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="icon-circle" style={{ margin: '0 auto 16px', width: 48, height: 48 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h4 style={{ margin: '0 0 8px 0' }}>No Questions Uploaded Yet</h4>
            <p className="label" style={{ margin: 0 }}>
              Upload a question bank file to get started with paper generation
            </p>
          </div>
        </div>
      )}
    </div>
  )
}