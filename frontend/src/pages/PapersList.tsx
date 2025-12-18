import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api'
import Modal from '../components/Modal'
import { IconView, IconDownload, IconTrash } from '../components/Icons'

type Subject = { id: number, name: string }
type PaperItem = { position: number, subpart?: string, module_no?: number, marks?: number, blooms_level?: string, question_id?: number, accepted: boolean }
type Paper = { paper_id: number, items: PaperItem[] }

export default function PapersList() {
  const { token } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [papers, setPapers] = useState<Paper[]>([])
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [details, setDetails] = useState<any | null>(null)
  useEffect(() => { loadSubjects() }, [])
  async function loadSubjects() {
    const data = await api('/subjects/', {}, token)
    setSubjects(data)
    if (data.length) { setSubjectId(data[0].id); loadPapers(data[0].id) }
  }
  async function loadPapers(id: number) {
    const data = await api(`/papers/?subject_id=${id}`, {}, token)
    setPapers(data)
  }

  async function viewDetails(paper_id: number) {
    try {
      const d = await api(`/papers/${paper_id}/details`, {}, token)
      setDetails(d)
      setDetailsOpen(true)
    } catch (err: any) {
      alert('Failed to load details: ' + err.message)
    }
  }

  async function exportPaper(paper_id: number) {
    try {
      const res = await api(`/papers/${paper_id}/export`, {}, token)
      const blob = new Blob([res.content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename || `paper_${paper_id}.txt`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Export failed: ' + err.message)
    }
  }
  return (
    <div className="card">
      <h2 className="section-title">My Papers</h2>
      <select className="select" value={subjectId || ''} onChange={e => { const id = Number(e.target.value); setSubjectId(id); loadPapers(id) }}>
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {papers.map(p => (
        <div key={p.paper_id} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="section-title">Paper #{p.paper_id}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-icon" onClick={() => viewDetails(p.paper_id)} title="View Details"><IconView />&nbsp;View</button>
              <button className="btn btn-primary btn-icon" onClick={() => exportPaper(p.paper_id)} title="Export paper"><IconDownload />&nbsp;Export</button>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Part</th><th>Module</th><th>Marks</th><th>Bloom</th><th>QID</th><th>Accepted</th>
              </tr>
            </thead>
            <tbody>
              {p.items.map((it, idx) => (
                <tr key={idx}>
                  <td>{it.subpart || ''}</td>
                  <td>{it.module_no || ''}</td>
                  <td>{it.marks || ''}</td>
                  <td>{it.blooms_level || ''}</td>
                  <td>{it.question_id || ''}</td>
                  <td>{it.accepted ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title={details ? `Paper #${details.paper_id} Details` : 'Details'}>
        {!details ? (
          <div>Loading...</div>
        ) : (
          <div>
            <div style={{ marginBottom: 12 }}><strong>Class:</strong> {details.class_name} &nbsp; <strong>Exam:</strong> {details.exam_type} &nbsp; <strong>Semester:</strong> {details.semester || 'N/A'}</div>
            <table className="table">
              <thead>
                <tr><th>Part</th><th>Module</th><th>Marks</th><th>Bloom</th><th>Question Text</th><th>Accepted</th></tr>
              </thead>
              <tbody>
                {details.items.map((it: any, idx: number) => (
                  <tr key={idx}>
                    <td>{it.subpart || ''}</td>
                    <td>{it.module_no || ''}</td>
                    <td>{it.marks || ''}</td>
                    <td>{it.blooms_level || ''}</td>
                    <td style={{ maxWidth: 540, whiteSpace: 'pre-wrap' }}>{it.question_text || ''}</td>
                    <td>{it.accepted ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}
