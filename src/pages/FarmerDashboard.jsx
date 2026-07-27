import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, SlidersHorizontal, Leaf, LayoutDashboard,
  BookOpen, CreditCard, User, LogOut, Phone, MessageCircle,
  Star, Thermometer, Droplets, Package, ChevronRight,
  AlertCircle, CheckCircle, Clock, TrendingUp, Warehouse,
  Navigation, X, Filter,
} from 'lucide-react';
import { supabase } from '../supabase';
import { useLang } from '../LangContext';
import { langNames } from '../i18n';
import { translateWarehouseName } from '../i18n';
import { getCurrentUser, logoutUser } from '../auth';
import { FarmerBottomNav } from '../components/BottomNav';
import WarehouseMap from '../components/WarehouseMap';
import WarehouseDetailModal from '../components/WarehouseDetailModal';
import BookingModal from '../components/BookingModal';
import BookingSuccessModal from '../components/BookingSuccessModal';
import PaymentHistoryModal from '../components/PaymentHistoryModal';
import DueNotifications, { getAlertBookings } from '../components/DueNotifications';
import EditProfileModal from '../components/EditProfileModal';

/* ── helpers ── */
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function checkSpoilage(temp, humidity) {
  if (humidity > 75) return { label: 'High Risk',   color: 'var(--red)',   bg: 'var(--red-light)' };
  if (temp > 30)     return { label: 'Medium Risk', color: 'var(--amber)', bg: 'var(--amber-light)' };
  return                    { label: 'Safe',        color: '#15803D',      bg: '#DCFCE7' };
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Sidebar ── */
function Sidebar({ tab, onSwitch, onPayments, dueCount, profile, onLogout, open, onClose }) {
  const { t, lang, setLang } = useLang();
  const nav = [
    { key: 'search',   icon: Search,          label: 'Find Warehouse' },
    { key: 'bookings', icon: BookOpen,         label: 'My Bookings'   },
    { key: 'payments', icon: CreditCard,       label: 'Payments', badge: dueCount },
    { key: 'profile',  icon: User,             label: 'Profile'       },
  ];
  function handleClick(key) {
    if (key === 'payments') { onPayments(); }
    else { onSwitch(key); }
    onClose();
  }
  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 199, backdropFilter: 'blur(2px)',
        }} aria-hidden="true" />
      )}
      <aside className={`app-sidebar${open ? ' open' : ''}`} aria-label="Sidebar navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <img src="/logo.png" alt="AgriStore" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
          <span className="sidebar-logo-text">AgriStore</span>
          <button onClick={onClose} className="icon-btn hide-desktop" style={{ marginLeft: 'auto', width: 30, height: 30 }}><X size={16} /></button>
        </div>
        {/* Nav */}
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <div className="sidebar-section-label">Navigation</div>
          {nav.map(item => (
            <button key={item.key} className={`sidebar-item${tab === item.key ? ' active' : ''}`}
              onClick={() => handleClick(item.key)} aria-current={tab === item.key ? 'page' : undefined}>
              <span className="s-icon"><item.icon size={18} strokeWidth={2} /></span>
              {item.label}
              {item.badge > 0 && <span className="s-badge">{item.badge > 9 ? '9+' : item.badge}</span>}
            </button>
          ))}
        </nav>
        {/* Language */}
        <div style={{ padding: '0 12px 12px' }}>
          <div className="sidebar-section-label">Language</div>
          <select className="form-input" style={{ fontSize: 13 }} value={lang} onChange={e => setLang(e.target.value)}>
            {Object.keys(langNames).map(l => <option key={l} value={l}>🌐 {langNames[l]}</option>)}
          </select>
        </div>
        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="nav-avatar" style={{ width: 36, height: 36, fontSize: 14, flexShrink: 0 }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (profile?.first_name?.[0] || 'F')}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile?.first_name} {profile?.last_name}</div>
              <div className="sidebar-user-role">{t.farmer}</div>
            </div>
          </div>
          <button className="sidebar-item" onClick={onLogout} style={{ color: 'var(--red)', marginTop: 4 }}>
            <span className="s-icon" style={{ background: 'var(--red-light)' }}><LogOut size={16} /></span>{t.logout}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value, accent, trend }) {
  return (
    <div className="stat-card" style={{ '--stat-accent': accent }}>
      <div className="stat-icon" style={{ background: accent + '18' }}>
        <Icon size={22} color={accent} strokeWidth={2} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {trend && <div className="stat-trend" style={{ color: accent }}>{trend}</div>}
    </div>
  );
}

/* ── Warehouse Card ── */
function WarehouseCard({ w, whNames, t, onView, onCall, onWhatsApp }) {
  const risk = checkSpoilage(w.temperature, w.humidity);
  return (
    <motion.div className="wh-card" whileHover={{ y: -4 }} onClick={() => onView(w)}>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={w.image_url || 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&auto=format'}
          alt={w.name} className="wh-card-img"
        />
        {/* Distance badge */}
        {w._dist != null && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
            borderRadius: 'var(--r-full)', padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 700, color: 'var(--green-800)',
            border: '1px solid var(--border)',
          }}>
            <MapPin size={11} strokeWidth={2.5} />
            {w._dist < 1 ? `${Math.round(w._dist * 1000)}m` : `${w._dist.toFixed(1)} km`}
          </div>
        )}
        {/* Rating badge */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          borderRadius: 'var(--r-full)', padding: '4px 10px',
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 700, color: '#FBC02D',
        }}>
          <Star size={11} fill="#FBC02D" strokeWidth={0} />
          {w.rating || '4.5'}
        </div>
      </div>

      <div className="wh-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div className="wh-name">{whNames[w.id] || w.name}</div>
            <div className="wh-loc" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={11} strokeWidth={2} /> {w.location}
            </div>
          </div>
          <span style={{
            background: risk.bg, color: risk.color,
            borderRadius: 'var(--r-full)', padding: '3px 10px',
            fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8,
          }}>{risk.label}</span>
        </div>

        {/* Environment */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)' }}>
            <Thermometer size={12} /> {w.temperature ?? '—'}°C
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)' }}>
            <Droplets size={12} /> {w.humidity ?? '—'}%
          </span>
          {w.storage_type && (
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>· {w.storage_type}</span>
          )}
        </div>

        <div className="wh-stats">
          <div className="wh-stat">
            <div className="wh-stat-val">₹{w.price}</div>
            <div className="wh-stat-lbl">/ton/day</div>
          </div>
          <div className="wh-stat">
            <div className="wh-stat-val">{w.available}T</div>
            <div className="wh-stat-lbl">Available</div>
          </div>
          <div className="wh-stat">
            <div className="wh-stat-val">{w.total_capacity || w.capacity || '—'}T</div>
            <div className="wh-stat-lbl">Total</div>
          </div>
          <div className="wh-stat" style={{
            background: w.available < 50 ? 'var(--red-light)' : '#DCFCE7',
          }}>
            <div className="wh-stat-val" style={{ fontSize: 12, color: w.available < 50 ? 'var(--red)' : '#15803D' }}>
              {w.available < 50 ? t.almostFull : t.available}
            </div>
            <div className="wh-stat-lbl">Status</div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }} onClick={e => e.stopPropagation()}>
          {w.phone && <>
            <a href={`tel:+${w.phone}`} className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              aria-label={`Call ${w.name}`} onClick={e => e.stopPropagation()}>
              <Phone size={13} /> {t.callWarehouse}
            </a>
            <a href={`https://wa.me/${w.phone}`} target="_blank" rel="noreferrer"
              className="btn btn-sm" aria-label={`WhatsApp ${w.name}`}
              style={{ background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={e => e.stopPropagation()}>
              <MessageCircle size={13} /> WA
            </a>
          </>}
          <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => onView(w)}>
            View Details <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Main FarmerDashboard
══════════════════════════════════════════ */
export default function FarmerDashboard() {
  const navigate = useNavigate();
  const { t, lang } = useLang();

  /* ── all original state ── */
  const [tab, setTab]               = useState('search');
  const [warehouses, setWarehouses] = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [search, setSearch]         = useState('');
  const [cropFilter, setCropFilter] = useState('All');
  const [hasSearched, setHasSearched] = useState(false);
  const [radiusKm, setRadiusKm]     = useState(25);
  const [bookings, setBookings]     = useState([]);
  const [profile, setProfile]       = useState(null);
  const [location, setLocation]     = useState(null);
  const [selectedWh, setSelectedWh] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [whNames, setWhNames]       = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const geocodeTimer = useRef(null);

  /* ── all original effects/logic ── */
  useEffect(() => {
    const u = getCurrentUser();
    if (u) setProfile(u);
    loadWarehouses();
    loadAllBookingsForNotifications();
  }, []);

  useEffect(() => {
    if (lang === 'English') { setWhNames({}); return; }
    let cancelled = false;
    Promise.all(filtered.map(async w => [w.id, await translateWarehouseName(w.name, lang)]))
      .then(entries => { if (!cancelled) setWhNames(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [filtered, lang]);

  async function loadAllBookingsForNotifications() {
    const user = getCurrentUser();
    if (!user) return;
    const { data } = await supabase.from('bookings').select('*')
      .eq('farmer_id', user.id).in('status', ['accepted', 'pending']);
    if (data) setBookings(data);
  }

  async function loadWarehouses() {
    let all = [], from = 0;
    while (true) {
      const { data, error } = await supabase.from('warehouses').select('*').range(from, from + 499);
      if (error || !data || data.length === 0) break;
      all = [...all, ...data];
      if (data.length < 500) break;
      from += 500;
    }
    if (all.length > 0) { setWarehouses(all); setFiltered(all); }
  }

  async function loadBookings() {
    const user = getCurrentUser();
    if (!user) return;
    const { data } = await supabase.from('bookings').select('*')
      .eq('farmer_id', user.id).order('created_at', { ascending: false });
    if (data) setBookings(data);
  }

  async function loadProfile() {
    const user = getCurrentUser();
    if (!user) return;
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (data) { setProfile(data); localStorage.setItem('agristore_user', JSON.stringify(data)); }
  }

  function handleTabSwitch(newTab) {
    setTab(newTab);
    if (newTab === 'bookings') loadBookings();
    if (newTab === 'profile')  loadProfile();
  }

  function handleSearch(val) {
    setSearch(val);
    setHasSearched(val.trim().length > 0 || cropFilter !== 'All' || !!location);
    applyFilters(val, cropFilter);
    clearTimeout(geocodeTimer.current);
    if (val.trim().length >= 3) geocodeTimer.current = setTimeout(() => geocodeAndCenter(val), 700);
  }

  async function geocodeAndCenter(query) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Tamil Nadu, India')}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (!data?.length) return;
      const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon);
      const city = data[0].display_name.split(',')[0];
      const loc = { lat, lng, city };
      setLocation(loc); setHasSearched(true);
      const s = query.toLowerCase();
      const nearby = warehouses.map(w => ({ ...w, _dist: (w.latitude && w.longitude) ? distanceKm(lat, lng, Number(w.latitude), Number(w.longitude)) : null }))
        .filter(w => (w._dist !== null && w._dist <= radiusKm) || w.name?.toLowerCase().includes(s) || w.location?.toLowerCase().includes(s))
        .sort((a, b) => (a._dist ?? 999) - (b._dist ?? 999));
      setFiltered(nearby);
    } catch { /* ignore */ }
  }

  function applyFilters(searchVal, crop, loc, radius) {
    const userLoc = loc !== undefined ? loc : location;
    const km = radius !== undefined ? radius : radiusKm;
    let result = warehouses;
    if (userLoc && !searchVal) {
      result = result.map(w => ({ ...w, _dist: (w.latitude && w.longitude) ? distanceKm(userLoc.lat, userLoc.lng, Number(w.latitude), Number(w.longitude)) : null }))
        .filter(w => w._dist !== null && w._dist <= km).sort((a, b) => a._dist - b._dist);
    } else if (searchVal) {
      const s = searchVal.toLowerCase();
      result = result.map(w => ({ ...w, _dist: (userLoc && w.latitude && w.longitude) ? distanceKm(userLoc.lat, userLoc.lng, Number(w.latitude), Number(w.longitude)) : null }))
        .filter(w => w.name?.toLowerCase().includes(s) || w.location?.toLowerCase().includes(s) || w.storage_type?.toLowerCase().includes(s) || w.crops?.toLowerCase().includes(s));
    }
    if (crop !== 'All') result = result.filter(w => w.suitable_crops?.toLowerCase().includes(crop.toLowerCase()) || w.crops?.toLowerCase().includes(crop.toLowerCase()) || w.storage_type?.toLowerCase().includes(crop.toLowerCase()));
    setFiltered(result);
  }

  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
      return city ? `${city}, ${data.address?.state || ''}` : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
  }

  function detectLocation() {
    if (!navigator.geolocation) { alert('GPS not supported'); return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      const city = await reverseGeocode(lat, lng);
      const loc = { lat: parseFloat(lat.toFixed(4)), lng: parseFloat(lng.toFixed(4)), city };
      setLocation(loc); setHasSearched(true); setSearch('');
      applyFilters('', cropFilter, loc, radiusKm);
    }, () => alert('Location permission denied ❌'));
  }

  function handleLogout() { logoutUser(); navigate('/'); }

  const crops = ['All', '🌾 Rice', '🌽 Maize', '🫘 Pulses', '🧅 Onion'];
  const dueCount = getAlertBookings(bookings).length;

  const confirmedBookings = bookings.filter(b => b.status === 'accepted');
  const pendingBookings   = bookings.filter(b => b.status === 'pending');
  const totalPaid = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + Number(b.total_amount || 0), 0);

  return (
    <div className="app-shell">
      <Sidebar tab={tab} onSwitch={handleTabSwitch} onPayments={() => setShowPayments(true)}
        dueCount={dueCount} profile={profile} onLogout={handleLogout}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        {/* Top Navbar */}
        <nav className="top-nav">
          <button className="icon-btn hide-desktop" onClick={() => setSidebarOpen(v => !v)} aria-label="Open menu">
            {sidebarOpen ? <X size={20} /> : <span style={{ fontSize: 18 }}>☰</span>}
          </button>
          <div className="nav-logo hide-desktop">
            <img src="/logo.png" alt="AgriStore" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} />
            <span>AgriStore</span>
          </div>
          {tab === 'search' && (
            <div className="top-nav nav-search" style={{ maxWidth: 480 }}>
              <Search size={15} color="var(--text-4)" />
              <input placeholder={`${t.searchPlaceholder || 'Search warehouses…'}`}
                value={search} onChange={e => handleSearch(e.target.value)} aria-label="Search warehouses" />
              {search && <button onClick={() => { setSearch(''); applyFilters('', cropFilter); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 0 }}><X size={14} /></button>}
            </div>
          )}
          <div className="nav-right">
            <button className="icon-btn" onClick={() => setShowPayments(true)} aria-label="Payments">
              <CreditCard size={18} strokeWidth={2} />
              {dueCount > 0 && <span className="badge-dot" />}
            </button>
            <div className="nav-avatar">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : (profile?.first_name?.[0] || 'F')}
            </div>
          </div>
        </nav>

        <div className="page-content">
          <AnimatePresence mode="wait">

          {/* ══════ SEARCH TAB ══════ */}
          {tab === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="page-header">
                <h1 className="page-title">{t.findWarehouse}</h1>
                <p className="page-sub">{t.findWarehouseSub}</p>
              </div>

              {/* Due notifications */}
              <DueNotifications bookings={bookings} onOpenPayments={() => setShowPayments(true)} />

              {/* Location bar */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16,
                background: 'var(--blue-light)', border: '1px solid #BFDBFE', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
                <MapPin size={16} color="var(--blue)" strokeWidth={2} />
                <span style={{ flex: 1, fontSize: 13, color: '#1D4ED8', fontWeight: 500 }}>
                  {location ? <><strong>{location.city || `${location.lat}, ${location.lng}`}</strong></> : 'Detect your location to find nearby warehouses'}
                </span>
                <select value={radiusKm} onChange={e => { setRadiusKm(Number(e.target.value)); if (location) applyFilters(search, cropFilter, location, Number(e.target.value)); }}
                  style={{ border: '1.5px solid #BFDBFE', borderRadius: 'var(--r-sm)', padding: '5px 10px', fontSize: 12, fontWeight: 700, color: '#1D4ED8', background: 'white', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                  {[5,10,25,50,100].map(v => <option key={v} value={v}>{v} km</option>)}
                </select>
                <button className="btn btn-sm" style={{ background: '#2563EB', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }} onClick={detectLocation}>
                  <Navigation size={13} /> Detect
                </button>
              </div>

              {/* Crop filter chips */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
                {crops.map(c => (
                  <button key={c} className={`chip${cropFilter === c ? ' active' : ''}`} onClick={() => { setCropFilter(c); setHasSearched(true); applyFilters(search, c); }}>
                    {c}
                  </button>
                ))}
              </div>

              {/* Map */}
              {!showDetail && !showBooking && !showSuccess && !showPayments && (
                <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <WarehouseMap warehouses={filtered} userLocation={location} hasSearched={hasSearched}
                    onSelect={w => { setSelectedWh(w); setShowDetail(true); }} />
                </div>
              )}

              {/* Result header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div className="section-title">{hasSearched ? `${filtered.length} Warehouses Found` : t.nearbyWarehouses || 'Nearby Warehouses'}</div>
                  <div className="section-sub">
                    {hasSearched && location && !search ? `Within ${radiusKm}km of ${location.city || 'your location'}` : t.typeAreaHint || 'Enter a location or crop type to search'}
                  </div>
                </div>
                {hasSearched && (
                  <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                    onClick={() => { setSearch(''); setCropFilter('All'); setHasSearched(false); setFiltered(warehouses); }}>
                    <Filter size={14} /> Clear
                  </button>
                )}
              </div>

              {/* Warehouse cards */}
              {hasSearched && (
                <div className="cards-grid">
                  {filtered.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                      <div className="empty-icon"><Warehouse size={32} color="var(--green-600)" /></div>
                      <h3>No warehouses found</h3>
                      <p>Try expanding your search radius or changing the location.</p>
                    </div>
                  ) : filtered.map(w => (
                    <WarehouseCard key={w.id} w={w} whNames={whNames} t={t}
                      onView={w => { setSelectedWh(w); setShowDetail(true); }} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ══════ BOOKINGS TAB ══════ */}
          {tab === 'bookings' && (
            <motion.div key="bookings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="page-header">
                <h1 className="page-title">{t.myBookings}</h1>
                <p className="page-sub">{t.myBookingsSub}</p>
              </div>
              <div className="stats-grid" style={{ marginBottom: 24 }}>
                <StatCard icon={CheckCircle} label={t.confirmed}     value={confirmedBookings.length} accent="#15803D" />
                <StatCard icon={Clock}       label={t.pending}       value={pendingBookings.length}   accent="var(--amber)" />
                <StatCard icon={TrendingUp}  label={t.totalPaid}     value={`₹${totalPaid.toLocaleString('en-IN')}`} accent="var(--purple)" />
                <StatCard icon={Package}     label={t.totalBookings} value={bookings.length}           accent="var(--blue)" />
              </div>

              {bookings.length === 0 ? (
                <div className="empty-state card">
                  <div className="empty-icon"><BookOpen size={32} color="var(--green-600)" /></div>
                  <h3>{t.noBookingsYet}</h3>
                  <p>Book a warehouse to store your harvest safely.</p>
                  <button className="btn btn-primary" onClick={() => setTab('search')}>{t.findWarehouse}</button>
                </div>
              ) : bookings.map((b, i) => (
                <motion.div key={b.id} className="booking-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ borderLeft: `4px solid ${b.status === 'accepted' ? '#15803D' : b.status === 'rejected' ? 'var(--red)' : 'var(--amber)'}` }}>
                  <div className="booking-header">
                    <div style={{ flex: 1 }}>
                      <div className="booking-name">{b.warehouse_name}</div>
                      <div className="booking-meta" style={{ marginTop: 4 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Package size={11} /> {b.crop_type}</span>
                        <span style={{ margin: '0 6px', color: 'var(--border-2)' }}>·</span>
                        {b.quantity}T · {b.days} days
                      </div>
                      {b.start_date && <div className="booking-meta">📅 {fmtDate(b.start_date)} → {fmtDate(b.due_date)}</div>}
                      {b.total_amount > 0 && (
                        <div className="booking-meta" style={{ fontWeight: 700, color: 'var(--green-800)', marginTop: 4 }}>
                          ₹{Number(b.total_amount).toLocaleString('en-IN')}
                          <span style={{ margin: '0 6px', color: 'var(--border-2)', fontWeight: 400 }}>·</span>
                          <span style={{ color: b.payment_status === 'paid' ? '#15803D' : 'var(--amber)' }}>
                            {b.payment_status === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className={`status-pill ${b.status === 'accepted' ? 'status-confirmed' : b.status === 'rejected' ? 'status-rejected' : 'status-pending'}`}>
                      {b.status === 'accepted' ? `✓ ${t.confirmed}` : b.status === 'rejected' ? `✗ ${t.rejected}` : `⏳ ${t.pending}`}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ══════ PROFILE TAB ══════ */}
          {tab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="page-header">
                <h1 className="page-title">{t.profile}</h1>
                <p className="page-sub">Manage your account and preferences</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 20 }}>
                {/* Profile card */}
                <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                  <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 16px' }}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--green-400)' }} />
                      : <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,var(--green-800),var(--green-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'white', fontFamily: 'var(--font-head)', fontWeight: 700, border: '3px solid var(--green-100)' }}>
                          {profile?.first_name?.[0] || 'F'}
                        </div>}
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                    {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || t.farmer : '...'}
                  </h2>
                  {profile?.mobile && <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 3 }}>📞 +91 {profile.mobile}</p>}
                  {profile?.email  && <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 3 }}>✉️ {profile.email}</p>}
                  {profile?.state_district && <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>📍 {profile.state_district}</p>}
                  <span className="badge badge-green" style={{ marginBottom: 16 }}>{t.farmer}</span>
                  <div><button className="btn btn-primary btn-sm" onClick={() => setShowEditProfile(true)}>{t.editProfile}</button></div>
                </div>

                {/* Stats card */}
                <div className="card">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{t.activitySummary}</h3>
                  {[
                    ['Total Bookings', bookings.length, 'var(--blue)'],
                    [t.confirmed,      confirmedBookings.length, '#15803D'],
                    ['Pending',        pendingBookings.length, 'var(--amber)'],
                    ['Total Paid',     `₹${totalPaid.toLocaleString('en-IN')}`, 'var(--purple)'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                      <span style={{ color: 'var(--text-3)' }}>{label}</span>
                      <span style={{ fontWeight: 700, color }}>{val}</span>
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 16, width: '100%', color: 'var(--red)', display:'flex',alignItems:'center',gap:6,justifyContent:'center' }} onClick={handleLogout}>
                    <LogOut size={14} /> {t.logout}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          </AnimatePresence>
        </div>

        <FarmerBottomNav activeTab={tab} onSwitch={handleTabSwitch}
          onPayments={() => setShowPayments(true)} dueCount={dueCount} />
      </div>

      {/* ── Modals (logic unchanged) ── */}
      <WarehouseDetailModal open={showDetail} warehouse={selectedWh}
        onClose={() => setShowDetail(false)} onBook={() => { setShowDetail(false); setShowBooking(true); }} />
      <BookingModal open={showBooking} warehouse={selectedWh}
        onClose={() => setShowBooking(false)}
        onSuccess={() => { setShowSuccess(true); handleTabSwitch('bookings'); loadAllBookingsForNotifications(); }} />
      <BookingSuccessModal open={showSuccess} onClose={() => setShowSuccess(false)} />
      <PaymentHistoryModal open={showPayments} onClose={() => setShowPayments(false)} />
      <EditProfileModal open={showEditProfile} onClose={() => setShowEditProfile(false)} profile={profile}
        onSaved={updated => { setProfile(updated); localStorage.setItem('agristore_user', JSON.stringify(updated)); }} />
    </div>
  );
}
