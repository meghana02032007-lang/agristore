import Modal from './Modal';
import { useLang } from '../LangContext';

export default function BookingSuccessModal({ open, onClose }) {
  const { t } = useLang();
  return (
    <Modal open={open} onClose={onClose} maxWidth={320}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 10 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green-dark)', marginBottom: 6 }}>
          {t.bookingSent}
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 18, lineHeight: 1.65 }}>
          {t.bookingMsg}
        </div>
        <div className="alert alert-success" style={{ marginBottom: 14 }}>
          📋 {t.bookingId}: <strong>AGS-2025-{String(Math.floor(Math.random()*99999)).padStart(5,'0')}</strong>
        </div>
        <button className="btn btn-primary btn-full" onClick={onClose}>
          {t.viewBookings}
        </button>
      </div>
    </Modal>
  );
}
