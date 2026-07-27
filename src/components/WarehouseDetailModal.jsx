import Modal, { ModalHeader } from './Modal';
import { useLang } from '../LangContext';

export default function WarehouseDetailModal({ open, onClose, warehouse, onBook }) {
  const { t } = useLang();
  if (!warehouse) return null;

  const cap  = warehouse.total_capacity || warehouse.capacity || 1;
  const used = Math.round(((cap - warehouse.available) / cap) * 100);

  const humidity = warehouse.humidity || 0;
  const temp     = warehouse.temperature || 0;
  const risk = humidity > 75
    ? { label: `🔴 ${t.high}`,   color: '#C62828' }
    : temp > 30
    ? { label: `🟡 ${t.medium}`, color: '#E65100' }
    : { label: `🟢 ${t.safe}`,   color: '#2D7A3A' };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={warehouse.name} sub={`📍 ${warehouse.location}`} onClose={onClose} />

      {warehouse.image_url && (
        <img src={warehouse.image_url} alt={warehouse.name}
          style={{ width:'100%', height:160, objectFit:'cover', borderRadius:12, marginBottom:14 }} />
      )}

      <div className="wh-stats" style={{ marginBottom:14 }}>
        <div className="wh-stat">
          <div className="wh-stat-val">₹{warehouse.price}</div>
          <div className="wh-stat-lbl">{t.perTonDay}</div>
        </div>
        <div className="wh-stat">
          <div className="wh-stat-val">{warehouse.available}T</div>
          <div className="wh-stat-lbl">{t.available}</div>
        </div>
        <div className="wh-stat">
          <div className="wh-stat-val">{cap}T</div>
          <div className="wh-stat-lbl">{t.totalCapacity}</div>
        </div>
        <div className="wh-stat">
          <div className="wh-stat-val">{warehouse.rating} ⭐</div>
          <div className="wh-stat-lbl">{t.rating}</div>
        </div>
      </div>

      <div className="progress-bar" style={{ marginBottom:4 }}>
        <div className="progress-fill" style={{ width:`${used}%` }} />
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>{used}% {t.occupied}</div>

      {/* Environment */}
      <div style={{ display:'flex', gap:10, marginBottom:14, background:'var(--green-light)', borderRadius:10, padding:'10px 14px' }}>
        <span style={{ fontSize:13 }}>🌡 {warehouse.temperature ?? '-'}°C</span>
        <span style={{ fontSize:13 }}>💧 {warehouse.humidity ?? '-'}%</span>
        <span style={{ fontSize:13, fontWeight:700, color:risk.color }}>{risk.label}</span>
      </div>

      <div className="alert alert-success" style={{ marginBottom:14 }}>
        ✓ {t.transportAvail} &nbsp;|&nbsp; 🌡 {t.tempControlled}
      </div>

      {/* Crops */}
      {warehouse.crops && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>{t.acceptedCrops}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {warehouse.crops.split(',').map(c => (
              <span key={c} className="tag" style={{ background:'var(--green-light)', color:'var(--green-dark)' }}>{c.trim()}</span>
            ))}
          </div>
        </div>
      )}

      {warehouse.phone && (
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>
          📞 +91 {warehouse.phone}
        </div>
      )}

      <div style={{ display:'flex', gap:10 }}>
        {warehouse.phone && (
          <>
            <a className="btn btn-secondary btn-sm" href={`tel:+${warehouse.phone}`}>📞 {t.callWarehouse}</a>
            <a className="btn btn-sm" style={{ background:'#E8F5E9', color:'var(--green)' }}
              href={`https://wa.me/${warehouse.phone}`} target="_blank" rel="noreferrer">💬 {t.whatsapp}</a>
          </>
        )}
        <button className="btn btn-primary btn-full btn-lg" style={{ flex:1 }} onClick={onBook}>
          📦 {t.bookWarehouse}
        </button>
      </div>
    </Modal>
  );
}
