export default function Modal({ open, onClose, children, maxWidth = 420 }) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ zIndex: 1000 }}
    >
      <div className="modal-box" style={{ maxWidth, position: 'relative', zIndex: 1001 }}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, sub, onClose }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sub ? 4 : 16 }}>
        <div className="modal-title">{title}</div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}
        >×</button>
      </div>
      {sub && <div className="modal-sub">{sub}</div>}
    </>
  );
}
