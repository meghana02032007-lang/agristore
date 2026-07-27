import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, LayoutDashboard, ClipboardList, BookOpen, User, LogOut,
  ShieldCheck, CheckCircle, XCircle, Clock, TrendingUp, Trash2,
  Search, X, Users, Warehouse, AlertTriangle,
} from 'lucide-react';
import { supabase } from '../supabase';
import { getCurrentUser, logoutUser } from '../auth';
import { AdminBottomNav } from '../components/BottomNav';
import { langNames } from '../i18n';
import { useLang } from '../LangContext';

function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
function fmtMoney(n) { return '₹'+Number(n||0).toLocaleString('en-IN'); }

/* ── Sidebar ── */
function Sidebar({ tab, onSwitch, profile, onLogout, open, onClose }) {
  const { t, lang, setLang } = useLang();
  const nav = [
    { key:'overview',  icon:LayoutDashboard, label:'Overview'  },
    { key:'approvals', icon:ShieldCheck,     label:'Approvals' },
    { key:'bookings',  icon:BookOpen,        label:'Bookings'  },
    { key:'profile',   icon:User,            label:'Profile'   },
  ];
  return (
    <>
      {open && <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:199,backdropFilter:'blur(2px)' }}/>}
      <aside className={`app-sidebar${open?' open':''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="AgriStore" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
          <span className="sidebar-logo-text">AgriStore</span>
          <button onClick={onClose} className="icon-btn hide-desktop" style={{ marginLeft:'auto',width:30,height:30 }}><X size={16}/></button>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Admin Panel</div>
          {nav.map(item=>(
            <button key={item.key} className={`sidebar-item${tab===item.key?' active':''}`} onClick={()=>{ onSwitch(item.key); onClose(); }}>
              <span className="s-icon"><item.icon size={18} strokeWidth={2}/></span>{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:'0 12px 12px' }}>
          <div className="sidebar-section-label">Language</div>
          <select className="form-input" style={{ fontSize:13 }} value={lang} onChange={e=>setLang(e.target.value)}>
            {Object.keys(langNames).map(l=><option key={l} value={l}>🌐 {langNames[l]}</option>)}
          </select>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="nav-avatar" style={{ width:36,height:36,fontSize:14,flexShrink:0,background:'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              {profile?.first_name?.[0]||'A'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile?.first_name} {profile?.last_name}</div>
              <div className="sidebar-user-role">Administrator</div>
            </div>
          </div>
          <button className="sidebar-item" onClick={onLogout} style={{ color:'var(--red)',marginTop:4 }}>
            <span className="s-icon" style={{ background:'var(--red-light)' }}><LogOut size={16}/></span>Logout
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Stat card ── */
function StatCard({ icon:Icon, label, value, accent }) {
  return (
    <div className="stat-card" style={{ '--stat-accent':accent }}>
      <div className="stat-icon" style={{ background:accent+'18' }}><Icon size={22} color={accent} strokeWidth={2}/></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ── Owner approval card ── */
function OwnerCard({ owner, onApprove, onReject, loading }) {
  return (
    <motion.div className="card" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}
      style={{ marginBottom:12, borderLeft:'4px solid var(--amber)' }}>
      <div style={{ display:'flex',alignItems:'flex-start',gap:14,marginBottom:14 }}>
        <div style={{ width:48,height:48,borderRadius:'var(--r)',background:'linear-gradient(135deg,var(--amber-light),#FDE68A)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <Warehouse size={22} color="var(--amber)" strokeWidth={2}/>
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontWeight:700,fontSize:16,marginBottom:3 }}>{owner.first_name} {owner.last_name}</div>
          <div style={{ fontSize:13,color:'var(--text-3)',marginBottom:1 }}>📞 {owner.mobile}</div>
          {owner.email && <div style={{ fontSize:13,color:'var(--text-3)',marginBottom:1 }}>✉️ {owner.email}</div>}
          {owner.state_district && <div style={{ fontSize:13,color:'var(--text-3)' }}>📍 {owner.state_district}</div>}
          <div style={{ fontSize:12,color:'var(--amber)',fontWeight:700,marginTop:6 }}>Registered {fmtDate(owner.created_at)}</div>
        </div>
        <span className="status-pill status-pending">Pending</span>
      </div>
      <div style={{ display:'flex',gap:10 }}>
        <button className="btn btn-primary btn-sm" style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}
          disabled={loading} onClick={()=>onApprove(owner.id)}><CheckCircle size={14}/> Approve</button>
        <button className="btn btn-danger btn-sm" style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}
          disabled={loading} onClick={()=>onReject(owner.id)}><XCircle size={14}/> Reject</button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Main AdminDashboard
══════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useLang();

  const [tab, setTab]             = useState('overview');
  const [profile, setProfile]     = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(false);

  const [pendingOwners, setPendingOwners]   = useState([]);
  const [approvedOwners, setApprovedOwners] = useState([]);
  const [rejectedOwners, setRejectedOwners] = useState([]);
  const [allOwners, setAllOwners]           = useState([]);
  const [bookings, setBookings]             = useState([]);

  const [bookingFilter, setBookingFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [ownerFilter, setOwnerFilter]     = useState('pending');

  useEffect(() => {
    const u = getCurrentUser();
    if (!u || u.role !== 'admin') { navigate('/'); return; }
    setProfile(u);
    loadAll();
  }, []);

  async function loadAll() { await Promise.all([loadOwners(), loadBookings()]); }
  async function loadOwners() {
    const { data } = await supabase.from('users').select('*').eq('role','owner').order('created_at',{ascending:false});
    if (!data) return;
    setAllOwners(data);
    setPendingOwners(data.filter(o=>o.status==='pending'||!o.status));
    setApprovedOwners(data.filter(o=>o.status==='active'));
    setRejectedOwners(data.filter(o=>o.status==='rejected'));
  }
  async function loadBookings() {
    const { data } = await supabase.from('bookings').select('*').order('created_at',{ascending:false});
    if (data) setBookings(data);
  }
  async function approveOwner(userId) { setActionLoading(true); await supabase.from('users').update({status:'active'}).eq('id',userId); setActionLoading(false); await loadOwners(); }
  async function rejectOwner(userId)  { setActionLoading(true); await supabase.from('users').update({status:'rejected'}).eq('id',userId); setActionLoading(false); await loadOwners(); }
  async function deleteBooking(id) {
    if (!window.confirm('Permanently delete this booking? Cannot be undone.')) return;
    await supabase.from('bookings').delete().eq('id',id);
    setBookings(prev=>prev.filter(b=>b.id!==id));
  }
  function handleLogout() { logoutUser(); navigate('/'); }

  const totalRevenue = bookings.filter(b=>b.status==='accepted').reduce((s,b)=>s+Number(b.total_amount||0),0);
  const filteredBookings = bookings.filter(b=>{
    const matchStatus = bookingFilter==='all'||b.status===bookingFilter;
    const q = bookingSearch.toLowerCase();
    const matchSearch = !q||(b.farmer_name||'').toLowerCase().includes(q)||(b.warehouse_name||'').toLowerCase().includes(q)||(b.crop_type||'').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
  const displayedOwners = ownerFilter==='pending'?pendingOwners:ownerFilter==='active'?approvedOwners:ownerFilter==='rejected'?rejectedOwners:allOwners;

  function handleTabSwitch(t) {
    setTab(t);
    if (t==='bookings') loadBookings();
    if (t==='approvals') loadOwners();
  }

  return (
    <div className="app-shell">
      <Sidebar tab={tab} onSwitch={handleTabSwitch} profile={profile} onLogout={handleLogout}
        open={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>

      <div className="app-main">
        <nav className="top-nav">
          <button className="icon-btn hide-desktop" onClick={()=>setSidebarOpen(v=>!v)} aria-label="Menu">
            {sidebarOpen?<X size={20}/>:<span style={{fontSize:18}}>☰</span>}
          </button>
          <div className="nav-logo hide-desktop"><img src="/logo.png" alt="AgriStore" style={{ width:24,height:24,borderRadius:6,objectFit:'cover' }}/><span>AgriStore</span></div>
          <div style={{ flex:1 }}/>
          {pendingOwners.length > 0 && (
            <div style={{ display:'flex',alignItems:'center',gap:8,background:'var(--amber-light)',border:'1px solid #FDE68A',borderRadius:'var(--r-full)',padding:'6px 14px',fontSize:13,fontWeight:700,color:'#92400E',cursor:'pointer' }}
              onClick={()=>handleTabSwitch('approvals')}>
              <AlertTriangle size={14}/> {pendingOwners.length} pending approval{pendingOwners.length>1?'s':''}
            </div>
          )}
          <div className="nav-avatar" style={{ marginLeft:8,background:'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
            {profile?.first_name?.[0]||'A'}
          </div>
        </nav>

        <div className="page-content">
          <AnimatePresence mode="wait">

          {/* ══════ OVERVIEW ══════ */}
          {tab==='overview' && (
            <motion.div key="overview" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.25}}>
              <div className="page-header">
                <h1 className="page-title">{t.platformOverview}</h1>
                <p className="page-sub">{t.platformOverviewSub}</p>
              </div>
              <div className="stats-grid" style={{ marginBottom:24 }}>
                <StatCard icon={AlertTriangle} label={t.pendingApprovals} value={pendingOwners.length}   accent="var(--amber)"/>
                <StatCard icon={Users}         label={t.activeOwners}     value={approvedOwners.length}  accent="#15803D"/>
                <StatCard icon={BookOpen}      label={t.totalBookings}    value={bookings.length}        accent="var(--blue)"/>
                <StatCard icon={TrendingUp}    label={t.platformRevenue}  value={fmtMoney(totalRevenue)} accent="var(--purple)"/>
              </div>

              {pendingOwners.length>0 && (
                <div style={{ background:'var(--amber-light)',border:'1.5px solid #FDE68A',borderRadius:'var(--r-md)',padding:'16px 20px',marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12 }}>
                  <div>
                    <div style={{ fontWeight:700,fontSize:15,color:'#92400E',marginBottom:3 }}>
                      {pendingOwners.length} {pendingOwners.length > 1 ? t.awaitingVerifications : t.awaitingVerification}
                    </div>
                    <div style={{ fontSize:13,color:'#A16207' }}>{t.ownerVerificationsSub}</div>
                  </div>
                  <button className="btn btn-sm btn-gold" onClick={()=>handleTabSwitch('approvals')}>{t.reviewNow}</button>
                </div>
              )}

              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20 }}>
                <div className="card">
                  <h3 style={{ fontSize:15,fontWeight:700,marginBottom:14 }}>{t.bookingBreakdown}</h3>
                  {[['Pending',bookings.filter(b=>b.status==='pending').length,'var(--amber)'],['Accepted',bookings.filter(b=>b.status==='accepted').length,'#15803D'],['Rejected',bookings.filter(b=>b.status==='rejected').length,'var(--red)']].map(([label,count,color])=>(
                    <div key={label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:14 }}>
                      <span style={{ color:'var(--text-3)' }}>{label}</span>
                      <span style={{ fontWeight:800,color,background:color+'18',padding:'2px 12px',borderRadius:'var(--r-full)',fontSize:13 }}>{count}</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h3 style={{ fontSize:15,fontWeight:700,marginBottom:14 }}>{t.ownerBreakdown}</h3>
                  {[[t.pendingVerification,pendingOwners.length,'var(--amber)'],[t.approvedActive,approvedOwners.length,'#15803D'],[t.rejected,rejectedOwners.length,'var(--red)']].map(([label,count,color])=>(
                    <div key={label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:14 }}>
                      <span style={{ color:'var(--text-3)' }}>{label}</span>
                      <span style={{ fontWeight:800,color,background:color+'18',padding:'2px 12px',borderRadius:'var(--r-full)',fontSize:13 }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════ APPROVALS ══════ */}
          {tab==='approvals' && (
            <motion.div key="approvals" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.25}}>
              <div className="page-header">
                <h1 className="page-title">{t.ownerVerifications}</h1>
                <p className="page-sub">{t.ownerVerificationsSub}</p>
              </div>
              <div className="tab-bar" style={{ marginBottom:20 }}>
                {[['pending',`Pending (${pendingOwners.length})`],['active',`Approved (${approvedOwners.length})`],['rejected',`Rejected (${rejectedOwners.length})`],['all',`All (${allOwners.length})`]].map(([key,label])=>(
                  <div key={key} className={`tab${ownerFilter===key?' active':''}`} style={{ fontSize:12 }} onClick={()=>setOwnerFilter(key)}>{label}</div>
                ))}
              </div>

              {displayedOwners.length===0 ? (
                <div className="empty-state card">
                  <div className="empty-icon"><ShieldCheck size={32} color="var(--green-600)"/></div>
                  <h3>{ ownerFilter==='pending' ? t.allCaughtUp : t.noBookingsHere }</h3>
                  <p>{ ownerFilter==='pending' ? t.noPendingApprovals : '' }</p>
                </div>
              ) : displayedOwners.map(owner=>(
                (owner.status==='pending'||!owner.status) ? (
                  <OwnerCard key={owner.id} owner={owner} onApprove={approveOwner} onReject={rejectOwner} loading={actionLoading}/>
                ) : (
                  <div key={owner.id} className="card" style={{ marginBottom:10,display:'flex',alignItems:'center',gap:14,borderLeft:`4px solid ${owner.status==='active'?'#15803D':'var(--red)'}` }}>
                    <div style={{ width:40,height:40,borderRadius:'var(--r)',background:owner.status==='active'?'#DCFCE7':'var(--red-light)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      <Warehouse size={18} color={owner.status==='active'?'#15803D':'var(--red)'} strokeWidth={2}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700,fontSize:14 }}>{owner.first_name} {owner.last_name}</div>
                      <div style={{ fontSize:12,color:'var(--text-3)' }}>📞 {owner.mobile}{owner.state_district?` · 📍 ${owner.state_district}`:''}</div>
                    </div>
                    <span className={`status-pill ${owner.status==='active'?'status-confirmed':'status-rejected'}`}>
                      {owner.status==='active'? `✓ ${t.accepted}` : `✗ ${t.rejected}`}
                    </span>
                  </div>
                )
              ))}
            </motion.div>
          )}

          {/* ══════ BOOKINGS ══════ */}
          {tab==='bookings' && (
            <motion.div key="bookings" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.25}}>
              <div className="page-header">
                <h1 className="page-title">{t.bookingHistory}</h1>
                <p className="page-sub">{t.bookingHistorySub}</p>
              </div>

              <div style={{ display:'flex',gap:10,marginBottom:16,flexWrap:'wrap' }}>
                <div className="search-bar" style={{ flex:1,minWidth:200 }}>
                  <Search size={15} color="var(--text-4)"/>
                  <input placeholder={t.searchBookings} value={bookingSearch} onChange={e=>setBookingSearch(e.target.value)} aria-label={t.searchBookings}/>
                  {bookingSearch && <button onClick={()=>setBookingSearch('')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-4)',padding:0 }}><X size={14}/></button>}
                </div>
              </div>
              <div className="tab-bar" style={{ marginBottom:20 }}>
                {[[`${t.all} (${bookings.length})`,'all'],['⏳ '+t.pending,'pending'],['✓ '+t.accepted,'accepted'],['✗ '+t.rejected,'rejected']].map(([label,key])=>(
                  <div key={key} className={`tab${bookingFilter===key?' active':''}`} style={{ fontSize:12 }} onClick={()=>setBookingFilter(key)}>{label}</div>
                ))}
              </div>

              {filteredBookings.length===0 ? (
                <div className="empty-state card"><div className="empty-icon"><BookOpen size={32} color="var(--green-600)"/></div><h3>{t.noBookingsFound}</h3></div>
              ) : filteredBookings.map((b,i)=>(
                <motion.div key={b.id} className="booking-card" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                  style={{ borderLeft:`4px solid ${b.status==='pending'?'var(--amber)':b.status==='accepted'?'#15803D':'var(--red)'}` }}>
                  <div className="booking-header">
                    <div style={{ flex:1 }}>
                      <div className="booking-name">{b.crop_type} · {b.quantity}T · {b.days} days</div>
                      <div className="booking-meta">📦 {b.warehouse_name}</div>
                      {b.farmer_name && <div className="booking-meta">👨‍🌾 {b.farmer_name}</div>}
                      {b.start_date  && <div className="booking-meta">📅 {fmtDate(b.start_date)} → {fmtDate(b.due_date)}</div>}
                      {b.total_amount>0 && (
                        <div className="booking-meta" style={{ fontWeight:700,color:'var(--green-800)',marginTop:4 }}>
                          {fmtMoney(b.total_amount)} · <span style={{ color:b.payment_status==='paid'?'#15803D':'var(--amber)' }}>{b.payment_status==='paid'?'✓ Paid':'⏳ Unpaid'}</span>
                        </div>
                      )}
                      <div className="booking-meta" style={{ fontSize:11,color:'var(--text-4)',marginTop:3 }}>🕐 {fmtDate(b.created_at)}</div>
                    </div>
                    <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8 }}>
                      <span className={`status-pill ${b.status==='accepted'?'status-confirmed':b.status==='rejected'?'status-rejected':'status-pending'}`}>
                        {b.status==='accepted'?'✓ Confirmed':b.status==='rejected'?'✗ Rejected':'⏳ Pending'}
                      </span>
                      <button onClick={()=>deleteBooking(b.id)} className="btn btn-danger btn-sm" style={{ display:'flex',alignItems:'center',gap:4 }}>
                        <Trash2 size={12}/> {t.deleteRecord}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ══════ PROFILE ══════ */}
          {tab==='profile' && (
            <motion.div key="profile" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.25}}>
              <div className="page-header"><h1 className="page-title">{t.adminProfile}</h1></div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20 }}>
                <div className="card" style={{ textAlign:'center',padding:'32px 24px' }}>
                  <div style={{ width:96,height:96,margin:'0 auto 16px',borderRadius:'50%',background:'linear-gradient(135deg,#4F46E5,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,color:'white',fontFamily:'var(--font-head)',fontWeight:700 }}>
                    {profile?.first_name?.[0]||'A'}
                  </div>
                  <h2 style={{ fontFamily:'var(--font-head)',fontSize:20,fontWeight:700,marginBottom:6 }}>{profile?`${profile.first_name||''} ${profile.last_name||''}`.trim()||'Admin':'Admin'}</h2>
                  {profile?.mobile && <p style={{ fontSize:13,color:'var(--text-3)',marginBottom:3 }}>📞 +91 {profile.mobile}</p>}
                  {profile?.email  && <p style={{ fontSize:13,color:'var(--text-3)',marginBottom:12 }}>✉️ {profile.email}</p>}
                  <span className="badge badge-purple">🛡️ Platform Administrator</span>
                </div>
                <div className="card">
                  <h3 style={{ fontSize:15,fontWeight:700,marginBottom:16 }}>{t.platformStats}</h3>
                  {[[t.totalOwners,allOwners.length],[t.pendingApprovals,pendingOwners.length],[t.activeOwners,approvedOwners.length],[t.totalBookings,bookings.length],[t.acceptedBookings,bookings.filter(b=>b.status==='accepted').length],[t.platformRevenue,fmtMoney(totalRevenue)]].map(([label,val])=>(
                    <div key={label} style={{ display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:14 }}>
                      <span style={{ color:'var(--text-3)' }}>{label}</span><span style={{ fontWeight:700 }}>{val}</span>
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" style={{ marginTop:16,width:'100%',color:'var(--red)',display:'flex',alignItems:'center',gap:6,justifyContent:'center' }} onClick={handleLogout}><LogOut size={14}/> Logout</button>
                </div>
              </div>
            </motion.div>
          )}

          </AnimatePresence>
        </div>
        <AdminBottomNav activeTab={tab} onSwitch={handleTabSwitch}/>
      </div>
    </div>
  );
}
