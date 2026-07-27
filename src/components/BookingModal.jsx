import { useState } from 'react';
import Modal, { ModalHeader } from './Modal';
import { supabase } from '../supabase';
import { useLang } from '../LangContext';
import { getCurrentUser } from '../auth';

const GST_RATE = 0.05;

function getRecommendation(crop) {
  const c = crop.toLowerCase();
  if (c.includes('rice') || c.includes('wheat'))  return '🌾 Dry Storage Recommended';
  if (c.includes('tomato') || c.includes('veg'))   return '❄️ Cold Storage Recommended';
  if (c.includes('onion') || c.includes('potato')) return '💨 Ventilated Storage Recommended';
  return '🏬 General Storage Recommended';
}

/** Add calendar days to a date string, return ISO date string */
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + parseInt(days, 10));
  return d.toISOString().split('T')[0];
}

/** Format a date string nicely: "12 Jul 2025" */
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BookingModal({ open, onClose, warehouse, onSuccess }) {
  const { t } = useLang();
  const [step, setStep]             = useState(1);
  const [crop, setCrop]             = useState('🌾 Rice');
  const [qty, setQty]               = useState('');
  const [startDate, setStartDate]   = useState('');
  const [days, setDays]             = useState('');
  const [transport, setTransport]   = useState(false);
  const [pickupAddr, setPickupAddr] = useState('');
  const [payMethod, setPayMethod]   = useState('online');
  const [loading, setLoading]       = useState(false);

  // Use warehouse price if available, else default 180
  const pricePerTon = warehouse?.price || 180;
  const qtyNum      = parseFloat(qty)  || 0;
  const daysNum     = parseFloat(days) || 0;
  const storageCost = qtyNum * daysNum * pricePerTon;
  const gst         = Math.round(storageCost * GST_RATE);
  const total       = storageCost + gst;
  const dueDate     = startDate && days ? addDays(startDate, days) : null;

  function reset() {
    setStep(1); setCrop('🌾 Rice'); setQty(''); setStartDate('');
    setDays(''); setTransport(false); setPickupAddr(''); setPayMethod('online');
  }

  async function confirmBooking() {
    if (!startDate) { alert(t.selectStartDate); return; }
    if (!qty || qtyNum <= 0) { alert(t.quantityTons + ' required'); return; }
    if (!days || daysNum <= 0) { alert(t.numDays + ' required'); return; }

    setLoading(true);
    const user = getCurrentUser();
    if (!user) { alert('Not logged in'); setLoading(false); return; }

    const { error } = await supabase.from('bookings').insert([{
      farmer_id:      user.id,
      warehouse_name: warehouse?.name || 'Unknown',
      crop_type:      crop,
      quantity:       qtyNum,
      days:           daysNum,
      status:         'pending',
      start_date:     startDate,
      price_per_ton:  pricePerTon,
      total_amount:   total,
      due_date:       dueDate,
      payment_method: payMethod,
      payment_status: 'unpaid',
    }]);

    setLoading(false);
    if (error) { alert('Booking failed ❌ ' + error.message); return; }
    reset();
    onClose();
    onSuccess();
  }

  const dots = [1, 2, 3].map(i => (
    <div key={i} className={`step-dot${i === step ? ' active' : i < step ? ' done' : ''}`} />
  ));

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }}>
      <ModalHeader title={t.bookWarehouse} onClose={() => { reset(); onClose(); }} />
      <div className="step-indicator">{dots}</div>

      {/* ── Step 1: Storage Details ── */}
      {step === 1 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📦 {t.storageDetails}</div>

          <div className="form-group">
            <label className="form-label">{t.cropType}</label>
            <select className="form-input" value={crop} onChange={e => setCrop(e.target.value)}>
              {['🌾 Rice', '🌽 Maize', '🫘 Pulses', '🌿 Soybean', '🧅 Onion'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: 'var(--green-dark)', marginTop: 5 }}>
              {getRecommendation(crop)}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">{t.quantityTons}</label>
            <input className="form-input" type="number" min="1" placeholder="e.g. 25"
              value={qty} onChange={e => setQty(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">{t.startDate}</label>
            <input className="form-input" type="date"
              min={new Date().toISOString().split('T')[0]}
              value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">{t.numDays}</label>
            <input className="form-input" type="number" min="1" placeholder="e.g. 30"
              value={days} onChange={e => setDays(e.target.value)} />
          </div>

          {/* Live cost preview */}
          {storageCost > 0 && (
            <div style={{
              background: 'var(--green-light)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 14, marginBottom: 14,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>💰 {t.costBreakdown}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>
                  {qtyNum}T × {daysNum} days × ₹{pricePerTon}/ton/day
                </span>
                <span>₹{storageCost.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>{t.gst}</span>
                <span>₹{gst.toLocaleString('en-IN')}</span>
              </div>
              <div className="divider" style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15 }}>
                <span>{t.total}</span>
                <span style={{ color: 'var(--green-dark)' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
              {dueDate && (
                <div style={{
                  marginTop: 10, padding: '7px 10px',
                  background: '#FFF8E1', borderRadius: 8,
                  fontSize: 12, fontWeight: 700, color: '#E65100',
                }}>
                  📅 {t.dueDate}: <strong>{fmtDate(dueDate)}</strong>
                </div>
              )}
            </div>
          )}

          <button className="btn btn-primary btn-full" onClick={() => setStep(2)}
            disabled={!qty || !days}>
            {t.next}: {t.transport} →
          </button>
        </div>
      )}

      {/* ── Step 2: Transport ── */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🚛 {t.transport}</div>
          {[
            { yes: true,  icon: '🚛', bg: '#E8F5E9', title: t.yesTransport, sub: t.arrangePickup },
            { yes: false, icon: '🚶', bg: '#F5F5F5', title: t.noTransport,  sub: t.dropYourself },
          ].map(opt => (
            <div key={String(opt.yes)}
              className={`pay-option${transport === opt.yes ? ' selected' : ''}`}
              onClick={() => setTransport(opt.yes)}>
              <div className="pay-icon" style={{ background: opt.bg }}>{opt.icon}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{opt.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{opt.sub}</div>
              </div>
            </div>
          ))}
          {transport && (
            <div className="form-group" style={{ marginTop: 10 }}>
              <label className="form-label">{t.pickupAddress}</label>
              <input className="form-input" placeholder="Your farm address"
                value={pickupAddr} onChange={e => setPickupAddr(e.target.value)} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>← {t.back}</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep(3)}>{t.next}: {t.paymentMethod} →</button>
          </div>
        </div>
      )}

      {/* ── Step 3: Payment ── */}
      {step === 3 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>💳 {t.paymentMethod}</div>
          {[
            { id: 'online',  icon: '📱', bg: '#E3F2FD', title: t.onlinePayment,   sub: t.upiNetCard },
            { id: 'offline', icon: '💵', bg: '#FFF8E1', title: t.payAtWarehouse,  sub: t.cashCheque },
          ].map(opt => (
            <div key={opt.id}
              className={`pay-option${payMethod === opt.id ? ' selected' : ''}`}
              onClick={() => setPayMethod(opt.id)}>
              <div className="pay-icon" style={{ background: opt.bg }}>{opt.icon}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{opt.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{opt.sub}</div>
              </div>
            </div>
          ))}

          <div className="divider" />

          {/* Full summary */}
          {[
            [`${qtyNum}T × ${daysNum}d × ₹${pricePerTon}`, storageCost],
            [t.gst, gst],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--muted)' }}>{label}</span>
              <span>₹{val.toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
            <span>{t.total}</span>
            <span style={{ color: 'var(--green-dark)' }}>₹{total.toLocaleString('en-IN')}</span>
          </div>
          {dueDate && (
            <div style={{
              marginBottom: 14, padding: '8px 12px',
              background: '#FFF8E1', borderRadius: 8,
              fontSize: 12, fontWeight: 700, color: '#E65100',
            }}>
              📅 {t.dueDate}: <strong>{fmtDate(dueDate)}</strong>
              &nbsp;({payMethod === 'offline' ? 'Pay at warehouse on arrival' : 'Online payment required by due date'})
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>← {t.back}</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={confirmBooking} disabled={loading}>
              {loading ? `⏳ ${t.confirming}` : `✅ ${t.confirmBooking}`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
