import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api'
import { Link } from 'react-router-dom'

type SubjectStats = { 
  subject_id: number, 
  name: string, 
  class_name: string, 
  semester?: string, 
  total_questions: number, 
  verified_questions: number, 
  total_papers: number 
}

type Stats = { 
  total_subjects: number, 
  total_questions: number, 
  verified_questions: number, 
  total_papers: number, 
  subjects: SubjectStats[] 
}

export default function Dashboard() {
  const { token } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => { 
    load() 
  }, [])
  
  async function load() {
    try {
      setLoading(true)
      setError(null)
      const s = await api('/stats/', {}, token)
      setStats(s)
    } catch (err: any) {
      console.error('Dashboard load error:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner"></div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ 
            fontSize: 48, 
            marginBottom: 16 
          }}>
            ⚠️
          </div>
          <h3 style={{ margin: '0 0 16px 0' }}>Error Loading Dashboard</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
          <button className="btn btn-primary" onClick={load}>
            Retry
          </button>
        </div>
      </div>
    )
  }
  
  if (!stats) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No Data Available</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Get started by adding subjects and questions</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="grid">
      <div className="row">
        <StatCard title="Subjects" value={stats.total_subjects} icon="📚" />
        <StatCard title="Questions" value={stats.total_questions} icon="❓" />
        <StatCard title="Verified" value={stats.verified_questions} icon="✅" />
        <StatCard title="Papers" value={stats.total_papers} icon="📄" />
      </div>
      
      {/* Quick Start Guide for Logged-in Users */}
      <div className="card">
        <h3 className="section-title">Quick Start Guide</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          Follow these steps to create your first question paper
        </p>
        
        <div className="grid" style={{ gap: 16 }}>
          <QuickStartStep 
            step={1}
            title="Create a Subject"
            description="Add a new subject (e.g., General Knowledge)"
            link="/subjects"
            buttonText="Go to Subjects"
          />
          
          <QuickStartStep 
            step={2}
            title="Upload Questions"
            description="Select your subject and upload question bank"
            link="/upload"
            buttonText="Go to Upload"
          />
          
          <QuickStartStep 
            step={3}
            title="Create Paper Structure"
            description="Add questions with modules, marks, and Bloom's levels"
            link="/structure"
            buttonText="Go to Structure"
          />
          
          <QuickStartStep 
            step={4}
            title="Generate Paper"
            description="Select subject and generate question paper"
            link="/generate"
            buttonText="Go to Generate"
          />
        </div>
      </div>
      
      <div className="card">
        <h3 className="section-title">Subject Overview</h3>
        {stats.subjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="icon-circle" style={{ margin: '0 auto 16px', width: 48, height: 48 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <h4 style={{ margin: '0 0 8px 0' }}>No subjects added yet</h4>
            <p className="label" style={{ margin: 0 }}>Add your first subject to see statistics</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Semester</th>
                  <th>Questions</th>
                  <th>Verified</th>
                  <th>Papers</th>
                </tr>
              </thead>
              <tbody>
                {stats.subjects.map(s => (
                  <tr key={s.subject_id}>
                    <td>{s.name}</td>
                    <td>{s.class_name}</td>
                    <td>{s.semester || '-'}</td>
                    <td>{s.total_questions}</td>
                    <td>{s.verified_questions}</td>
                    <td>{s.total_papers}</td>
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

function StatCard({ title, value, icon }: { title: string, value: number, icon: string }) {
  return (
    <div className="card" style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ 
          fontSize: 24, 
          backgroundColor: 'var(--primary-50)', 
          width: 48, 
          height: 48, 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          {icon}
        </div>
        <div>
          <div className="label">{title}</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--primary-700)' }}>{value}</div>
        </div>
      </div>
    </div>
  )
}

function QuickStartStep({ step, title, description, link, buttonText }: { 
  step: number, 
  title: string, 
  description: string, 
  link: string, 
  buttonText: string 
}) {
  return (
    <div className="col">
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: 16,
          padding: 16,
          border: '1px solid var(--border-default)', 
          borderRadius: 8,
          backgroundColor: 'var(--light-gray-50)',
          height: '100%'
        }}
      >
        <div 
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-700)',
            fontWeight: 600,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {step}
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{title}</h4>
          <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{description}</p>
          <Link to={link} className="btn btn-primary" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8 
          }}>
            {buttonText}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}