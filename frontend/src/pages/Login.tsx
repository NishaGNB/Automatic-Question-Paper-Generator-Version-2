import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const { setToken } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Validate inputs
    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }
    
    try {
      const data = await api('/auth/login', { 
        method: 'POST', 
        body: JSON.stringify({ email, password }) 
      })
      setToken(data.access_token)
      nav('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      // Provide more user-friendly error messages
      if (err.message.includes('ECONNREFUSED')) {
        setError('Unable to connect to the server. Please make sure the backend is running.')
      } else if (err.message.includes('401')) {
        setError('Invalid email or password.')
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Failed to log in. Please try again.')
      }
      setLoading(false)
    }
  }
  
  return (
    <div className="row" style={{ justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 450, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="icon-circle" style={{ margin: '0 auto 16px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
          </div>
          <h1 className="section-title" style={{ margin: 0 }}>Welcome back</h1>
          <p className="subtitle" style={{ margin: '4px 0 0 0' }}>Sign in to your account</p>
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
          
          <div className="input-group">
            <label className="label">Email</label>
            <input 
              className="input" 
              type="email" 
              placeholder="email@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
            />
          </div>
          
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
          
          <div className="row" style={{ gap: 12 }}>
            <button className="btn btn-primary" type="submit" style={{ flex: 1 }} disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <p className="label" style={{ margin: 0 }}>
              Don't have an account? <Link to="/signup" style={{ fontWeight: 500 }}>Sign up</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}