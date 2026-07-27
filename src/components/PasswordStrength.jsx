import { useLang } from '../LangContext';

function getStrength(pw) {
  let score = 0;
  const checks = {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    number:  /[0-9]/.test(pw),
    symbol:  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
    long:    pw.length >= 12,
  };
  if (checks.length) score++;
  if (checks.upper)  score++;
  if (checks.number) score++;
  if (checks.symbol) score++;
  if (checks.long)   score++;
  return { score, checks };
}

const LEVELS = [
  { min: 0, label: 'pwWeak',   color: '#C62828', bg: '#FFEBEE', bars: 1 },
  { min: 2, label: 'pwFair',   color: '#E65100', bg: '#FFF3E0', bars: 2 },
  { min: 3, label: 'pwGood',   color: '#F57F17', bg: '#FFFDE7', bars: 3 },
  { min: 4, label: 'pwStrong', color: '#2D7A3A', bg: '#E8F5E9', bars: 4 },
];

export default function PasswordStrength({ password }) {
  const { t } = useLang();
  if (!password) return null;

  const { score, checks } = getStrength(password);
  const level = [...LEVELS].reverse().find(l => score >= l.min) || LEVELS[0];

  const tips = [
    !checks.length  && t.pwNeedLength,
    !checks.upper   && t.pwNeedUpper,
    !checks.number  && t.pwNeedNumber,
    !checks.symbol  && t.pwNeedSymbol,
  ].filter(Boolean);

  return (
    <div style={{ marginTop: 8, marginBottom: 4 }}>
      {/* Strength bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 5, borderRadius: 3,
            background: i <= level.bars ? level.color : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* Label */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: tips.length ? 6 : 0,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: level.color,
          background: level.bg, padding: '2px 8px', borderRadius: 20,
        }}>
          {t[level.label]}
        </span>
        {score >= 4 && (
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>✅ {t.pwStrong}</span>
        )}
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {tips.map(tip => (
            <span key={tip} style={{
              fontSize: 11, color: '#E65100',
              background: '#FFF3E0', borderRadius: 6,
              padding: '2px 7px', fontWeight: 600,
            }}>
              ⚠ {tip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
