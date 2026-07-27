import { useState, useEffect } from 'react';
import Modal, { ModalHeader } from './Modal';
import { supabase } from '../supabase';
import { useLang } from '../LangContext';
import { getCurrentUser } from '../auth';

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysLeft(dueDateStr) {
  if (!dueDateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dueDateStr); due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function DueBadge({ dueDate, paymentStatus, t }) {
  if (paymentStatus === 'paid') return <span className="badge badge-green">✅ {t.paid}</span>;
  const left = daysLeft(dueDate);
  if (left === null) return <span className="badge badge-amber">⏳ {t.unpaid}</span>;
  if (left < 0)  return <span className="badge badge-red">🔴 {t.overdue} {Math.abs(left)}d</span>;
  if (left === 0) return <span className="badge badge-red">🔴 {t.dueToday}</span>;
  if (left <= 3)  return <span className="badge badge-amber">⚠ {t.dueSoon} {left}d</span>;
  return <span className="badge badge-blue">📅 {t.dueSoon} {left}d</span>;
}

export default function PaymentHistoryModal({ open, onClose }) {
  const { t } = useLang();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [filter, setFilter]     = useState('all');

  useEffect(() => { if (open) loadPayments(); }, [open]);

  async function loadPayments() {
    setLoading(true);
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('bookings').select('*')
      .eq('farmer_id', user.id)
      .in('status', ['accepted', 'pending'])
      .order('created_at', { ascending: false });
    setLoading(false);
    if (data) setPayments(data);
  }

  async function markPaid(id) {
    await supabase.from('bookings').update({ payment_status: 'paid' }).eq('id', id);
    setPayments(prev => prev.map(p => p.id === id ? { ...p, payment_status: 'paid' } : p));
  }

  const filtered = payments.filter(p =>
    filter === 'paid'   ? p.payment_status === 'paid'  :
    filter === 'unpaid' ? p.payment_status !== 'paid'  : true
  );

  const totalPaid   = payments.filter(p => p.payment_status === 'paid').reduce((s, p) => s + (p.total_amount || 0), 0);
  const totalUnpaid = payments.filter(p => p.payment_status !== 'paid').reduce((s, p) => s + (p.total_amount || 0), 0);
  const overdueCount = payments.filter(p => p.payment_status !== 'paid' && daysLeft(p.due_date) < 0).length;

  return (
    <Modal open={open} onClose={onClose} maxWidth={460}>
      <ModalHeader title={t.paymentHistory} onClose={onClose} />

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: t.totalPaid,   value: `₹${totalPaid.toLocaleString('en-IN')}`,   bg: '#E8F5E9', color: '#2D7A3A' },
          { label: t.outstanding, value: `₹${totalUnpaid.toLocaleString('en-IN')}`, bg: '#FFF8E1', color: '#E65100' },
          { label: t.overdue,     value: overdueCount,                               bg: '#FFEBEE', color: '#C62828' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="tab-bar" style={{ marginBottom: 14 }}>
        {[['all', t.all], ['unpaid', `⏳ ${t.unpaid}`], ['paid', `✅ ${t.paid}`]].map(([key, label]) => (
          <div key={key} className={`tab${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>{label}</div>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>Loading...</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>{t.noPayments}</div>
      )}

      {!loading && filtered.map(p => {
        const left = daysLeft(p.due_date);
        const isOverdue = p.payment_status !== 'paid' && left !== null && left < 0;
        const isDueSoon = p.payment_status !== 'paid' && left !== null && left >= 0 && left <= 3;
        return (
          <div key={p.id} className="booking-card" style={{
            marginBottom: 12,
            border: isOverdue ? '1.5px solid #EF9A9A' : isDueSoon ? '1.5px solid #FFE082' : '1px solid var(--border)',
          }}>
            <div className="booking-header">
              <div style={{ flex: 1 }}>
                <div className="booking-name">{p.warehouse_name}</div>
                <div className="booking-meta">🌾 {p.crop_type} | {p.quantity} {t.quantityTons?.split('(')[0]?.trim() || 'tons'} | {p.days}d</div>
                {p.start_date && <div className="booking-meta">📅 {fmtDate(p.start_date)} → {fmtDate(p.due_date)}</div>}
                <div className="booking-meta">{p.payment_method === 'online' ? `📱 ${t.onlinePayment}` : `💵 ${t.payAtWarehouse}`}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--green-dark)' }}>
                  ₹{(p.total_amount || 0).toLocaleString('en-IN')}
                </div>
                <DueBadge dueDate={p.due_date} paymentStatus={p.payment_status} t={t} />
              </div>
            </div>

            {p.price_per_ton > 0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', background:'var(--bg)', borderRadius:8, padding:'7px 10px', fontSize:12, color:'var(--muted)', marginTop:8, marginBottom:8 }}>
                <span>₹{p.price_per_ton}/{t.perTonDay}</span>
                <span>•</span>
                <span>{t.storageCost}: ₹{(p.quantity * p.days * p.price_per_ton).toLocaleString('en-IN')}</span>
                <span>•</span>
                <span>{t.gst}: ₹{Math.round(p.quantity * p.days * p.price_per_ton * 0.05).toLocaleString('en-IN')}</span>
              </div>
            )}

            {isOverdue && (
              <div style={{ background:'#FFEBEE', borderRadius:8, padding:'7px 10px', fontSize:12, fontWeight:700, color:'#C62828', marginBottom:8 }}>
                🔴 {t.overdueMsg} {Math.abs(left)} day{Math.abs(left) !== 1 ? 's' : ''}!
              </div>
            )}
            {isDueSoon && (
              <div style={{ background:'#FFF8E1', borderRadius:8, padding:'7px 10px', fontSize:12, fontWeight:700, color:'#E65100', marginBottom:8 }}>
                ⚠️ {t.dueSoon} {left} day{left !== 1 ? 's' : ''}
              </div>
            )}

            {p.payment_status !== 'paid' && (
              <button className="btn btn-primary btn-sm btn-full" onClick={() => markPaid(p.id)}>
                ✅ {t.markAsPaid}
              </button>
            )}
          </div>
        );
      })}
    </Modal>
  );
}
