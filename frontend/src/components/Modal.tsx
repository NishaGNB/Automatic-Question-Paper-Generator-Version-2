import React from 'react'

export default function Modal({ open, onClose, title, children }: { open: boolean, onClose: () => void, title?: string, children?: React.ReactNode }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,20,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={onClose}>
      <div style={{ width: '90%', maxWidth: 900, background: 'linear-gradient(180deg,#0f1530,#121833)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, color: 'var(--text)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}
