import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';
import {
  Warehouse, Truck, Leaf, MapPin, ShieldCheck, CreditCard,
  Bell, BarChart3, Search, Star, Menu, X, ChevronRight,
  ArrowRight, CheckCircle2, Zap, Globe, Users, Phone, Mail,
  Share2, MessageCircle, Link,
} from 'lucide-react';
import { useLang } from '../LangContext';
import { langNames } from '../i18n';

/* ─────────────────────────────────────────
   Design tokens  (scoped to landing only)
───────────────────────────────────────── */
const C = {
  dark:    '#1B5E20',
  primary: '#2E7D32',
  mid:     '#43A047',
  light:   '#81C784',
  bg:      '#E8F5E9',
  white:   '#FFFFFF',
  gold:    '#F9A825',
  muted:   '#4E6550',
  text:    '#1A2E1B',
  border:  '#C8E6C9',
};

/* ─────────────────────────────────────────
   Animation variants
───────────────────────────────────────── */
const fadeUp   = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } };
const fadeIn   = { hidden: { opacity: 0 },         show: { opacity: 1, transition: { duration: 0.5 } } };
const stagger  = { show: { transition: { staggerChildren: 0.12 } } };

/* ─────────────────────────────────────────
   Animated counter hook
───────────────────────────────────────── */
function useCounter(target, duration = 1800, inView = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, inView]);
  return count;
}

/* ─────────────────────────────────────────
   Stat card with animated counter
───────────────────────────────────────── */
function StatCard({ value, suffix, label, icon: Icon, delay }) {
  const ref  = useRef(null);
  const inV  = useInView(ref, { once: true });
  const num  = useCounter(value, 1800, inV);
  return (
    <motion.div ref={ref}
      variants={fadeUp} initial="hidden" animate={inV ? 'show' : 'hidden'}
      transition={{ delay }}
      style={{
        background: C.white, borderRadius: 20, padding: '28px 20px',
        textAlign: 'center', boxShadow: '0 4px 24px rgba(46,125,50,0.10)',
        border: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: `linear-gradient(135deg,${C.bg},${C.light}33)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${C.border}`,
      }}>
        <Icon size={24} color={C.primary} strokeWidth={2} />
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, color: C.dark, lineHeight: 1, fontFamily: 'Poppins,sans-serif' }}>
        {num}{suffix}
      </div>
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, lineHeight: 1.4 }}>{label}</div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Farming SVG Illustration (right hero)
───────────────────────────────────────── */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 400" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 480, height: 'auto' }} aria-label="Farmer and warehouse illustration">

      {/* Sky gradient background */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8F5E9" />
          <stop offset="100%" stopColor="#C8E6C9" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#2E7D32" />
        </linearGradient>
        <linearGradient id="wh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#81C784" />
          <stop offset="100%" stopColor="#43A047" />
        </linearGradient>
        <linearGradient id="truck" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F9A825" />
          <stop offset="100%" stopColor="#F57F17" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="480" height="400" fill="url(#sky)" rx="24" />

      {/* Ground strip */}
      <ellipse cx="240" cy="370" rx="230" ry="30" fill="url(#ground)" opacity="0.3" />
      <rect x="0" y="340" width="480" height="60" fill="url(#ground)" rx="0" opacity="0.18" />

      {/* Sun */}
      <circle cx="400" cy="70" r="38" fill="#FFF9C4" opacity="0.7" />
      <circle cx="400" cy="70" r="28" fill="#FFF176" opacity="0.9" />

      {/* Clouds */}
      <ellipse cx="80"  cy="60" rx="45" ry="18" fill="white" opacity="0.85" />
      <ellipse cx="110" cy="50" rx="35" ry="22" fill="white" opacity="0.85" />
      <ellipse cx="55"  cy="55" rx="30" ry="16" fill="white" opacity="0.85" />

      <ellipse cx="310" cy="90" rx="35" ry="14" fill="white" opacity="0.7" />
      <ellipse cx="335" cy="82" rx="28" ry="18" fill="white" opacity="0.7" />

      {/* Warehouse — centre */}
      <rect x="170" y="200" width="160" height="120" fill="url(#wh)" rx="6" />
      <polygon points="150,200 240,145 330,200" fill="#2E7D32" />
      {/* Roof ridge */}
      <line x1="150" y1="200" x2="330" y2="200" stroke="#1B5E20" strokeWidth="2" />
      {/* Door */}
      <rect x="213" y="268" width="54" height="52" fill="#1B5E20" rx="4" />
      <rect x="237" y="268" width="3" height="52" fill="#145214" />
      {/* Windows */}
      <rect x="188" y="224" width="36" height="28" fill="#B3E5FC" rx="4" opacity="0.9" />
      <rect x="256" y="224" width="36" height="28" fill="#B3E5FC" rx="4" opacity="0.9" />
      {/* Window glare */}
      <line x1="192" y1="228" x2="196" y2="248" stroke="white" strokeWidth="2" opacity="0.6" />
      <line x1="260" y1="228" x2="264" y2="248" stroke="white" strokeWidth="2" opacity="0.6" />
      {/* Sign */}
      <rect x="196" y="206" width="88" height="14" fill="white" rx="3" opacity="0.85" />
      <rect x="200" y="209" width="40" height="8" fill={C.mid} rx="2" />

      {/* Farmer — left */}
      {/* Body */}
      <ellipse cx="108" cy="290" rx="22" ry="30" fill="#FF8F00" />
      {/* Head */}
      <circle cx="108" cy="248" r="20" fill="#FFCC80" />
      {/* Hat */}
      <ellipse cx="108" cy="232" rx="26" ry="7" fill="#F9A825" />
      <rect x="96" y="215" width="24" height="18" fill="#F9A825" rx="3" />
      {/* Eyes */}
      <circle cx="102" cy="247" r="3" fill="#4E342E" />
      <circle cx="114" cy="247" r="3" fill="#4E342E" />
      {/* Smile */}
      <path d="M103 256 Q108 261 113 256" stroke="#4E342E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Legs */}
      <rect x="96"  y="316" width="14" height="30" fill="#1565C0" rx="4" />
      <rect x="110" y="316" width="14" height="30" fill="#1565C0" rx="4" />
      {/* Arms */}
      <line x1="86"  y1="275" x2="108" y2="265" stroke="#FF8F00" strokeWidth="10" strokeLinecap="round" />
      <line x1="130" y1="275" x2="108" y2="265" stroke="#FF8F00" strokeWidth="10" strokeLinecap="round" />
      {/* Basket */}
      <rect x="52" y="278" width="34" height="26" fill="#F9A825" rx="5" />
      <ellipse cx="69" cy="278" rx="17" ry="6" fill="#FFB300" />
      {/* Crops in basket */}
      <circle cx="61" cy="272" r="6" fill="#66BB6A" />
      <circle cx="69" cy="270" r="7" fill="#4CAF50" />
      <circle cx="77" cy="273" r="5" fill="#81C784" />

      {/* Truck — right side */}
      <rect x="330" y="290" width="100" height="52" fill="url(#truck)" rx="6" />
      <rect x="376" y="272" width="54" height="38" fill="#F57F17" rx="5" />
      {/* Cabin window */}
      <rect x="382" y="278" width="38" height="22" fill="#B3E5FC" rx="4" opacity="0.9" />
      {/* Wheels */}
      <circle cx="350" cy="344" r="16" fill="#37474F" />
      <circle cx="350" cy="344" r="8"  fill="#607D8B" />
      <circle cx="410" cy="344" r="16" fill="#37474F" />
      <circle cx="410" cy="344" r="8"  fill="#607D8B" />
      {/* Truck logo */}
      <rect x="338" y="304" width="30" height="10" fill="white" rx="3" opacity="0.7" />

      {/* Crop rows — background */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <line x1={30 + i*18} y1="330" x2={30 + i*18} y2="360" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" />
          <circle cx={30 + i*18} cy="325" r="7" fill="#66BB6A" />
        </g>
      ))}

      {/* Decorative data lines */}
      <path d="M108 230 Q150 180 170 200" stroke={C.gold} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      <path d="M330 200 Q370 170 400 200" stroke={C.gold} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />

      {/* Floating badge — GPS */}
      <g transform="translate(24, 130)">
        <rect width="90" height="32" rx="16" fill="white" filter="url(#shadow)" opacity="0.95" />
        <circle cx="20" cy="16" r="10" fill="#E8F5E9" />
        <circle cx="20" cy="16" r="5"  fill="#43A047" />
        <text x="36" y="21" fontFamily="Poppins,sans-serif" fontSize="11" fontWeight="700" fill="#1B5E20">GPS Found!</text>
      </g>

      {/* Floating badge — Booked */}
      <g transform="translate(346, 150)">
        <rect width="100" height="32" rx="16" fill="white" opacity="0.95" />
        <circle cx="20" cy="16" r="10" fill="#E8F5E9" />
        <text x="14" y="21" fontFamily="Poppins,sans-serif" fontSize="13" fill="#43A047">✓</text>
        <text x="32" y="21" fontFamily="Poppins,sans-serif" fontSize="11" fontWeight="700" fill="#1B5E20">Booked!</text>
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────
   Navbar
───────────────────────────────────────── */
function Navbar({ lang, setLang }) {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  function scrollTo(id) {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  const links = [
    { label: 'Home',     id: 'hero'     },
    { label: 'Features', id: 'features' },
    { label: 'How It Works', id: 'how' },
    { label: 'Contact',  id: 'footer'   },
  ];

  return (
    <motion.nav initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: scrolled ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
        boxShadow: scrolled ? '0 2px 20px rgba(46,125,50,0.10)' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 clamp(16px, 5vw, 80px)',
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={() => scrollTo('hero')}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          overflow: 'hidden',
        }}>
          <img src="/logo.png" alt="AgriStore" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 700, fontSize: 20, color: C.dark }}>
          AgriStore
        </span>
      </div>

      {/* Desktop Links */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}
        className="nav-desktop-links">
        {links.map(l => (
          <button key={l.id} onClick={() => scrollTo(l.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Poppins,sans-serif', fontWeight: 600, fontSize: 14,
              color: C.muted, transition: 'color 0.2s', padding: '4px 0',
            }}
            onMouseEnter={e => e.target.style.color = C.primary}
            onMouseLeave={e => e.target.style.color = C.muted}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <select value={lang} onChange={e => setLang(e.target.value)}
          style={{
            background: C.bg, border: `1.5px solid ${C.border}`,
            borderRadius: 9, padding: '6px 10px', fontSize: 12,
            fontWeight: 700, color: C.dark, cursor: 'pointer',
            fontFamily: 'Poppins,sans-serif', outline: 'none',
          }}>
          {Object.keys(langNames).map(l => (
            <option key={l} value={l}>🌐 {langNames[l]}</option>
          ))}
        </select>

        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => scrollTo('roles')}
          style={{
            background: `linear-gradient(135deg,${C.primary},${C.mid})`,
            color: 'white', border: 'none', borderRadius: 10,
            padding: '9px 20px', fontFamily: 'Poppins,sans-serif',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(46,125,50,0.3)',
          }}>
          Login
        </motion.button>

        {/* Mobile burger */}
        <button className="nav-burger"
          onClick={() => setMenuOpen(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'none', padding: 4,
          }}
          aria-label="Toggle menu">
          {menuOpen ? <X size={24} color={C.dark} /> : <Menu size={24} color={C.dark} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute', top: 68, left: 0, right: 0,
              background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
              borderBottom: `1px solid ${C.border}`,
              padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
            }}>
            {links.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'Poppins,sans-serif', fontWeight: 600, fontSize: 16,
                  color: C.muted, textAlign: 'left', padding: '10px 0',
                  borderBottom: `1px solid ${C.border}`,
                }}>
                {l.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ─────────────────────────────────────────
   Hero Section
───────────────────────────────────────── */
function HeroSection({ navigate, t }) {
  return (
    <section id="hero" style={{
      padding: 'clamp(48px,8vw,100px) clamp(16px,6vw,80px)',
      background: `linear-gradient(135deg, ${C.bg} 0%, #F1F8E9 50%, #DCEDC8 100%)`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: -80, right: -80, width: 360, height: 360,
        borderRadius: '50%', background: `radial-gradient(circle, ${C.light}44, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -60, left: -60, width: 280, height: 280,
        borderRadius: '50%', background: `radial-gradient(circle, ${C.gold}22, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))',
        gap: 'clamp(32px,5vw,80px)', alignItems: 'center',
      }}>
        {/* Left — text */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          {/* Badge */}
          <motion.div variants={fadeUp}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(46,125,50,0.10)', border: `1px solid ${C.light}`,
              borderRadius: 100, padding: '6px 16px', marginBottom: 24,
            }}>
            <Zap size={14} color={C.gold} fill={C.gold} />
            <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 12, fontWeight: 700, color: C.primary }}>
              India's #1 Agricultural Storage Platform
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp}
            style={{
              fontFamily: 'Poppins,sans-serif', fontWeight: 800,
              fontSize: 'clamp(28px,4.5vw,54px)', lineHeight: 1.15,
              color: C.dark, marginBottom: 20,
            }}>
            Store Your Harvest{' '}
            <span style={{
              background: `linear-gradient(135deg,${C.primary},${C.gold})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Safely
            </span>{' '}
            with Verified Warehouses
          </motion.h1>

          <motion.p variants={fadeUp}
            style={{
              fontSize: 'clamp(14px,1.6vw,18px)', color: C.muted, lineHeight: 1.75,
              marginBottom: 36, maxWidth: 500,
              fontFamily: 'Poppins,sans-serif',
            }}>
            AgriStore helps farmers find nearby warehouses, compare storage options,
            book instantly, and protect their crops from spoilage.
          </motion.p>

          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.05, boxShadow: '0 8px 28px rgba(46,125,50,0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `linear-gradient(135deg,${C.primary},${C.mid})`,
                color: 'white', border: 'none', borderRadius: 12,
                padding: '14px 28px', fontFamily: 'Poppins,sans-serif',
                fontWeight: 700, fontSize: 16, cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(46,125,50,0.28)',
              }}>
              Get Started <ArrowRight size={18} />
            </motion.button>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent',
                color: C.primary, border: `2px solid ${C.primary}`,
                borderRadius: 12, padding: '14px 28px',
                fontFamily: 'Poppins,sans-serif', fontWeight: 700,
                fontSize: 16, cursor: 'pointer',
              }}>
              Learn More <ChevronRight size={18} />
            </motion.button>
          </motion.div>

          {/* Trust badges */}
          <motion.div variants={fadeUp}
            style={{ display: 'flex', gap: 20, marginTop: 36, flexWrap: 'wrap' }}>
            {[
              { icon: ShieldCheck, text: 'Verified Owners' },
              { icon: MapPin,      text: 'GPS Enabled'     },
              { icon: Zap,         text: 'Instant Booking' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={16} color={C.mid} strokeWidth={2.5} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.muted, fontFamily: 'Poppins,sans-serif' }}>
                  {text}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — illustration */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          style={{ position: 'relative' }}>
          {/* Floating card — Storage saved */}
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: 10, left: -10, zIndex: 10,
              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
              borderRadius: 14, padding: '10px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: `1px solid ${C.border}`,
            }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, fontFamily: 'Poppins,sans-serif' }}>Storage Saved</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.dark, fontFamily: 'Poppins,sans-serif' }}>2,400 T</div>
            <div style={{ fontSize: 10, color: C.mid, fontWeight: 700 }}>↑ 18% this month</div>
          </motion.div>

          {/* Floating card — Active bookings */}
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            style={{
              position: 'absolute', bottom: 30, right: -10, zIndex: 10,
              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
              borderRadius: 14, padding: '10px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: `linear-gradient(135deg,${C.primary},${C.mid})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, fontFamily: 'Poppins,sans-serif' }}>Active Bookings</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, fontFamily: 'Poppins,sans-serif' }}>348</div>
            </div>
          </motion.div>

          <HeroIllustration />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   Role Cards Section
───────────────────────────────────────── */
const ROLES = [
  {
    role: 'farmer',
    icon: Users,
    color: C.primary,
    gradient: `linear-gradient(135deg,${C.primary},${C.mid})`,
    title: 'Farmer',
    desc: 'Find and book verified warehouses near you to store your harvest safely.',
    features: ['GPS warehouse search', 'Compare prices', 'Instant booking', 'Track storage'],
  },
  {
    role: 'owner',
    icon: Warehouse,
    color: '#1565C0',
    gradient: 'linear-gradient(135deg,#1565C0,#1E88E5)',
    title: 'Warehouse Owner',
    desc: 'List your warehouse, manage bookings, and grow your storage business.',
    features: ['List warehouses', 'Manage bookings', 'Revenue tracking', 'Farmer reviews'],
  },
  {
    role: 'transport',
    icon: Truck,
    color: '#E65100',
    gradient: 'linear-gradient(135deg,#E65100,#F57C00)',
    title: 'Transport Co.',
    desc: 'Accept delivery assignments and connect farmers to warehouses efficiently.',
    features: ['Delivery assignments', 'Route planning', 'Earnings tracker', 'Trip history'],
  },
  {
    role: 'admin',
    icon: ShieldCheck,
    color: '#6A1B9A',
    gradient: 'linear-gradient(135deg,#6A1B9A,#8E24AA)',
    title: 'Admin',
    desc: 'Manage the platform, verify owners, and oversee all operations.',
    features: ['Verify owners', 'Booking history', 'Platform stats', 'Access control'],
  },
];

function RoleCardsSection({ navigate }) {
  return (
    <section id="roles" style={{
      padding: 'clamp(48px,7vw,96px) clamp(16px,6vw,80px)',
      background: C.white,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Heading */}
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          style={{ textAlign: 'center', marginBottom: 'clamp(32px,5vw,56px)' }}>
          <motion.div variants={fadeUp}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 100, padding: '6px 16px', marginBottom: 16,
            }}>
            <Globe size={14} color={C.primary} />
            <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 12, fontWeight: 700, color: C.primary }}>
              Choose Your Role
            </span>
          </motion.div>
          <motion.h2 variants={fadeUp}
            style={{
              fontFamily: 'Poppins,sans-serif', fontWeight: 800,
              fontSize: 'clamp(24px,3.5vw,40px)', color: C.dark, marginBottom: 14,
            }}>
            One Platform, Every Role
          </motion.h2>
          <motion.p variants={fadeUp}
            style={{ fontSize: 16, color: C.muted, maxWidth: 520, margin: '0 auto', fontFamily: 'Poppins,sans-serif' }}>
            Whether you grow crops, own storage, move goods, or manage the network — AgriStore has you covered.
          </motion.p>
        </motion.div>

        {/* Cards grid */}
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={stagger}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
          }}>
          {ROLES.map(({ role, icon: Icon, color, gradient, title, desc, features }) => (
            <motion.div key={role} variants={fadeUp}
              whileHover={{ y: -8, boxShadow: `0 20px 50px ${color}28` }}
              onClick={() => navigate(`/auth/${role}`)}
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: 20,
                border: `1.5px solid ${C.border}`,
                padding: '28px 24px',
                cursor: 'pointer',
                transition: 'border-color 0.25s',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                display: 'flex', flexDirection: 'column', gap: 16,
                position: 'relative', overflow: 'hidden',
              }}
              onHoverStart={e => { e.target.style && (e.target.style.borderColor = color); }}
              onHoverEnd={e => { e.target.style && (e.target.style.borderColor = C.border); }}>

              {/* Subtle gradient top strip */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                background: gradient, borderRadius: '20px 20px 0 0',
              }} />

              {/* Icon */}
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 18px ${color}33`,
              }}>
                <Icon size={26} color="white" strokeWidth={2} />
              </div>

              {/* Text */}
              <div>
                <div style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 800, fontSize: 18, color: C.dark, marginBottom: 8 }}>
                  {title}
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, fontFamily: 'Poppins,sans-serif' }}>
                  {desc}
                </div>
              </div>

              {/* Feature list */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={14} color={color} strokeWidth={2.5} />
                    <span style={{ fontSize: 12, color: C.muted, fontFamily: 'Poppins,sans-serif', fontWeight: 600 }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{
                  fontFamily: 'Poppins,sans-serif', fontWeight: 700, fontSize: 13,
                  color, transition: 'gap 0.2s',
                }}>
                  Continue as {title}
                </span>
                <ChevronRight size={15} color={color} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   Stats Section
───────────────────────────────────────── */
function StatsSection() {
  return (
    <section style={{
      padding: 'clamp(48px,7vw,80px) clamp(16px,6vw,80px)',
      background: `linear-gradient(135deg,${C.dark} 0%,${C.primary} 100%)`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position:'absolute',top:-60,right:-60,width:240,height:240,borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none' }} />
      <div style={{ position:'absolute',bottom:-40,left:-40,width:180,height:180,borderRadius:'50%',background:'rgba(249,168,37,0.08)',pointerEvents:'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={stagger}
          style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.h2 variants={fadeUp}
            style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'clamp(22px,3vw,36px)', color:'white', marginBottom:12 }}>
            Trusted by Thousands Across India
          </motion.h2>
          <motion.p variants={fadeUp}
            style={{ fontSize:16, color:'rgba(255,255,255,0.75)', fontFamily:'Poppins,sans-serif' }}>
            Numbers that reflect our growing community
          </motion.p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))',
          gap: 20,
        }}>
          <StatCard value={500}  suffix="+"  label="Happy Farmers"        icon={Users}     delay={0}    />
          <StatCard value={120}  suffix="+"  label="Verified Warehouses"  icon={Warehouse} delay={0.1}  />
          <StatCard value={25}   suffix="+"  label="Cities Covered"       icon={MapPin}    delay={0.2}  />
          <StatCard value={99}   suffix="%"  label="Booking Success Rate" icon={BarChart3} delay={0.3}  />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   How It Works Section
───────────────────────────────────────── */
const HOW_STEPS = [
  { icon: Search,       title: 'Search Warehouse',  desc: 'Use GPS or location search to find verified warehouses near you.' },
  { icon: BarChart3,    title: 'Compare Storage',   desc: 'Review capacity, price, facilities, and farmer ratings side by side.' },
  { icon: CreditCard,   title: 'Book Online',       desc: 'Select your dates, fill crop details, and pay securely in minutes.' },
  { icon: Warehouse,    title: 'Store Harvest',     desc: 'Drop off your crops at the confirmed warehouse with full documentation.' },
  { icon: Bell,         title: 'Track Booking',     desc: 'Get live updates on storage status, due dates, and payment reminders.' },
];

function HowItWorksSection() {
  return (
    <section id="how" style={{
      padding: 'clamp(48px,7vw,96px) clamp(16px,6vw,80px)',
      background: C.bg,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          style={{ textAlign:'center', marginBottom:'clamp(32px,5vw,56px)' }}>
          <motion.div variants={fadeUp}
            style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'rgba(46,125,50,0.08)', border:`1px solid ${C.border}`,
              borderRadius:100, padding:'6px 16px', marginBottom:16,
            }}>
            <Zap size={14} color={C.gold} fill={C.gold} />
            <span style={{ fontFamily:'Poppins,sans-serif', fontSize:12, fontWeight:700, color:C.primary }}>How It Works</span>
          </motion.div>
          <motion.h2 variants={fadeUp}
            style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'clamp(22px,3vw,38px)', color:C.dark, marginBottom:12 }}>
            From Search to Storage in 5 Steps
          </motion.h2>
          <motion.p variants={fadeUp}
            style={{ fontSize:16, color:C.muted, fontFamily:'Poppins,sans-serif', maxWidth:480, margin:'0 auto' }}>
            The fastest way to secure your harvest — no paperwork, no delays.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin:'-60px' }} variants={stagger}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))',
            gap: 0, position: 'relative',
          }}>
          {HOW_STEPS.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={title} variants={fadeUp}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'0 16px 32px', position:'relative' }}>
              {/* Connector line */}
              {i < HOW_STEPS.length - 1 && (
                <div style={{
                  position:'absolute', top:28, left:'calc(50% + 28px)',
                  width:'calc(100% - 56px)', height:2,
                  background:`linear-gradient(to right,${C.mid},${C.border})`,
                  zIndex:0,
                }} className="how-connector" />
              )}
              {/* Circle */}
              <div style={{
                width:56, height:56, borderRadius:'50%', zIndex:1, marginBottom:16,
                background:`linear-gradient(135deg,${C.primary},${C.mid})`,
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 6px 20px ${C.primary}33`,
                border:`3px solid ${C.white}`,
              }}>
                <Icon size={22} color="white" strokeWidth={2} />
              </div>
              {/* Step number */}
              <div style={{
                position:'absolute', top:-2, left:'calc(50% + 14px)',
                width:20, height:20, borderRadius:'50%',
                background:C.gold, color:'white',
                fontSize:10, fontWeight:800, fontFamily:'Poppins,sans-serif',
                display:'flex', alignItems:'center', justifyContent:'center', zIndex:2,
              }}>{i + 1}</div>
              <div style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:14, color:C.dark, marginBottom:6 }}>{title}</div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.6, fontFamily:'Poppins,sans-serif' }}>{desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   Features Section
───────────────────────────────────────── */
const FEATURES = [
  { icon: MapPin,      title: 'GPS Warehouse Search',    desc: 'Locate verified warehouses instantly using real-time GPS. Filter by distance, crop type, and capacity.' },
  { icon: Zap,         title: 'Real-Time Availability',  desc: 'Live capacity updates so you always know what storage is available before you book.' },
  { icon: ShieldCheck, title: 'Secure Booking',          desc: 'All warehouse owners are admin-verified. Your bookings are protected and documented.' },
  { icon: CreditCard,  title: 'Online Payments',         desc: 'Pay securely with UPI, cards, or net banking. Get instant digital receipts.' },
  { icon: Truck,       title: 'Transport Network',       desc: 'Connect with certified transport partners for seamless crop pickup and delivery.' },
  { icon: Bell,        title: 'Smart Notifications',     desc: 'Get SMS and in-app alerts for booking confirmations, due dates, and payment reminders.' },
];

function FeaturesSection() {
  return (
    <section id="features" style={{
      padding: 'clamp(48px,7vw,96px) clamp(16px,6vw,80px)',
      background: C.white,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          style={{ textAlign:'center', marginBottom:'clamp(32px,5vw,56px)' }}>
          <motion.div variants={fadeUp}
            style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:C.bg, border:`1px solid ${C.border}`,
              borderRadius:100, padding:'6px 16px', marginBottom:16,
            }}>
            <Star size={14} color={C.gold} fill={C.gold} />
            <span style={{ fontFamily:'Poppins,sans-serif', fontSize:12, fontWeight:700, color:C.primary }}>Platform Features</span>
          </motion.div>
          <motion.h2 variants={fadeUp}
            style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'clamp(22px,3vw,38px)', color:C.dark, marginBottom:12 }}>
            Everything You Need to Protect Your Harvest
          </motion.h2>
          <motion.p variants={fadeUp}
            style={{ fontSize:16, color:C.muted, fontFamily:'Poppins,sans-serif', maxWidth:480, margin:'0 auto' }}>
            Built for farmers, warehouse owners, and logistics partners across rural India.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin:'-60px' }} variants={stagger}
          style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} variants={fadeUp}
              whileHover={{ y:-6, boxShadow:'0 16px 40px rgba(46,125,50,0.12)' }}
              style={{
                background: C.white, borderRadius:20,
                border:`1.5px solid ${C.border}`, padding:'24px 22px',
                boxShadow:'0 2px 12px rgba(0,0,0,0.05)', transition:'border-color 0.2s',
                display:'flex', gap:16, alignItems:'flex-start',
              }}>
              <div style={{
                width:48, height:48, borderRadius:14, flexShrink:0,
                background:`linear-gradient(135deg,${C.bg},${C.light}44)`,
                border:`1px solid ${C.border}`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Icon size={22} color={C.primary} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:15, color:C.dark, marginBottom:6 }}>{title}</div>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.65, fontFamily:'Poppins,sans-serif' }}>{desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   Testimonials Section
───────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Rajan Kumar',
    role: 'Wheat Farmer, Punjab',
    avatar: Users,
    stars: 5,
    quote: 'AgriStore helped me save my entire wheat harvest during the unexpected rainy season. Found a verified warehouse just 8km away within minutes.',
  },
  {
    name: 'Suresh Patel',
    role: 'Warehouse Owner, Gujarat',
    avatar: Warehouse,
    stars: 5,
    quote: 'Managing storage bookings has never been this easy. My warehouse occupancy went from 40% to 95% in just two months after joining AgriStore.',
  },
  {
    name: 'Mohamed Rafiq',
    role: 'Transport Partner, Tamil Nadu',
    avatar: Truck,
    stars: 5,
    quote: 'Delivery scheduling is simple and efficient. I get clear trip assignments, and the farmers appreciate the punctual pickups every time.',
  },
];

function TestimonialsSection() {
  return (
    <section style={{
      padding: 'clamp(48px,7vw,96px) clamp(16px,6vw,80px)',
      background: `linear-gradient(135deg,${C.bg} 0%,#F1F8E9 100%)`,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          style={{ textAlign:'center', marginBottom:'clamp(32px,5vw,56px)' }}>
          <motion.div variants={fadeUp}
            style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'rgba(249,168,37,0.12)', border:`1px solid ${C.gold}55`,
              borderRadius:100, padding:'6px 16px', marginBottom:16,
            }}>
            <Star size={14} color={C.gold} fill={C.gold} />
            <span style={{ fontFamily:'Poppins,sans-serif', fontSize:12, fontWeight:700, color:'#B8860B' }}>What People Say</span>
          </motion.div>
          <motion.h2 variants={fadeUp}
            style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'clamp(22px,3vw,38px)', color:C.dark, marginBottom:12 }}>
            Loved by the Farming Community
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin:'-60px' }} variants={stagger}
          style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
          {TESTIMONIALS.map(({ name, role, avatar: Icon, stars, quote }) => (
            <motion.div key={name} variants={fadeUp}
              whileHover={{ y:-6, boxShadow:'0 20px 50px rgba(46,125,50,0.12)' }}
              style={{
                background: 'rgba(255,255,255,0.88)', backdropFilter:'blur(12px)',
                borderRadius:20, border:`1px solid ${C.border}`,
                padding:'28px 24px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)',
                display:'flex', flexDirection:'column', gap:16,
              }}>
              {/* Stars */}
              <div style={{ display:'flex', gap:3 }}>
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={16} color={C.gold} fill={C.gold} />
                ))}
              </div>
              {/* Quote */}
              <p style={{ fontSize:14, color:C.muted, lineHeight:1.75, fontFamily:'Poppins,sans-serif', fontStyle:'italic', flexGrow:1 }}>
                "{quote}"
              </p>
              {/* Author */}
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{
                  width:44, height:44, borderRadius:'50%',
                  background:`linear-gradient(135deg,${C.primary},${C.mid})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0,
                }}>
                  <Icon size={20} color="white" strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:14, color:C.dark }}>{name}</div>
                  <div style={{ fontFamily:'Poppins,sans-serif', fontSize:12, color:C.muted }}>{role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   Footer
───────────────────────────────────────── */
function Footer() {
  const links = {
    Company:  ['About Us', 'Careers', 'Blog', 'Press'],
    Product:  ['Features', 'Pricing', 'Security', 'Roadmap'],
    Support:  ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'],
  };
  const socials = [
    { icon: Share2,         label: 'Twitter'   },
    { icon: MessageCircle,  label: 'Instagram' },
    { icon: Link,           label: 'LinkedIn'  },
    { icon: Globe,          label: 'Facebook'  },
  ];

  return (
    <footer id="footer" style={{
      background: C.dark,
      color: 'rgba(255,255,255,0.8)',
      padding: 'clamp(48px,6vw,80px) clamp(16px,6vw,80px) 24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))',
          gap: 40, marginBottom: 48,
        }}>
          {/* Brand col */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:40, height:40, borderRadius:11, overflow:'hidden' }}>
                <img src="/logo.png" alt="AgriStore" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              <span style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:20, color:'white' }}>AgriStore</span>
            </div>
            <p style={{ fontSize:13, lineHeight:1.75, marginBottom:20, maxWidth:220, fontFamily:'Poppins,sans-serif' }}>
              India's trusted agricultural storage platform connecting farmers, warehouse owners, and logistics partners.
            </p>
            {/* Socials */}
            <div style={{ display:'flex', gap:12 }}>
              {socials.map(({ icon: Icon, label }) => (
                <button key={label} aria-label={label}
                  style={{
                    width:36, height:36, borderRadius:9,
                    background:'rgba(255,255,255,0.08)',
                    border:'1px solid rgba(255,255,255,0.12)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', transition:'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}>
                  <Icon size={16} color="rgba(255,255,255,0.85)" />
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <div style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:13, color:'white', marginBottom:16, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                {heading}
              </div>
              {items.map(item => (
                <div key={item} style={{ marginBottom:10 }}>
                  <a href="#" onClick={e => e.preventDefault()}
                    style={{
                      fontFamily:'Poppins,sans-serif', fontSize:13, color:'rgba(255,255,255,0.65)',
                      textDecoration:'none', transition:'color 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.color='white'}
                    onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.65)'}>
                    {item}
                  </a>
                </div>
              ))}
            </div>
          ))}

          {/* Contact col */}
          <div>
            <div style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:13, color:'white', marginBottom:16, textTransform:'uppercase', letterSpacing:'0.5px' }}>
              Contact
            </div>
            {[
              { icon: Mail,  text: 'support@agristore.in' },
              { icon: Phone, text: '+91 98765 43210'      },
              { icon: MapPin,text: 'Chennai, Tamil Nadu'   },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <Icon size={15} color={C.light} strokeWidth={2} />
                <span style={{ fontFamily:'Poppins,sans-serif', fontSize:13, color:'rgba(255,255,255,0.65)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.10)',
          paddingTop: 24,
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontFamily:'Poppins,sans-serif', fontSize:13, color:'rgba(255,255,255,0.45)' }}>
            © 2025 AgriStore. All rights reserved.
          </span>
          <div style={{ display:'flex', gap:20 }}>
            {['Privacy Policy','Terms of Service','Cookie Policy'].map(item => (
              <a key={item} href="#" onClick={e => e.preventDefault()}
                style={{
                  fontFamily:'Poppins,sans-serif', fontSize:12,
                  color:'rgba(255,255,255,0.45)', textDecoration:'none',
                }}
                onMouseEnter={e => e.target.style.color='rgba(255,255,255,0.8)'}
                onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.45)'}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────
   Main Landing Page Export
───────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLang();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        .landing-root { font-family: 'Poppins', sans-serif; }

        /* Hide desktop links on mobile, show burger */
        @media (max-width: 768px) {
          .nav-desktop-links { display: none !important; }
          .nav-burger         { display: flex !important; }
          .how-connector      { display: none !important; }
        }
      `}</style>

      <div className="landing-root" style={{ minHeight: '100dvh', overflowX: 'hidden' }}>
        <Navbar lang={lang} setLang={setLang} />

        <main>
          <HeroSection navigate={navigate} t={t} />
          <RoleCardsSection navigate={navigate} />
          <StatsSection />
          <HowItWorksSection />
          <FeaturesSection />
          <TestimonialsSection />
        </main>

        <Footer />
      </div>
    </>
  );
}
