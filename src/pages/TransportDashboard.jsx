import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, Truck, LayoutDashboard, User, LogOut, X,
  MapPin, Package, Star, CreditCard, Clock, ChevronRight,
  Route, BadgeCheck, Zap, Bell, TrendingUp, Navigation,
} from 'lucide-react';
import { getCurrentUser, logoutUser } from '../auth';
import { TransportBottomNav } from '../components/BottomNav';
import { useLang } from '../LangContext';
import { langNames } from '../i18n';

/* ── Sidebar ── */
function Sidebar({ tab, onSwitch, profile, onLogout, open, onClose }) {
  const { t, lang, setLang } = useLang();
  const nav = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { key: 'trips',     icon: Truck,            label: 'Trips'     },
    { key: 'profile',   icon: User,             label: 'Profile'   },
  ];
  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 199, backdropFilter: 'blur(2px)',
        }} />
      )}
      <aside className={`app-sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="AgriStore" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
          <span className="sidebar-logo-text">AgriStore</span>
          <button onClick={onClose} className="icon-btn hide-desktop"
            style={{ marginLeft: 'auto', width: 30, height: 30 }}><X size={16} /></button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {nav.map(item => (
            <button key={item.key}
              className={`sidebar-item${tab === item.key ? ' active' : ''}`}
              onClick={() => { onSwitch(item.key); onClose(); }}>
              <span className="s-icon"><item.icon size={18} strokeWidth={2} /></span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '0 12px 12px' }}>
          <div className="sidebar-section-label">Language</div>
          <select className="form-input" style={{ fontSize: 13 }}
            value={lang} onChange={e => setLang(e.target.value)}>
            {Object.keys(langNames).map(l => (
              <option key={l} value={l}>🌐 {langNames[l]}</option>
            ))}
          </select>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="nav-avatar"
              style={{ width: 36, height: 36, fontSize: 14, flexShrink: 0,
                background: 'linear-gradient(135deg,#E65100,#F57C00)' }}>
              {profile?.first_name?.[0] || 'T'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {profile?.first_name} {profile?.last_name}
              </div>
              <div className="sidebar-user-role">Transport Partner</div>
            </div>
          </div>
          <button className="sidebar-item" onClick={onLogout}
            style={{ color: 'var(--red)', marginTop: 4 }}>
            <span className="s-icon" style={{ background: 'var(--red-light)' }}>
              <LogOut size={16} />
            </span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Coming Soon feature card ── */
function FeatureCard({ icon: Icon, title, desc, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="card"
      style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        width: 52, height: 52, borderRadius: 'var(--r-md)', flexShrink: 0,
        background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={24} color={accent} strokeWidth={2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{desc}</div>
        <span style={{
          display: 'inline-block', marginTop: 10,
          background: 'var(--amber-light)', color: '#92400E',
          border: '1px solid #FDE68A', borderRadius: 'var(--r-full)',
          padding: '3px 12px', fontSize: 11, fontWeight: 700,
        }}>
          Coming Soon
        </span>
      </div>
    </motion.div>
  );
}

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="stat-card" style={{ '--stat-accent': accent }}>
      <div className="stat-icon" style={{ background: accent + '18' }}>
        <Icon size={22} color={accent} strokeWidth={2} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main TransportDashboard
══════════════════════════════════════════ */
export default function TransportDashboard() {
  const navigate = useNavigate();
  const [tab, setTab]           = useState('dashboard');
  const [profile, setProfile]   = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const u = getCurrentUser();
    if (!u || u.role !== 'transport') { navigate('/'); return; }
    setProfile(u);
  }, []);

  function handleLogout() { logoutUser(); navigate('/'); }

  return (
    <div className="app-shell">
      <Sidebar tab={tab} onSwitch={setTab} profile={profile} onLogout={handleLogout}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        {/* Navbar */}
        <nav className="top-nav">
          <button className="icon-btn hide-desktop"
            onClick={() => setSidebarOpen(v => !v)} aria-label="Menu">
            {sidebarOpen ? <X size={20} /> : <span style={{ fontSize: 18 }}>☰</span>}
          </button>
          <div className="nav-logo hide-desktop">
            <img src="/logo.png" alt="AgriStore" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} />
            <span>AgriStore</span>
          </div>
          <div style={{ flex: 1 }} />
          <div className="nav-right">
            <span style={{
              background: 'var(--amber-light)', color: '#92400E',
              border: '1px solid #FDE68A', borderRadius: 'var(--r-full)',
              padding: '4px 14px', fontSize: 12, fontWeight: 700,
            }}>
              🚧 Beta Access
            </span>
            <div className="nav-avatar"
              style={{ background: 'linear-gradient(135deg,#E65100,#F57C00)', flexShrink: 0 }}>
              {profile?.first_name?.[0] || 'T'}
            </div>
          </div>
        </nav>

        <div className="page-content">
          <AnimatePresence mode="wait">

          {/* ══════ DASHBOARD ══════ */}
          {tab === 'dashboard' && (
            <motion.div key="dashboard"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

              {/* Welcome banner */}
              <div className="card" style={{
                marginBottom: 24,
                background: 'linear-gradient(135deg,#E65100,#F57C00)',
                border: 'none', color: 'white',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: 'var(--r-md)',
                    background: 'rgba(255,255,255,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Truck size={30} color="white" strokeWidth={2} />
                  </div>
                  <div>
                    <h1 style={{
                      fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700,
                      color: 'white', marginBottom: 4,
                    }}>
                      Welcome, {profile?.first_name || t.transportPartner}
                    </h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                      {t.transportWelcome}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats row — placeholder */}
              <div className="stats-grid" style={{ marginBottom:28 }}>
                <StatCard icon={Truck}       label={t.tripsCompleted} value="—"  accent="#E65100" />
                <StatCard icon={Navigation}  label={t.kmCovered}      value="—"  accent="var(--blue)" />
                <StatCard icon={CreditCard}  label={t.totalEarned}    value="₹—" accent="var(--green-600)" />
                <StatCard icon={Star}        label={t.avgRating}      value="—"  accent="var(--amber)" />
              </div>

              {/* Feature grid */}
              <div className="page-header">
                <h2 className="page-title">{t.upcomingFeatures}</h2>
                <p className="page-sub">{t.upcomingFeaturesSub}</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
                {[
                  { icon:Package,    title:t.deliveryAssignments,  desc:t.deliveryAssignmentsDesc,  accent:'var(--green-600)' },
                  { icon:Route,      title:t.routePlanner,         desc:t.routePlannerDesc,         accent:'var(--blue)'      },
                  { icon:CreditCard, title:t.earningsPayments,     desc:t.earningsPaymentsDesc,     accent:'var(--purple)'    },
                  { icon:Star,       title:t.ratingsReviews,       desc:t.ratingsReviewsDesc,       accent:'var(--amber)'     },
                  { icon:Bell,       title:t.liveNotifications,    desc:t.liveNotificationsDesc,    accent:'#E65100'          },
                  { icon:TrendingUp, title:t.performanceAnalytics, desc:t.performanceAnalyticsDesc, accent:'#0891B2'          },
                ].map((f,i)=>(<FeatureCard key={f.title} {...f} delay={i*0.07}/>))}
              </div>
            </motion.div>
          )}

          {/* ══════ TRIPS ══════ */}
          {tab === 'trips' && (
            <motion.div key="trips"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

              <div className="page-header">
                <h1 className="page-title">{t.myTrips}</h1>
                <p className="page-sub">{t.myTripsSub}</p>
              </div>
              <div className="empty-state card">
                <div className="empty-icon"><Truck size={32} color="#E65100" /></div>
                <h3>{t.noTripsYet}</h3>
                <p>{t.noTripsSub}</p>
                <span style={{ background:'var(--amber-light)',color:'#92400E',border:'1px solid #FDE68A',borderRadius:'var(--r-full)',padding:'5px 16px',fontSize:12,fontWeight:700 }}>
                  {t.launchingSoon}
                </span>
              </div>
            </motion.div>
          )}

          {/* ══════ PROFILE ══════ */}
          {tab === 'profile' && (
            <motion.div key="profile"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

              <div className="page-header">
                <h1 className="page-title">{t.profile}</h1>
                <p className="page-sub">{t.accountDetails}</p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))',
                gap: 20,
              }}>
                {/* Profile card */}
                <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: '50%', margin: '0 auto 16px',
                    background: 'linear-gradient(135deg,#E65100,#F57C00)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, color: 'white', fontFamily: 'var(--font-head)',
                    fontWeight: 700, border: '3px solid #FFE0B2',
                  }}>
                    {profile?.first_name?.[0] || 'T'}
                  </div>
                  <h2 style={{
                    fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 6,
                  }}>
                    {profile
                      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Transport Co.'
                      : 'Loading…'}
                  </h2>
                  {profile?.mobile && (
                    <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 3 }}>
                      📞 +91 {profile.mobile}
                    </p>
                  )}
                  {profile?.email && (
                    <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 3 }}>
                      ✉️ {profile.email}
                    </p>
                  )}
                  {profile?.state_district && (
                    <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>
                      📍 {profile.state_district}
                    </p>
                  )}
                  <span style={{
                    display: 'inline-block',
                    background: '#FFF3E0', color: '#E65100',
                    border: '1px solid #FFCC80', borderRadius: 'var(--r-full)',
                    padding: '3px 14px', fontSize: 12, fontWeight: 700,
                  }}>
                    🚛 Transport Partner
                  </span>
                </div>

                {/* Account info card */}
                <div className="card">
                  <h3 style={{ fontSize:15,fontWeight:700,marginBottom:16 }}>{t.accountDetails}</h3>
                  {[[t.profile,'Transport Partner'],[t.available,'Active'],['Trips',t.comingSoon],['Earnings',t.comingSoon],['Rating',t.comingSoon]].map(([label,val])=>(
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14,
                    }}>
                      <span style={{ color: 'var(--text-3)' }}>{label}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{val}</span>
                    </div>
                  ))}
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{
                      marginTop: 16, width: '100%', color: 'var(--red)',
                      display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
                    }}
                    onClick={handleLogout}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          </AnimatePresence>
        </div>

        <TransportBottomNav activeTab={tab} onSwitch={setTab} />
      </div>
    </div>
  );
}
