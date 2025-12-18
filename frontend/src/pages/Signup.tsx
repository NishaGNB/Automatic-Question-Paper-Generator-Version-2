import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup() {
  const { setToken } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('')
  const [contact_number, setContact] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Validate inputs
    if (!name || !email || !password || !department || !contact_number) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }
    
    try {
      const data = await api('/auth/signup', { 
        method: 'POST', 
        body: JSON.stringify({ name, email, password, department, contact_number }) 
      })
      setToken(data.access_token)
      nav('/dashboard')
    } catch (err: any) {
      console.error('Signup error:', err)
      // Provide more user-friendly error messages
      if (err.message.includes('ECONNREFUSED')) {
        setError('Unable to connect to the server. Please make sure the backend is running.')
      } else if (err.message.includes('409')) {
        setError('An account with this email already exists.')
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Failed to create account. Please try again.')
      }
      setLoading(false)
    }
  }
  
  return (
    <div className="row" style={{ justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 550, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="icon-circle" style={{ margin: '0 auto 16px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
          <h1 className="section-title" style={{ margin: 0 }}>Create an account</h1>
          <p className="subtitle" style={{ margin: '4px 0 0 0' }}>Get started with AQPGS today</p>
        </div>
        
        <form onSubmit={submit} className="space-y-4">
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
                  placeholder="John Doe" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required
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
                  type="email"
                  placeholder="email@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-col">
              <div className="input-group">
                <label className="label">Password</label>
                <input 
                  className="input" 
                  type="password"
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-col">
              <div className="input-group">
                <label className="label">Department</label>
                <input 
                  className="input" 
                  placeholder="Computer Science" 
                  value={department} 
                  onChange={e => setDepartment(e.target.value)} 
                  required
                />
              </div>
            </div>
            
            <div className="form-col">
              <div className="input-group">
                <label className="label">Contact Number</label>
                <input 
                  className="input" 
                  placeholder="+1 (555) 123-4567" 
                  value={contact_number} 
                  onChange={e => setContact(e.target.value)} 
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="row" style={{ gap: 12 }}>
            <button className="btn btn-primary" type="submit" style={{ flex: 1 }} disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <p className="label" style={{ margin: 0 }}>
              Already have an account? <Link to="/login" style={{ fontWeight: 500 }}>Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}