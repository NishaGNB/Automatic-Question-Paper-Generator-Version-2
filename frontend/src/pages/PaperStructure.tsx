import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Subpart = { label: string, marks: number, blooms_level: string }
type Item = { position: number, module_no: number, subparts: Subpart[] }

export default function PaperStructure() {
  const [items, setItems] = useState<Item[]>([])
  const [module_no, setModule] = useState(1)
  const [label, setLabel] = useState('a')
  const [marks, setMarks] = useState(5)
  const [blooms_level, setBloom] = useState('CL2')
  const [selectedItem, setSelectedItem] = useState<number | null>(null)

  function addQuestion() {
    if (selectedItem !== null) {
      const updated = [...items]
      updated[selectedItem].subparts.push({ label, marks, blooms_level })
      setItems(updated)
    } else {
      const newPos = items.length + 1
      const updated = [...items, { position: newPos, module_no, subparts: [{ label, marks, blooms_level }] }]
      setItems(updated)
      setModule(module_no + 1)
    }
  }

  function removeSubpart(itemIdx: number, subpartIdx: number) {
    const updated = [...items]
    updated[itemIdx].subparts.splice(subpartIdx, 1)
    if (updated[itemIdx].subparts.length === 0) {
      updated.splice(itemIdx, 1)
    }
    // reindex positions to be sequential 1..n
    const reindexed = updated.map((it, idx) => ({ ...it, position: idx + 1 }))
    setItems(reindexed)
  }

  function removeItem(itemIdx: number) {
    const updated = items.filter((_, i) => i !== itemIdx)
    const reindexed = updated.map((it, idx) => ({ ...it, position: idx + 1 }))
    setItems(reindexed)
    setSelectedItem(null)
  }

  const nav = useNavigate()

  function saveAndOpen() {
    const json = JSON.stringify(items)
    localStorage.setItem('aqpgs_structure', json)
    nav('/generate')
  }

  function saveDraft() {
    const json = JSON.stringify(items)
    localStorage.setItem('aqpgs_structure', json)
    alert('Structure saved to draft — open Generate page to load it.')
  }

  return (
    <div className="card">
      <h2 className="section-title">Paper Structure</h2>
      <div className="grid" style={{ maxWidth: 700 }}>
        <div className="row">
          <div style={{ flex: 1 }}>
            <label className="label">Module No</label>
            <input className="input" type="number" value={module_no} onChange={e => setModule(Number(e.target.value))} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Subpart (a, b, c...)</label>
            <input className="input" value={label} onChange={e => setLabel(e.target.value)} />
          </div>
        </div>
        <div className="row">
          <div style={{ flex: 1 }}>
            <label className="label">Marks</label>
            <input className="input" type="number" value={marks} onChange={e => setMarks(Number(e.target.value))} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Bloom's Level (CL1-CL6)</label>
            <input className="input" value={blooms_level} onChange={e => setBloom(e.target.value)} placeholder="CL1, CL2, CL3..." />
          </div>
        </div>
        <div className="row">
          <button className="btn btn-primary btn-icon" onClick={addQuestion}>{selectedItem !== null ? 'Add Subpart' : 'Add New Question'}</button>
          {selectedItem !== null && (
            <button className="btn" onClick={() => setSelectedItem(null)}>Clear Selection</button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3 className="section-title">Questions</h3>
        {items.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No questions added yet</p>
        ) : (
          items.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: selectedItem === idx ? 'rgba(91,130,255,0.15)' : 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedItem(idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>Q{item.position} - Module {item.module_no}</strong>
                <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); removeItem(idx) }}>Remove</button>
              </div>
              <table className="table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th>Part</th><th>Marks</th><th>Bloom's Level</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {item.subparts.map((sp, sidx) => (
                    <tr key={sidx}>
                      <td>{sp.label}</td>
                      <td>{sp.marks}</td>
                      <td>{sp.blooms_level}</td>
                      <td>
                        <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); removeSubpart(idx, sidx) }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3 className="section-title">Structure JSON</h3>
        <textarea
          className="textarea"
          value={JSON.stringify(items, null, 2)}
          readOnly
          style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn" onClick={() => navigator.clipboard.writeText(JSON.stringify(items))}>Copy to Clipboard</button>
          <button className="btn" onClick={saveDraft}>Save Draft</button>
          <button className="btn btn-primary" onClick={saveAndOpen}>Save & Open in Generate</button>
        </div>
      </div>
    </div>
  )
}
