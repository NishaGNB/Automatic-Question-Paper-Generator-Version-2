import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type AuthCtx = {
  token: string | null
  setToken: (t: string | null) => void
  logout: () => void
}

const Ctx = createContext<AuthCtx>({ token: null, setToken: () => {}, logout: () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const navigate = useNavigate()
  
  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) setToken(t)
    
    // Listen for token expiration events
    const handleTokenExpired = () => {
      setToken(null)
      localStorage.removeItem('token')
      navigate('/login')
    }
    
    window.addEventListener('tokenExpired', handleTokenExpired)
    
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired)
    }
  }, [navigate])

  function update(t: string | null) {
    setToken(t)
    if (t) localStorage.setItem('token', t)
    else localStorage.removeItem('token')
  }
  
  function logout() {
    update(null)
    navigate('/login')
  }
  
  return <Ctx.Provider value={{ token, setToken: update, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  return useContext(Ctx)
}