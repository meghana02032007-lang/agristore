import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, LayoutDashboard, ClipboardList, User, LogOut,
  Plus, Pencil, RefreshCw, Warehouse, TrendingUp,
  Thermometer, Droplets, X, CheckCircle, XCircle, Clock,
  Package, ChevronRight, BarChart3, Building2,
} from 'lucide-react';
import { supabase } from '../supabase';
import { useLang } from '../LangContext';
import { langNames } from '../i18n';
import { getCurrentUser, logoutUser } from '../auth';
import { OwnerBottomNav } from '../components/BottomNav';
import Modal, { ModalHeader } from '../components/Modal';
import EditProfileModal from '../components/EditProfileModal';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtMoney(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

/* ── Sidebar ── */
function Sidebar({ tab, onSwitch, profile, onLogout, open, onClose }) {
  const { t, lang, setLang } = useLang();
  const nav = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { key: 'bookings',  icon: ClipboardList,   label: 'Bookings'  },
    { key: 'profile',   icon: User,            label: 'Profile'   },
  ];
  return (
    <>
      {open && <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:199,backdropFilter:'blur(2px)' }} />}
      <aside className={`app-sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="AgriStore" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
          <span className="sidebar-logo-text">AgriStore</span>
          <button onClick={onClose} className="icon-btn hide-desktop" style={{ marginLeft:'auto',width:30,height:30 }}><X size={16}/></button>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {nav.map(item => (
            <button key={item.key} className={`sidebar-item${tab===item.key?' active':''}`}
              onClick={() => { onSwitch(item.key); onClose(); }}>
              <span className="s-icon"><item.icon size={18} strokeWidth={2}/></span>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:'0 12px 12px' }}>
          <div className="sidebar-section-label">Language</div>
          <select className="form-input" style={{ fontSize:13 }} value={lang} onChange={e => setLang(e.target.value)}>
            {Object.keys(langNames).map(l => <option key={l} value={l}>🌐 {langNames[l]}</option>)}
          </select>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="nav-avatar" style={{ width:36,height:36,fontSize:14,flexShrink:0 }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                : (profile?.first_name?.[0] || 'O')}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile?.first_name} {profile?.last_name}</div>
              <div className="sidebar-user-role">{t.owner}</div>
            </div>
          </div>
          <button className="sidebar-item" onClick={onLogout} style={{ color:'var(--red)',marginTop:4 }}>
            <span className="s-icon" style={{ background:'var(--red-light)' }}><LogOut size={16}/></span>{t.logout}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="stat-card" style={{ '--stat-accent': accent }}>
      <div className="stat-icon" style={{ background: accent + '18' }}>
        <Icon size={22} color={accent} strokeWidth={2}/>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize:12, color:'var(--text-4)', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

/* ── Warehouse Form Modal (business logic unchanged) ── */
function WarehouseFormModal({ open, onClose, initial, userId, onSaved }) {
  const { t } = useLang();
  const isEdit = !!initial?.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'',location:'',total_capacity:'',available:'',price:'',storage_type:'General Storage',crops:'',temperature:'',humidity:'',phone:'' });
  const storageTypes = ['General Storage','Cold Storage','Dry Storage','Ventilated Storage','Silo'];

  useEffect(() => {
    if (initial) setForm({ name:initial.name||'',location:initial.location||'',total_capacity:initial.total_capacity||'',available:initial.available||'',price:initial.price||'',storage_type:initial.storage_type||'General Storage',crops:initial.crops||'',temperature:initial.temperature||'',humidity:initial.humidity||'',phone:initial.phone||'' });
    else setForm({ name:'',location:'',total_capacity:'',available:'',price:'',storage_type:'General Storage',crops:'',temperature:'',humidity:'',phone:'' });
  }, [initial, open]);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function save() {
    if (!form.name || !form.location || !form.total_capacity || !form.price) { alert('Please fill Name, Location, Capacity and Price'); return; }
    setSaving(true);
    const payload = { name:form.name,location:form.location,total_capacity:Number(form.total_capacity),available:Number(form.available||form.total_capacity),price:Number(form.price),storage_type:form.storage_type,crops:form.crops,temperature:form.temperature?Number(form.temperature):null,humidity:form.humidity?Number(form.humidity):null,phone:form.phone,owner_id:userId };
    let error;
    if (isEdit) ({ error } = await supabase.from('warehouses').update(payload).eq('id', initial.id));
    else ({ error } = await supabase.from('warehouses').insert([payload]));
    setSaving(false);
    if (error) { alert('❌ ' + error.message); return; }
    onSaved(); onClose();
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={480}>
      <ModalHeader title={isEdit ? `Edit Warehouse` : `Add Warehouse`} sub={isEdit ? initial.name : 'Register your warehouse on AgriStore'} onClose={onClose}/>
      <div className="form-group"><label className="form-label">Warehouse Name *</label><input className="form-input" placeholder="e.g. Krishna Storage Pvt Ltd" value={form.name} onChange={e=>set('name',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Location *</label><input className="form-input" placeholder="e.g. Ranipet, Tamil Nadu" value={form.location} onChange={e=>set('location',e.target.value)}/></div>
      <div className="row">
        <div className="form-group"><label className="form-label">Total Capacity (T) *</label><input className="form-input" type="number" placeholder="1000" value={form.total_capacity} onChange={e=>set('total_capacity',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Available (T)</label><input className="form-input" type="number" placeholder="Same as capacity" value={form.available} onChange={e=>set('available',e.target.value)}/></div>
      </div>
      <div className="row">
        <div className="form-group"><label className="form-label">Price/ton/day ₹ *</label><input className="form-input" type="number" placeholder="180" value={form.price} onChange={e=>set('price',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Phone</label><input className="form-input" type="tel" placeholder="9876543210" value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
      </div>
      <div className="form-group"><label className="form-label">Storage Type</label><select className="form-input" value={form.storage_type} onChange={e=>set('storage_type',e.target.value)}>{storageTypes.map(s=><option key={s}>{s}</option>)}</select></div>
      <div className="form-group"><label className="form-label">Accepted Crops (comma separated)</label><input className="form-input" placeholder="Rice, Maize, Pulses" value={form.crops} onChange={e=>set('crops',e.target.value)}/></div>
      <div className="row">
        <div className="form-group"><label className="form-label">Temperature (°C)</label><input className="form-input" type="number" placeholder="22" value={form.temperature} onChange={e=>set('temperature',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Humidity (%)</label><input className="form-input" type="number" placeholder="55" value={form.humidity} onChange={e=>set('humidity',e.target.value)}/></div>
      </div>
      {form.total_capacity && (
        <div style={{ background:'var(--green-100)',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--green-800)' }}>
          <div className="progress-bar" style={{ height:6,marginBottom:6 }}>
            <div className="progress-fill" style={{ width:`${Math.round(((form.total_capacity-(form.available||form.total_capacity))/form.total_capacity)*100)}%` }}/>
          </div>
          {form.available||form.total_capacity}T free / {form.total_capacity}T total · ₹{form.price}/ton/day
        </div>
      )}
      <button className="btn btn-primary btn-full mt-2" onClick={save} disabled={saving}>
        {saving ? `⏳ ${t.saving}` : isEdit ? t.saveChanges : t.addWarehouse}
      </button>
    </Modal>
  );
}

/* ══════════════════════════════════════════
   Main OwnerDashboard
══════════════════════════════════════════ */
export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { t } = useLang();

  const [tab, setTab]                     = useState('dashboard');
  const [userId, setUserId]               = useState(null);
  const [profile, setProfile]             = useState(null);
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [warehouse, setWarehouse]         = useState(null);
  const [bookings, setBookings]           = useState([]);
  const [bookingFilter, setBookingFilter] = useState('pending');
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse]   = useState(null);
  const [showClearConfirm, setShowClearConfirm]   = useState(false);
  const [clearing, setClearing]           = useState(false);
  const [showEditProfile, setShowEditProfile]     = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) { setProfile(u); setUserId(u.id); loadWarehouses(u.id); }
    loadBookingsData();
  }, []);

  async function loadBookingsData() {
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (data) setBookings(data);
  }
  async function loadWarehouses(uid) {
    const id = uid || userId;
    let { data, error } = await supabase.from('warehouses').select('*').eq('owner_id', id);
    if (error?.message?.includes('owner_id')) ({ data } = await supabase.from('warehouses').select('*'));
    if (data?.length > 0) {
      setAllWarehouses(data);
      setWarehouse(prev => { const still = prev && data.find(w => w.id === prev.id); return still || data[0]; });
    } else { setAllWarehouses([]); setWarehouse(null); }
  }
  async function loadBookings() {
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (data) setBookings(data);
  }
  function handleTabSwitch(newTab) { setTab(newTab); if (newTab === 'bookings') loadBookings(); }

  async function updateBookingStatus(id, status, booking) {
    await supabase.from('bookings').update({ status }).eq('id', id);
    if (status === 'accepted' && warehouse) {
      const newAvail = Math.max(0, Number(warehouse.available) - Number(booking.quantity));
      await supabase.from('warehouses').update({ available: newAvail }).eq('id', warehouse.id);
      setWarehouse(prev => ({ ...prev, available: newAvail }));
      setAllWarehouses(prev => prev.map(w => w.id === warehouse.id ? { ...w, available: newAvail } : w));
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }
  async function clearCapacity() {
    if (!warehouse) return;
    setClearing(true);
    const { error } = await supabase.from('warehouses').update({ available: warehouse.total_capacity }).eq('id', warehouse.id);
    setClearing(false); setShowClearConfirm(false);
    if (error) { alert('❌ ' + error.message); return; }
    const updated = { ...warehouse, available: warehouse.total_capacity };
    setWarehouse(updated); setAllWarehouses(prev => prev.map(w => w.id === warehouse.id ? updated : w));
  }
  function handleLogout() { logoutUser(); navigate('/'); }

  const total     = Number(warehouse?.total_capacity || 0);
  const available = Number(warehouse?.available || 0);
  const occupied  = total - available;
  const usedPct   = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const capacityColor = usedPct >= 90 ? 'var(--red)' : usedPct >= 70 ? 'var(--amber)' : '#15803D';
  const pending   = bookings.filter(b => b.status === 'pending');
  const accepted  = bookings.filter(b => b.status === 'accepted');
  const rejected  = bookings.filter(b => b.status === 'rejected');
  const now = new Date();
  const thisMonthRevenue = bookings.filter(b => b.status==='accepted' && b.created_at && new Date(b.created_at).getMonth()===now.getMonth() && new Date(b.created_at).getFullYear()===now.getFullYear()).reduce((s,b)=>s+Number(b.total_amount||0),0);
  const totalRevenue = bookings.filter(b=>b.status==='accepted').reduce((s,b)=>s+Number(b.total_amount||0),0);
  const displayedBookings = bookings.filter(b => bookingFilter==='all' ? true : b.status===bookingFilter);

  return (
    <div className="app-shell">
      <Sidebar tab={tab} onSwitch={handleTabSwitch} profile={profile} onLogout={handleLogout}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        {/* Navbar */}
        <nav className="top-nav">
          <button className="icon-btn hide-desktop" onClick={() => setSidebarOpen(v=>!v)} aria-label="Menu">
            {sidebarOpen ? <X size={20}/> : <span style={{fontSize:18}}>☰</span>}
          </button>
          <div className="nav-logo hide-desktop"><img src="/logo.png" alt="AgriStore" style={{ width:24,height:24,borderRadius:6,objectFit:'cover' }}/><span>AgriStore</span></div>
          <div style={{ flex:1 }}/>
          <div className="nav-right">
            <button className="btn btn-primary btn-sm" style={{ display:'flex',alignItems:'center',gap:6 }}
              onClick={() => { setEditingWarehouse(null); setShowWarehouseForm(true); }}>
              <Plus size={14}/> Add Warehouse
            </button>
            <div className="nav-avatar" style={{ flexShrink:0 }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%' }}/> : (profile?.first_name?.[0]||'O')}
            </div>
          </div>
        </nav>

        <div className="page-content">
          <AnimatePresence mode="wait">

          {/* ══════ DASHBOARD TAB ══════ */}
          {tab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}>
              <div className="page-header">
                <h1 className="page-title">{t.warehouseDashboard}</h1>
                <p className="page-sub">{t.warehouseDashboardSub}</p>
              </div>

              {/* No warehouses */}
              {allWarehouses.length === 0 && (
                <div className="empty-state card">
                  <div className="empty-icon"><Building2 size={32} color="var(--green-600)"/></div>
                  <h3>{t.noWarehousesYet}</h3>
                  <p>{t.noWarehousesSub}</p>
                  <button className="btn btn-primary" onClick={() => { setEditingWarehouse(null); setShowWarehouseForm(true); }}>
                    <Plus size={16}/> {t.addMyWarehouse}
                  </button>
                </div>
              )}

              {warehouse && (<>
                {/* Warehouse selector */}
                {allWarehouses.length > 1 && (
                  <div className="form-group" style={{ maxWidth:360, marginBottom:20 }}>
                    <label className="form-label">{t.selectWarehouse}</label>
                    <select className="form-input" value={warehouse.id} onChange={e=>setWarehouse(allWarehouses.find(w=>w.id===e.target.value))}>
                      {allWarehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Warehouse header card */}
                <div className="card" style={{ marginBottom:24, background:'linear-gradient(135deg,var(--green-800),var(--green-600))', color:'white', border:'none' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12 }}>
                    <div>
                      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                        <Warehouse size={20} color="rgba(255,255,255,0.9)"/>
                        <h2 style={{ fontFamily:'var(--font-head)',fontSize:20,fontWeight:700,color:'white' }}>{warehouse.name}</h2>
                      </div>
                      <p style={{ fontSize:13,color:'rgba(255,255,255,0.8)',marginBottom:4 }}>📍 {warehouse.location}</p>
                      <p style={{ fontSize:13,color:'rgba(255,255,255,0.8)' }}>₹{warehouse.price}/ton/day · {warehouse.storage_type}</p>
                    </div>
                    <button className="btn btn-sm" style={{ background:'rgba(255,255,255,0.2)',color:'white',border:'1px solid rgba(255,255,255,0.3)',display:'flex',alignItems:'center',gap:6 }}
                      onClick={() => { setEditingWarehouse(warehouse); setShowWarehouseForm(true); }}>
                      <Pencil size={13}/> Edit
                    </button>
                  </div>
                  {/* Capacity bar */}
                  <div style={{ marginTop:16 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,0.8)',marginBottom:6 }}>
                      <span>{t.capacityUsed}</span><span>{usedPct}%</span>
                    </div>
                    <div style={{ height:8,background:'rgba(255,255,255,0.2)',borderRadius:'var(--r-full)',overflow:'hidden' }}>
                      <div style={{ height:'100%',borderRadius:'var(--r-full)',background:'white',opacity:0.9,width:`${usedPct}%`,transition:'width 0.5s ease' }}/>
                    </div>
                    <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,0.75)',marginTop:6 }}>
                      <span>{available}T free</span><span>{total}T total</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom:24 }}>
                  <StatCard icon={Package}    label="Available"       value={`${available}T`}            accent="#15803D" />
                  <StatCard icon={BarChart3}   label="Occupied"        value={`${occupied}T`}             accent="var(--amber)" />
                  <StatCard icon={Clock}       label="Pending"         value={pending.length}              accent="var(--blue)" />
                  <StatCard icon={TrendingUp}  label={t.thisMonth}   value={fmtMoney(thisMonthRevenue)} accent="var(--purple)" />
                </div>

                {/* Revenue card */}
                <div className="card" style={{ marginBottom:20 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
                    <h3 style={{ fontSize:15,fontWeight:700 }}>{t.revenueOverview}</h3>
                    <span className="badge badge-green">{t.allTime}: {fmtMoney(totalRevenue)}</span>
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12 }}>
                    {[
                      { label:t.thisMonth,  value:fmtMoney(thisMonthRevenue), color:'var(--purple)' },
                      { label:t.allTime,    value:fmtMoney(totalRevenue),     color:'#15803D'       },
                      { label:t.accepted,   value:accepted.length,             color:'#15803D'       },
                      { label:t.pending,    value:pending.length,              color:'var(--amber)'  },
                    ].map(r => (
                      <div key={r.label} style={{ background:'var(--surface-2)',borderRadius:'var(--r)',padding:'14px 12px' }}>
                        <div style={{ fontSize:20,fontWeight:800,color:r.color,fontFamily:'var(--font-head)' }}>{r.value}</div>
                        <div style={{ fontSize:12,color:'var(--text-3)',marginTop:3 }}>{r.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Environment */}
                {(warehouse.temperature || warehouse.humidity) && (
                  <div className="card" style={{ marginBottom:20 }}>
                    <h3 style={{ fontSize:15,fontWeight:700,marginBottom:12 }}>{t.storageConditions}</h3>
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
                      {[
                        { icon:Thermometer, val:`${warehouse.temperature}°C`, label:'Temperature', bg:'var(--blue-light)',  color:'var(--blue)'  },
                        { icon:Droplets,    val:`${warehouse.humidity}%`,      label:'Humidity',    bg:'var(--green-100)',  color:'#15803D'       },
                        { icon:Package,     val: warehouse.humidity>75 ? 'High Risk' : warehouse.temperature>30 ? 'Med Risk' : 'Safe',
                          label:'Spoilage Risk', bg: warehouse.humidity>75 ? 'var(--red-light)' : 'var(--amber-light)',
                          color: warehouse.humidity>75 ? 'var(--red)' : 'var(--amber)' },
                      ].map(e => (
                        <div key={e.label} style={{ background:e.bg,borderRadius:'var(--r)',padding:'12px',textAlign:'center' }}>
                          <e.icon size={18} color={e.color} strokeWidth={2} style={{ marginBottom:6 }}/>
                          <div style={{ fontSize:15,fontWeight:800,color:e.color }}>{e.val}</div>
                          <div style={{ fontSize:11,color:'var(--text-3)',marginTop:2 }}>{e.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crops */}
                {warehouse.crops && (
                  <div className="card" style={{ marginBottom:20 }}>
                    <h3 style={{ fontSize:15,fontWeight:700,marginBottom:10 }}>{t.acceptedCrops}</h3>
                    <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                      {warehouse.crops.split(',').map(c=><span key={c} className="chip active">{c.trim()}</span>)}
                    </div>
                  </div>
                )}

                {/* Clear capacity + Add warehouse */}
                <div style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
                  <button className="btn btn-ghost" style={{ display:'flex',alignItems:'center',gap:6 }}
                    onClick={() => setShowClearConfirm(true)} disabled={available===total}>
                    <RefreshCw size={15}/> {t.resetCapacity} ({total}T)
                  </button>
                  <button className="btn btn-primary" style={{ display:'flex',alignItems:'center',gap:6 }}
                    onClick={() => { setEditingWarehouse(null); setShowWarehouseForm(true); }}>
                    <Plus size={15}/> {t.addAnother}
                  </button>
                </div>
              </>)}
            </motion.div>
          )}

          {/* ══════ BOOKINGS TAB ══════ */}
          {tab === 'bookings' && (
            <motion.div key="bookings" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}>
              <div className="page-header">
                <h1 className="page-title">{t.bookingRequests}</h1>
                <p className="page-sub">{t.bookingRequestsSub}</p>
              </div>

              <div className="tab-bar" style={{ marginBottom:20 }}>
                {[[t.pending,`${t.pending} (${pending.length})`],[t.accepted,`${t.accepted} (${accepted.length})`],[t.rejected,`${t.rejected} (${rejected.length})`],[t.all,t.all]].map(([key,label])=>(
                  <div key={key} className={`tab${bookingFilter===key?' active':''}`} onClick={()=>setBookingFilter(key)}>{label}</div>
                ))}
              </div>

              {displayedBookings.length === 0 ? (
                <div className="empty-state card">
                  <div className="empty-icon"><ClipboardList size={32} color="var(--green-600)"/></div>
                  <h3>No bookings here</h3>
                  <p>Booking requests from farmers will appear here.</p>
                </div>
              ) : displayedBookings.map((b, i) => (
                <motion.div key={b.id} className="booking-card" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.04 }}
                  style={{ borderLeft:`4px solid ${b.status==='pending'?'var(--amber)':b.status==='accepted'?'#15803D':'var(--red)'}` }}>
                  <div className="booking-header">
                    <div style={{ flex:1 }}>
                      <div className="booking-name">{b.crop_type} · {b.quantity}T · {b.days} days</div>
                      <div className="booking-meta">📦 {b.warehouse_name}</div>
                      {b.start_date && <div className="booking-meta">📅 {fmtDate(b.start_date)} → {fmtDate(b.due_date)}</div>}
                      {b.total_amount > 0 && (
                        <div className="booking-meta" style={{ fontWeight:700,color:'var(--green-800)',marginTop:4 }}>
                          {fmtMoney(b.total_amount)} · <span style={{ color:b.payment_status==='paid'?'#15803D':'var(--amber)' }}>{b.payment_status==='paid'?'✓ Paid':'⏳ Unpaid'}</span>
                        </div>
                      )}
                    </div>
                    <span className={`status-pill ${b.status==='accepted'?'status-confirmed':b.status==='rejected'?'status-rejected':'status-pending'}`}>
                      {b.status==='accepted'?'✓ Confirmed':b.status==='rejected'?'✗ Rejected':'⏳ Pending'}
                    </span>
                  </div>
                  {b.status === 'pending' && (
                    <div className="booking-actions">
                      <button className="btn btn-primary btn-sm" style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}
                        onClick={()=>updateBookingStatus(b.id,'accepted',b)}><CheckCircle size={14}/> Accept</button>
                      <button className="btn btn-danger btn-sm" style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}
                        onClick={()=>updateBookingStatus(b.id,'rejected',b)}><XCircle size={14}/> Reject</button>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ══════ PROFILE TAB ══════ */}
          {tab === 'profile' && (
            <motion.div key="profile" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}>
              <div className="page-header"><h1 className="page-title">{t.profile}</h1></div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20 }}>
                <div className="card" style={{ textAlign:'center',padding:'32px 24px' }}>
                  <div style={{ width:96,height:96,margin:'0 auto 16px',borderRadius:'50%',background:'linear-gradient(135deg,var(--green-800),var(--green-600))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,color:'white',fontFamily:'var(--font-head)',fontWeight:700,border:'3px solid var(--green-100)' }}>
                    {profile?.avatar_url?<img src={profile.avatar_url} alt="" style={{ width:96,height:96,borderRadius:'50%',objectFit:'cover' }}/>:(profile?.first_name?.[0]||'O')}
                  </div>
                  <h2 style={{ fontFamily:'var(--font-head)',fontSize:20,fontWeight:700,marginBottom:6 }}>{profile?`${profile.first_name||''} ${profile.last_name||''}`.trim()||'Owner':'Loading…'}</h2>
                  {profile?.mobile && <p style={{ fontSize:13,color:'var(--text-3)',marginBottom:3 }}>📞 +91 {profile.mobile}</p>}
                  {profile?.email  && <p style={{ fontSize:13,color:'var(--text-3)',marginBottom:3 }}>✉️ {profile.email}</p>}
                  <span className="badge badge-blue" style={{ margin:'8px 0 16px',display:'inline-block' }}>🏭 {t.owner}</span>
                  <div><button className="btn btn-primary btn-sm" onClick={()=>setShowEditProfile(true)}>{t.editProfile}</button></div>
                </div>
                <div className="card">
                  <h3 style={{ fontSize:15,fontWeight:700,marginBottom:16 }}>Stats</h3>
                  {[['Warehouses',allWarehouses.length],['Total Bookings',bookings.length],['Accepted',accepted.length],['Pending',pending.length],['All-Time Revenue',fmtMoney(totalRevenue)],['Available Space',`${available}T / ${total}T`]].map(([label,val])=>(
                    <div key={label} style={{ display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:14 }}>
                      <span style={{ color:'var(--text-3)' }}>{label}</span><span style={{ fontWeight:700 }}>{val}</span>
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" style={{ marginTop:16,width:'100%',color:'var(--red)',display:'flex',alignItems:'center',gap:6,justifyContent:'center' }} onClick={handleLogout}><LogOut size={14}/> {t.logout}</button>
                </div>
              </div>
            </motion.div>
          )}

          </AnimatePresence>
        </div>
        <OwnerBottomNav activeTab={tab} onSwitch={handleTabSwitch}/>
      </div>

      <WarehouseFormModal open={showWarehouseForm} onClose={()=>setShowWarehouseForm(false)} initial={editingWarehouse} userId={userId} onSaved={()=>loadWarehouses()}/>
      <Modal open={showClearConfirm} onClose={()=>setShowClearConfirm(false)} maxWidth={340}>
        <div style={{ textAlign:'center',padding:'8px 0' }}>
          <div style={{ width:56,height:56,borderRadius:'50%',background:'var(--amber-light)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}><RefreshCw size={24} color="var(--amber)"/></div>
          <h3 style={{ fontSize:18,fontWeight:700,marginBottom:8 }}>{t.resetCapacity}?</h3>
          <p style={{ fontSize:14,color:'var(--text-3)',marginBottom:20,lineHeight:1.6 }}>This will mark all {total}T as available. Use this after clearing stored goods.</p>
          <div style={{ display:'flex',gap:10 }}>
            <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setShowClearConfirm(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={clearCapacity} disabled={clearing}>{clearing?'⏳…':'Confirm Reset'}</button>
          </div>
        </div>
      </Modal>
      <EditProfileModal open={showEditProfile} onClose={()=>setShowEditProfile(false)} profile={profile}
        onSaved={updated=>{ setProfile(updated); localStorage.setItem('agristore_user',JSON.stringify(updated)); }}/>
    </div>
  );
}
