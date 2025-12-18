import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api'

type Subject = { id: number, name: string, class_name: string, semester?: string }

export default function Subjects() {
  const { token } = useAuth()
  const [list, setList] = useState<Subject[]>([])
  const [name, setName] = useState('')
  const [class_name, setClassName] = useState('')
  const [semester, setSemester] = useState('')
  
  async function load() {
    const data = await api('/subjects/', {}, token)
    setList(data)
  }
  
  useEffect(() => { load() }, [])
  
  async function add() {
    if (!name || !class_name) return;
    
    const s = await api('/subjects/', { method: 'POST', body: JSON.stringify({ name, class_name, semester }) }, token)
    setList([...list, s])
    setName('')
    setClassName('')
    setSemester('')
  }
  
  async function del(id: number) {
    await api(`/subjects/${id}`, { method: 'DELETE' }, token)
    setList(list.filter(x => x.id !== id))
  }
  
  return (
    <div className="grid">
      <div className="card">
        <h2 className="section-title">Manage Subjects</h2>
        <p className="subtitle">Add and organize your subjects for question paper generation</p>
        
        <div className="form-row">
          <div className="form-col">
            <div className="input-group">
              <label className="label">Subject Name</label>
              <input 
                className="input" 
                placeholder="Mathematics, Physics, etc." 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="form-col">
            <div className="input-group">
              <label className="label">Class/Section</label>
              <input 
                className="input" 
                placeholder="Class 10, Section A, etc." 
                value={class_name} 
                onChange={e => setClassName(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="form-col">
            <div className="input-group">
              <label className="label">Semester (optional)</label>
              <input 
                className="input" 
                placeholder="Semester 1, Spring, etc." 
                value={semester} 
                onChange={e => setSemester(e.target.value)} 
              />
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={add} disabled={!name || !class_name}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Subject
          </button>
        </div>
      </div>
      
      <div className="card">
        <h3 className="section-title">Your Subjects</h3>
        
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="icon-circle" style={{ margin: '0 auto 16px', width: 48, height: 48 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <h4 style={{ margin: '0 0 8px 0' }}>No subjects added yet</h4>
            <p className="label" style={{ margin: 0 }}>Add your first subject to get started</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Class/Section</th>
                  <th>Semester</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.class_name}</td>
                    <td>{s.semester || '-'}</td>
                    <td>
                      <button className="btn btn-danger btn-icon" onClick={() => del(s.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}