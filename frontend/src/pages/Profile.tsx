import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api'

export default function Profile() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [contact_number, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  async function load() {
    const p = await api('/auth/me', {}, token)
    setProfile(p)
    setName(p.name || '')
    setDepartment(p.department || '')
    setContact(p.contact_number || '')
    setEmail(p.email || '')
  }
  
  useEffect(() => { load() }, [])
  
  async function save() {
    try {
      const p = await api('/auth/me', { method: 'PUT', body: JSON.stringify({ name, department, contact_number }) }, token)
      setProfile(p)
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(null), 5000)
    }
  }
  
  if (!profile) return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div className="spinner"></div>
      </div>
    </div>
  )
  
  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div className="icon-circle" style={{ width: 60, height: 60, fontSize: 24 }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="section-title" style={{ margin: 0 }}>{name}</h1>
              <p className="label" style={{ margin: '4px 0 0 0' }}>{email}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h2 className="section-title">Edit Profile</h2>
          
          {message && (
            <div className="alert alert-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              {message}
            </div>
          )}
          
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
          
          <div className="form-row">
            <div className="form-col">
              <div className="input-group">
                <label className="label">Full Name</label>
                <input 
                  className="input" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-col">
              <div className="input-group">
                <label className="label">Email Address</label>
                <input 
                  className="input" 
                  value={email} 
                  disabled
                  style={{ backgroundColor: 'var(--light-gray-50)' }}
                />
                <p className="label" style={{ marginTop: 4, fontSize: '0.8rem' }}>
                  Email cannot be changed
                </p>
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-col">
              <div className="input-group">
                <label className="label">Department</label>
                <input 
                  className="input" 
                  value={department} 
                  onChange={e => setDepartment(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="form-col">
              <div className="input-group">
                <label className="label">Contact Number</label>
                <input 
                  className="input" 
                  value={contact_number} 
                  onChange={e => setContact(e.target.value)} 
                />
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: 24 }}>
            <button className="btn btn-primary" onClick={save}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}