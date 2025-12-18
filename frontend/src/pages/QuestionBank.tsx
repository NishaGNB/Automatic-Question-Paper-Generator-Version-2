import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api'

type Subject = { id: number, name: string }
type Question = { id: number, text: string, module_no?: number, marks?: number, blooms_level?: string, verified: boolean }

export default function QuestionBank() {
  const { token } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [list, setList] = useState<Question[]>([])
  const [module_no, setModule] = useState<number | ''>('')
  const [blooms_level, setBloom] = useState('')
  const [verified, setVerified] = useState<string>('')
  const [q, setQ] = useState('')
  useEffect(() => { loadSubjects() }, [])
  async function loadSubjects() {
    const data = await api('/subjects/', {}, token)
    setSubjects(data)
    if (data.length) { setSubjectId(data[0].id); load(data[0].id) }
  }
  async function load(id: number) {
    const params = new URLSearchParams()
    params.set('subject_id', String(id))
    if (module_no !== '') params.set('module_no', String(module_no))
    if (blooms_level) params.set('blooms_level', blooms_level)
    if (verified) params.set('verified', verified === 'true' ? 'true' : 'false')
    if (q) params.set('q', q)
    const data = await api(`/questions/?${params.toString()}`, {}, token)
    setList(data)
  }
  return (
    <div className="card">
      <h2 className="section-title">Question Bank</h2>
      <div className="row" style={{ marginBottom: 12 }}>
        <select className="select" value={subjectId || ''} onChange={e => { const id = Number(e.target.value); setSubjectId(id); load(id) }}>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className="input" placeholder="Search text" value={q} onChange={e => setQ(e.target.value)} />
        <input className="input" type="number" placeholder="Module" value={module_no} onChange={e => setModule(e.target.value ? Number(e.target.value) : '')} />
        <input className="input" placeholder="Bloom's" value={blooms_level} onChange={e => setBloom(e.target.value)} />
        <select className="select" value={verified} onChange={e => setVerified(e.target.value)}>
          <option value="">All</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
        <button className="btn btn-primary" onClick={() => subjectId && load(subjectId)}>Filter</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th><th>Text</th><th>Module</th><th>Marks</th><th>Bloom</th><th>Verified</th>
          </tr>
        </thead>
        <tbody>
          {list.map(q => (
            <tr key={q.id}>
              <td>{q.id}</td>
              <td style={{ maxWidth: 600 }}>{q.text}</td>
              <td>{q.module_no || ''}</td>
              <td>{q.marks || ''}</td>
              <td>{q.blooms_level || ''}</td>
              <td>{q.verified ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
