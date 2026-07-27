import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLang } from '../LangContext';
import { langNames } from '../i18n';
import { registerUser, loginUser } from '../auth';
import PasswordStrength from '../components/PasswordStrength';

/* ── Role meta ── */
const ROLE_META = {
  farmer:    { icon: '👨‍🌾', label: 'Farmer',          canRegister: true  },
  owner:     { icon: '🏭',  label: 'Warehouse Owner', canRegister: true  },
  admin:     { icon: '🛡️',  label: 'Admin',           canRegister: true  },
  transport: { icon: '🚛',  label: 'Transport Co.',   canRegister: true  },
};

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* ══════════════════════════════════════════
   OTP Screen
══════════════════════════════════════════ */
function OTPScreen({ mobile, onVerified, onBack }) {
  const { t } = useLang();
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [sentOtp, setSentOtp] = useState(() => {
    const code = generateOTP();
    console.log(`%c[AgriStore OTP] Your code: ${code}`, 'font-size:18px;color:green;font-weight:bold');
    return code;
  });
  const [showOtp, setShowOtp] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  function handleDigit(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (!value && index > 0) inputRefs.current[index - 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'Enter') verifyOTP();
  }

  function handlePaste(e) {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    paste.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(paste.length, 5)]?.focus();
  }

  async function verifyOTP() {
    const entered = otp.join('');
    if (entered.length < 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    if (entered !== sentOtp) {
      setError('Incorrect OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setLoading(false);
      return;
    }
    setLoading(false);
    onVerified();
  }

  function resend() {
    const code = generateOTP();
    setSentOtp(code);
    console.log(`%c[AgriStore OTP] New code: ${code}`, 'font-size:18px;color:green;font-weight:bold');
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    setShowOtp(false);
    setError('');
    inputRefs.current[0]?.focus();
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'linear-gradient(135deg,#2D7A3A,#4CAF50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, margin: '0 auto 16px',
        boxShadow: '0 6px 20px rgba(45,122,58,0.3)',
      }}>📱</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{t.otpTitle}</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>{t.otpSent}</p>
      <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--green-dark)', marginBottom: 20 }}>
        {mobile.includes('@') ? mobile : `+91 ${mobile}`}
      </p>

      {/* OTP reveal box */}
      <div style={{
        background: '#FFF8E1', border: '1.5px dashed #FFC107',
        borderRadius: 12, padding: '12px 16px', marginBottom: 20, textAlign: 'center',
      }}>
        <div style={{ fontSize: 12, color: '#795548', fontWeight: 700, marginBottom: 6 }}>
          🔧 Demo Mode — Your OTP
        </div>
        {showOtp ? (
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 8, color: '#1B5E20', fontFamily: 'monospace' }}>
            {sentOtp}
          </div>
        ) : (
          <button onClick={() => setShowOtp(true)} style={{
            background: '#FFC107', border: 'none', borderRadius: 8,
            padding: '7px 20px', fontWeight: 800, fontSize: 13,
            cursor: 'pointer', color: '#1A1A1A', fontFamily: 'var(--font)',
          }}>👁 Tap to reveal OTP</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
        {otp.map((digit, i) => (
          <input key={i} ref={el => inputRefs.current[i] = el}
            type="text" inputMode="numeric" maxLength={1} value={digit}
            autoFocus={i === 0}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            style={{
              width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 800,
              border: `2px solid ${digit ? 'var(--green)' : error ? '#EF9A9A' : 'var(--border)'}`,
              borderRadius: 12,
              background: digit ? 'var(--green-light)' : 'var(--white)',
              outline: 'none', transition: 'all 0.15s',
              fontFamily: 'var(--font)', color: 'var(--text)',
            }}
          />
        ))}
      </div>

      {error && (
        <div style={{
          background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2',
          borderRadius: 10, padding: '9px 14px', fontSize: 13, marginBottom: 14,
        }}>{error}</div>
      )}

      <button className="btn btn-primary btn-full btn-lg" onClick={verifyOTP}
        disabled={loading || otp.join('').length < 6}>
        {loading ? `⏳ ${t.verifying}` : `✅ ${t.verifyLogin}`}
      </button>
      <div style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
        {resendTimer > 0
          ? <>{t.resendIn} <strong>{resendTimer}s</strong></>
          : <span onClick={resend} style={{ color: 'var(--green)', fontWeight: 700, cursor: 'pointer' }}>{t.resendOtp}</span>
        }
      </div>
      <button onClick={onBack} style={{
        marginTop: 12, background: 'none', border: 'none',
        color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)',
      }}>{t.changeNumber}</button>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Auth Component
══════════════════════════════════════════ */
export default function Auth() {
  const { role }   = useParams();
  const navigate   = useNavigate();
  const { t, lang, setLang } = useLang();

  const meta = ROLE_META[role] || ROLE_META.farmer;

  // admin is login-only (no self-registration)
  const loginOnly = role === 'admin';
  // admin and transport skip OTP after login
  const skipOtp   = role === 'admin' || role === 'transport';

  const [tab, setTab]         = useState('login');
  const [step, setStep]       = useState('form');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // pending-approval banner state (for owners who registered but aren't approved yet)
  const [pendingBanner, setPendingBanner] = useState(false);

  const pendingUser = useRef(null);

  const [loginId, setLoginId]     = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [regFirst, setRegFirst]   = useState('');
  const [regLast, setRegLast]     = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail]   = useState('');
  const [regState, setRegState]   = useState('');
  const [regPass, setRegPass]     = useState('');

  const loginPassRef = useRef(null);
  const regLastRef   = useRef(null);
  const regMobileRef = useRef(null);
  const regEmailRef  = useRef(null);
  const regStateRef  = useRef(null);
  const regPassRef   = useRef(null);
  const regSubmitRef = useRef(null);

  function focusNext(ref) {
    return (e) => { if (e.key === 'Enter') { e.preventDefault(); ref?.current?.focus(); } };
  }

  /* ── destination after successful login ── */
  function destinationFor(r) {
    if (r === 'farmer')    return '/farmer';
    if (r === 'owner')     return '/owner';
    if (r === 'admin')     return '/admin';
    if (r === 'transport') return '/transport';
    return '/';
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setPendingBanner(false);
    if (!loginId || !loginPass) { setError('Please fill all fields'); return; }
    setLoading(true);
    const { user, error: loginErr } = await loginUser({ identifier: loginId, password: loginPass, role });
    setLoading(false);
    if (loginErr) {
      if (loginErr.code === 'PENDING_APPROVAL') {
        setPendingBanner(true);
      } else {
        setError(loginErr.message);
      }
      return;
    }
    pendingUser.current = user;
    // admin and transport skip OTP — go straight to dashboard
    if (skipOtp) {
      navigate(destinationFor(role));
    } else {
      setStep('otp');
    }
  }

  function handleOTPVerified() {
    navigate(destinationFor(role));
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (!regFirst || !regMobile || !regPass) { setError('Please fill all fields'); return; }
    if (regPass.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error: regErr, alreadyExists } = await registerUser({
      firstName: regFirst, lastName: regLast, mobile: regMobile,
      email: regEmail, password: regPass, stateDistrict: regState, role,
    });
    setLoading(false);
    if (regErr) { setError(regErr.message); return; }
    if (alreadyExists) {
      setError('This mobile number is already registered. Please login.');
      setTab('login'); setLoginId(regMobile); return;
    }
    setRegFirst(''); setRegLast(''); setRegMobile(''); setRegEmail(''); setRegState(''); setRegPass('');
    setTab('login');
    if (role === 'owner') {
      setError('✅ Registration submitted! An admin will review and approve your account. You will be able to login once approved.');
    } else {
      setError('✅ Account created! Please login now.');
    }  }

  /* ── accent colour for non-green roles ── */
  const accentStyle = { background: 'rgba(13,59,46,0.88)' };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Decorative background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {['🌾','🌿','🌱','🌾','🌿'].map((icon, i) => (
          <div key={i} style={{
            position: 'absolute', fontSize: [56,42,60,48,50][i], opacity: 0.07,
            top: ['8%','55%','20%','72%','40%'][i], left: ['-2%','82%','-4%','86%','90%'][i],
            transform: `rotate(${[-15,20,-10,15,-20][i]}deg)`,
          }}>{icon}</div>
        ))}
      </div>

      {/* Navbar */}
      <nav className="nav" style={{
        ...accentStyle,
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div className="logo" style={{ color: '#fff' }}>
          <div className="logo-icon" style={{ background: 'rgba(82,183,136,0.4)', overflow: 'hidden', padding: 0 }}>
              <img src="/logo.png" alt="AgriStore" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9 }} />
            </div>
          AgriStore
        </div>
        <div className="nav-right">
          {step === 'form' && (
            <button className="back-btn" style={{ color: 'rgba(255,255,255,0.85)' }} onClick={() => navigate('/')}>← Back</button>
          )}
          <select className="lang-btn" value={lang} onChange={e => setLang(e.target.value)}>
            {Object.keys(langNames).map(l => <option key={l} value={l}>🌐 {langNames[l]}</option>)}
          </select>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* OTP Screen */}
          {step === 'otp' && (
            <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 20, padding: '24px 20px', boxShadow: '0 16px 48px rgba(0,0,0,0.22)' }}>
              <OTPScreen
                mobile={loginId.replace(/\s/g, '')}
                onVerified={handleOTPVerified}
                onBack={() => { setStep('form'); setError(''); }}
              />
            </div>
          )}

          {/* Login / Register Form */}
          {step === 'form' && (
            <>
              {/* Hero banner */}
              <div style={{
                textAlign: 'center', marginBottom: 16,
                padding: '22px 16px 16px',
                background: 'rgba(255,255,255,0.13)',
                backdropFilter: 'blur(10px)',
                borderRadius: 20, border: '1px solid rgba(255,255,255,0.25)',
              }}>
                <div style={{
                  width: 82, height: 82, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 40, margin: '0 auto 12px',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
                  border: '3px solid rgba(255,255,255,0.38)',
                }}>{meta.icon}</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                  {meta.label} {tab === 'login' ? t.login : t.register}
                </h2>
                {loginOnly && (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                    🔒 Restricted access — authorised personnel only
                  </p>
                )}              </div>

              {/* Pending-approval banner (owner tried to login but not yet approved) */}
              {pendingBanner && (
                <div style={{
                  background: '#FFF8E1', border: '1.5px solid #FFC107',
                  borderRadius: 14, padding: '16px 18px', marginBottom: 16,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#E65100', marginBottom: 6 }}>
                    Account Pending Approval
                  </div>
                  <div style={{ fontSize: 13, color: '#5D4037', lineHeight: 1.6 }}>
                    Your warehouse owner registration is under review by the admin.
                    You will be able to login once your account is verified and approved.
                  </div>
                </div>
              )}

              {/* Form card */}
              <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 20, padding: '20px 18px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>

                {/* Tab bar — hidden for login-only roles */}
                {!loginOnly && (
                  <div className="tab-bar" style={{ marginBottom: 20 }}>
                    <div className={`tab${tab === 'login' ? ' active' : ''}`}
                      onClick={() => { setTab('login'); setError(''); setPendingBanner(false); }}>{t.login}</div>
                    <div className={`tab${tab === 'register' ? ' active' : ''}`}
                      onClick={() => { setTab('register'); setError(''); setPendingBanner(false); }}>{t.register}</div>
                  </div>
                )}

                {error && (
                  <div className={error.startsWith('✅') ? 'alert alert-success' : ''}
                    style={!error.startsWith('✅') ? {
                      background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2',
                      borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 14,
                    } : { marginBottom: 14 }}>
                    {error}
                  </div>
                )}

                {/* ── LOGIN FORM ── */}
                {(tab === 'login' || loginOnly) && (
                  <form onSubmit={handleLogin} autoComplete="on">
                    <div className="form-group">
                      <label className="form-label">Mobile Number or Email</label>
                      <input className="form-input" type="text"
                        placeholder="Mobile number or email address"
                        value={loginId} onChange={e => setLoginId(e.target.value)}
                        onKeyDown={focusNext(loginPassRef)} autoFocus
                        autoComplete="username" name="username" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t.password}</label>
                      <input className="form-input" type="password" placeholder="Enter password"
                        value={loginPass} onChange={e => setLoginPass(e.target.value)}
                        ref={loginPassRef} autoComplete="current-password" name="password" />
                    </div>
                    {!skipOtp && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'var(--green-light)', borderRadius: 10,
                        padding: '9px 12px', marginBottom: 14, fontSize: 12, color: 'var(--green-dark)',
                      }}>
                        <span>🔐</span>
                        <span>An OTP will be shown in browser console after login for verification.</span>
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                      {loading ? '⏳ Verifying...' : skipOtp ? `${t.login} →` : `${t.login} & Get OTP →`}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>
                      {t.forgotPassword}{' '}
                      <span style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 700 }}>{t.reset}</span>
                    </p>
                  </form>
                )}

                {/* ── REGISTER FORM (farmer / owner only) ── */}
                {tab === 'register' && !loginOnly && (
                  <form onSubmit={handleRegister} autoComplete="on">
                    <div className="row">
                      <div className="form-group">
                        <label className="form-label">{t.firstName}</label>
                        <input className="form-input" placeholder="First name"
                          value={regFirst} onChange={e => setRegFirst(e.target.value)}
                          onKeyDown={focusNext(regLastRef)} autoFocus
                          autoComplete="given-name" name="firstName" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t.lastName}</label>
                        <input className="form-input" placeholder="Last name"
                          value={regLast} onChange={e => setRegLast(e.target.value)}
                          ref={regLastRef} onKeyDown={focusNext(regMobileRef)}
                          autoComplete="family-name" name="lastName" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t.mobile}</label>
                      <input className="form-input" type="tel" placeholder="+91 XXXXX XXXXX"
                        value={regMobile} onChange={e => setRegMobile(e.target.value)}
                        ref={regMobileRef} onKeyDown={focusNext(regEmailRef)}
                        autoComplete="tel" name="mobile" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                      <input className="form-input" type="email" placeholder="you@example.com"
                        value={regEmail} onChange={e => setRegEmail(e.target.value)}
                        ref={regEmailRef} onKeyDown={focusNext(regStateRef)}
                        autoComplete="email" name="email" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t.stateDistrict}</label>
                      <input className="form-input" placeholder="e.g. Tamil Nadu, Vellore"
                        value={regState} onChange={e => setRegState(e.target.value)}
                        ref={regStateRef} onKeyDown={focusNext(regPassRef)}
                        autoComplete="address-level1" name="stateDistrict" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t.password}</label>
                      <input className="form-input" type="password" placeholder="Create password (min 6 chars)"
                        value={regPass} onChange={e => setRegPass(e.target.value)}
                        ref={regPassRef} onKeyDown={focusNext(regSubmitRef)}
                        autoComplete="new-password" name="newPassword" />
                      <PasswordStrength password={regPass} />
                    </div>
                    {/* Approval notice for owner registrations */}
                    {role === 'owner' && (
                      <div style={{
                        background: '#E3F2FD', border: '1px solid #90CAF9',
                        borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                        fontSize: 12, color: '#1565C0', lineHeight: 1.6,
                      }}>
                        ℹ️ Your registration will be reviewed by the admin before you can login. Make sure your details are accurate.
                      </div>
                    )}
                    {role === 'transport' && (
                      <div style={{
                        background: '#E8F5E9', border: '1px solid #A5D6A7',
                        borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                        fontSize: 12, color: '#2D7A3A', lineHeight: 1.6,
                      }}>
                        🚛 Register your transport company to start accepting delivery assignments from farmers and warehouse owners.
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary btn-full btn-lg mt-2"
                      disabled={loading} ref={regSubmitRef}>
                      {loading ? '⏳ Creating account...' : t.createAccount}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
