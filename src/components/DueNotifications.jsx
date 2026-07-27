import { useState } from 'react';
import { useLang } from '../LangContext';

function daysLeft(dueDateStr) {
  if (!dueDateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dueDateStr); due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

export function getAlertBookings(bookings) {
  return (bookings || []).filter(b => {
    if (b.payment_status === 'paid') return false;
    if (!b.due_date) return false;
    const left = daysLeft(b.due_date);
    return left !== null && left <= 3;
  });
}

export default function DueNotifications({ bookings, onOpenPayments }) {
  const { t } = useLang();
  const [dismissed, setDismissed] = useState([]);
  const alerts = getAlertBookings(bookings).filter(b => !dismissed.includes(b.id));
  if (alerts.length === 0) return null;

  return (
    <div style={{ marginBottom: 14 }}>
      {alerts.map(b => {
        const left     = daysLeft(b.due_date);
        const isOverdue = left < 0;
        const isToday   = left === 0;
        const bg     = isOverdue ? '#FFEBEE' : '#FFF8E1';
        const border = isOverdue ? '#EF9A9A' : '#FFE082';
        const color  = isOverdue ? '#C62828' : '#E65100';
        const icon   = isOverdue ? '🔴' : isToday ? '🔔' : '⚠️';
        const message = isOverdue
          ? `${t.overdueMsg} ${Math.abs(left)} day${Math.abs(left) !== 1 ? 's' : ''}`
          : isToday ? t.dueToday
          : `${t.dueSoon} ${left} day${left !== 1 ? 's' : ''}`;

        return (
          <div key={b.id} style={{
            display:'flex', alignItems:'flex-start', gap:10,
            background:bg, border:`1.5px solid ${border}`,
            borderRadius:12, padding:'11px 13px', marginBottom:8,
          }}>
            <div style={{ fontSize:22, flexShrink:0, animation: isOverdue||isToday ? 'bellPulse 1.2s ease-in-out infinite' : 'none' }}>{icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:13, color, marginBottom:2 }}>{message}</div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>
                {b.warehouse_name} &nbsp;·&nbsp; ₹{(b.total_amount||0).toLocaleString('en-IN')}
                &nbsp;·&nbsp; {b.payment_method==='online' ? `📱 ${t.onlinePayment}` : `💵 ${t.payAtWarehouse}`}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5, flexShrink:0 }}>
              <button className="btn btn-sm"
                style={{ background:color, color:'#fff', padding:'5px 10px', fontSize:11 }}
                onClick={onOpenPayments}>
                {t.payNow}
              </button>
              <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--muted)', lineHeight:1 }}
                onClick={() => setDismissed(d => [...d, b.id])}>×</button>
            </div>
          </div>
        );
      })}
      <style>{`@keyframes bellPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25) rotate(12deg)} }`}</style>
    </div>
  );
}
