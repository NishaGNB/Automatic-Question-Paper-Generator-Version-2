import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import Subjects from './pages/Subjects'
import UploadQuestions from './pages/UploadQuestions'
import PaperStructure from './pages/PaperStructure'
import GeneratePaper from './pages/GeneratePaper'
import PapersList from './pages/PapersList'
import Dashboard from './pages/Dashboard'
import QuestionBank from './pages/QuestionBank'
import AIGenerateQuestions from './pages/AIGenerateQuestions'
import { useAuth } from './auth/AuthContext'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { token, logout } = useAuth()
  const location = useLocation()
  
  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="container">
      <nav className="navbar">
        <div className="brand">AQPGS</div>
        <div className="nav-links">
          <Link className={`nav-link ${isActive('/') ? 'active' : ''}`} to="/">Home</Link>
          {token && <Link className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard">Dashboard</Link>}
          {token && <Link className={`nav-link ${isActive('/profile') ? 'active' : ''}`} to="/profile">Profile</Link>}
          {token && <Link className={`nav-link ${isActive('/subjects') ? 'active' : ''}`} to="/subjects">Subjects</Link>}
          {token && <Link className={`nav-link ${isActive('/upload') ? 'active' : ''}`} to="/upload">Upload</Link>}
          {token && <Link className={`nav-link ${isActive('/question-bank') ? 'active' : ''}`} to="/question-bank">Question Bank</Link>}
          {token && <Link className={`nav-link ${isActive('/structure') ? 'active' : ''}`} to="/structure">Structure</Link>}
          {token && <Link className={`nav-link ${isActive('/generate') ? 'active' : ''}`} to="/generate">Generate</Link>}
          {token && <Link className={`nav-link ${isActive('/ai-generate') ? 'active' : ''}`} to="/ai-generate">AI Generate</Link>}
          {token && <Link className={`nav-link ${isActive('/papers') ? 'active' : ''}`} to="/papers">My Papers</Link>}
          {!token && <Link className={`nav-link ${isActive('/login') ? 'active' : ''}`} to="/login">Login</Link>}
          {!token && <Link className={`nav-link ${isActive('/signup') ? 'active' : ''}`} to="/signup">Signup</Link>}
        </div>
        <div className="spacer" />
        {token && (
          <button className="btn btn-outline" onClick={logout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        )}
      </nav>
      <main className="grid" style={{ marginTop: 20 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/question-bank" element={<PrivateRoute><QuestionBank /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/subjects" element={<PrivateRoute><Subjects /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><UploadQuestions /></PrivateRoute>} />
          <Route path="/structure" element={<PrivateRoute><PaperStructure /></PrivateRoute>} />
          <Route path="/generate" element={<PrivateRoute><GeneratePaper /></PrivateRoute>} />
          <Route path="/ai-generate" element={<PrivateRoute><AIGenerateQuestions /></PrivateRoute>} />
          <Route path="/papers" element={<PrivateRoute><PapersList /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  )
}

function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section style={{ 
        textAlign: 'center', 
        padding: '60px 20px', 
        backgroundColor: 'var(--primary-50)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 30
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 700, 
          color: 'var(--primary-800)',
          marginBottom: '16px',
          lineHeight: 1.2
        }}>
          Automated Question Paper Generator System
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-secondary)',
          maxWidth: 700,
          margin: '0 auto 30px'
        }}>
          Create customized exam papers with Bloom's taxonomy levels and marks distribution in seconds
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/signup" className="btn btn-primary" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8,
            fontSize: '1.1rem',
            padding: '12px 24px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 1-2-2H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Get Started - It's Free
          </Link>
          <Link to="/login" className="btn btn-outline" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8,
            fontSize: '1.1rem',
            padding: '12px 24px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Sign In
          </Link>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="card" style={{ marginBottom: 30 }}>
        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '2rem', 
          fontWeight: 600, 
          marginBottom: 30,
          color: 'var(--text-primary)'
        }}>
          Quick Start Guide
        </h2>
        <div className="grid" style={{ gap: 20 }}>
          <QuickStartStep 
            step={1}
            title="Create a Subject"
            description="Add a new subject (e.g., General Knowledge)"
          />
          <QuickStartStep 
            step={2}
            title="Upload Questions"
            description="Select your subject and upload question bank"
          />
          <QuickStartStep 
            step={3}
            title="Create Paper Structure"
            description="Add questions with modules, marks, and Bloom's levels"
          />
          <QuickStartStep 
            step={4}
            title="Generate Paper"
            description="Select subject and generate question paper"
          />
        </div>
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <Link to="/signup" className="btn btn-primary" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8,
            fontSize: '1.1rem',
            padding: '12px 24px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 1-2-2H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Sign Up Now
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid" style={{ marginBottom: 40 }}>
        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '2rem', 
          fontWeight: 600, 
          marginBottom: 30,
          color: 'var(--text-primary)'
        }}>
          Powerful Features for Educators
        </h2>
        <div className="row">
          <FeatureCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
              </svg>
            }
            title="Smart Paper Generation"
            description="Automatically generate question papers based on Bloom's taxonomy levels and mark distribution."
          />
          <FeatureCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            }
            title="Subject Management"
            description="Organize your subjects, classes, and semesters in one centralized location."
          />
          <FeatureCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            }
            title="Question Bank"
            description="Build and maintain comprehensive question banks with categorization by difficulty and topic."
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="card" style={{ marginBottom: 40 }}>
        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '2rem', 
          fontWeight: 600, 
          marginBottom: 30,
          color: 'var(--text-primary'
        }}>
          How It Works
        </h2>
        <div className="row">
          <StepCard 
            number="1"
            title="Sign Up & Set Up"
            description="Create your account and configure your subjects, classes, and academic structure."
          />
          <StepCard 
            number="2"
            title="Upload Questions"
            description="Import your question bank with Bloom's taxonomy levels and mark allocations."
          />
          <StepCard 
            number="3"
            title="Define Structure"
            description="Specify the paper structure with sections, marks distribution, and question types."
          />
          <StepCard 
            number="4"
            title="Generate Papers"
            description="Create customized question papers with a single click and export in multiple formats."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="card" style={{ 
        textAlign: 'center', 
        backgroundColor: 'var(--primary-600)',
        color: 'white',
        marginBottom: 30
      }}>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: 600, 
          marginBottom: '16px'
        }}>
          Ready to Transform Your Exam Creation Process?
        </h2>
        <p style={{ 
          fontSize: '1.25rem', 
          marginBottom: '30px',
          maxWidth: 700,
          margin: '0 auto 30px'
        }}>
          Join thousands of educators who save hours every week with our automated system
        </p>
        <Link to="/signup" className="btn" style={{ 
          backgroundColor: 'white',
          color: 'var(--primary-700)',
          fontWeight: 600,
          fontSize: '1.1rem',
          padding: '12px 30px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 1-2-2H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Start Your Free Trial
        </Link>
      </section>
    </div>
  )
}

function QuickStartStep({ step, title, description }: { step: number, title: string, description: string }) {
  return (
    <div className="col">
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: 16 
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: 'var(--primary-100)',
          color: 'var(--primary-700)',
          fontWeight: 700,
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {step}
        </div>
        <div>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            marginBottom: 8,
            color: 'var(--text-primary)',
            marginTop: 0
          }}>
            {title}
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: 0
          }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="col">
      <div className="card" style={{ height: '100%' }}>
        <div className="icon-circle" style={{ 
          width: 56, 
          height: 56, 
          fontSize: 24, 
          marginBottom: 20,
          backgroundColor: 'var(--primary-100)',
          color: 'var(--primary-600)'
        }}>
          {icon}
        </div>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          marginBottom: 12,
          color: 'var(--text-primary)'
        }}>
          {title}
        </h3>
        <p style={{ 
          color: 'var(--text-secondary)',
          lineHeight: 1.6
        }}>
          {description}
        </p>
      </div>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="col">
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center',
        height: '100%'
      }}>
        <div style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          backgroundColor: 'var(--primary-100)',
          color: 'var(--primary-700)',
          fontWeight: 700,
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}>
          {number}
        </div>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          marginBottom: 12,
          color: 'var(--text-primary)'
        }}>
          {title}
        </h3>
        <p style={{ 
          color: 'var(--text-secondary)',
          lineHeight: 1.6
        }}>
          {description}
        </p>
      </div>
    </div>
  )
}