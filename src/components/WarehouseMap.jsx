import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Fix broken default icon in Vite ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Warehouse pin icon (color by availability) ── */
function makePinIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48">
    <defs>
      <filter id="ds">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
      </filter>
    </defs>
    <path filter="url(#ds)"
      d="M18 2C10.3 2 4 8.3 4 16c0 10 14 30 14 30S32 26 32 16C32 8.3 25.7 2 18 2z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="18" cy="16" r="7" fill="white"/>
    <text x="18" y="20" text-anchor="middle" font-size="9" font-weight="900" fill="${color}">WH</text>
  </svg>`;
  return L.divIcon({
    className:   '',
    html:        svg,
    iconSize:    [36, 48],
    iconAnchor:  [18, 48],
    popupAnchor: [0, -50],
  });
}

function makeUserIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
    <circle cx="16" cy="16" r="14" fill="#1565C0" stroke="white" stroke-width="3"/>
    <circle cx="16" cy="16" r="5"  fill="white"/>
  </svg>`;
  return L.divIcon({
    className:   '',
    html:        svg,
    iconSize:    [32, 32],
    iconAnchor:  [16, 16],
    popupAnchor: [0, -18],
  });
}

const GREEN_ICON  = makePinIcon('#2D7A3A');
const ORANGE_ICON = makePinIcon('#E65100');
const RED_ICON    = makePinIcon('#C62828');
const USER_ICON   = makeUserIcon();

function warehouseIcon(w) {
  const cap  = Number(w.total_capacity || w.capacity || 1);
  const avail = Number(w.available || 0);
  const pct  = ((cap - avail) / cap) * 100;
  if (pct >= 90) return RED_ICON;
  if (pct >= 60) return ORANGE_ICON;
  return GREEN_ICON;
}

/* ── Fly map when user location changes ── */
function FlyTo({ position, zoom = 12 }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom, { duration: 1.2 });
  }, [position]);
  return null;
}

const TN_CENTER = [11.1271, 78.6569];

/**
 * Props:
 *   warehouses   – array to show pins for (pass [] to show empty map)
 *   userLocation – { lat, lng, city } or null
 *   onSelect     – called with warehouse object on popup button click
 *   hasSearched  – boolean; if false, show "search to see warehouses" hint
 */
export default function WarehouseMap({ warehouses, userLocation, onSelect, hasSearched }) {
  const markers = useMemo(() =>
    (warehouses || []).filter(w =>
      w.latitude  && w.longitude &&
      !isNaN(Number(w.latitude)) &&
      !isNaN(Number(w.longitude))
    ),
  [warehouses]);

  const center      = userLocation ? [userLocation.lat, userLocation.lng] : TN_CENTER;
  const initialZoom = userLocation ? 12 : 7;

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      marginBottom: 16,
      border: '1.5px solid var(--border)',
      boxShadow: '0 4px 20px rgba(45,122,58,0.12)',
      isolation: 'isolate',   /* contain Leaflet z-index inside this element */
      position: 'relative',
      zIndex: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px',
        background: 'var(--white)',
        borderBottom: '1px solid var(--border)',
        fontSize: 12, fontWeight: 600, color: 'var(--muted)',
      }}>
        <span>
          🗺 Live Map
          {hasSearched && markers.length > 0 && (
            <span> &nbsp;·&nbsp;
              <strong style={{ color: 'var(--green-dark)' }}>{markers.length}</strong> found
            </span>
          )}
        </span>
        {hasSearched && markers.length > 0 && (
          <span style={{ display: 'flex', gap: 10 }}>
            <span>🟢 Available</span>
            <span>🟠 Limited</span>
            <span>🔴 Full</span>
            {userLocation && <span>🔵 You</span>}
          </span>
        )}
      </div>

      {/* Map */}
      <div style={{ position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={initialZoom}
          style={{ height: 360 }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />

          {userLocation && <FlyTo position={[userLocation.lat, userLocation.lng]} />} 

          {/* User location dot */}
          {userLocation && (
            <>
              <Marker position={[userLocation.lat, userLocation.lng]} icon={USER_ICON}>
                <Popup>
                  <strong>📍 Your Location</strong><br />
                  {userLocation.city || `${userLocation.lat}, ${userLocation.lng}`}
                </Popup>
              </Marker>
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={2000}
                pathOptions={{ color:'#1565C0', fillColor:'#1565C0', fillOpacity:0.07, weight:1.5 }}
              />
            </>
          )}

          {/* Individual warehouse pins — only shown after search */}
          {hasSearched && markers.map(w => (
            <Marker
              key={w.id}
              position={[Number(w.latitude), Number(w.longitude)]}
              icon={warehouseIcon(w)}
            >
              <Popup minWidth={210}>
                <div style={{ fontFamily: "'Nunito',sans-serif", lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>{w.name}</div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>📍 {w.location}</div>
                  {w._dist != null && (
                    <div style={{
                      display:'inline-flex', alignItems:'center', gap:4,
                      background:'#E3F2FD', color:'#1565C0',
                      borderRadius:20, padding:'2px 8px',
                      fontSize:11, fontWeight:700, marginBottom:8,
                    }}>
                    🗺 {w._dist < 1 ? `${Math.round(w._dist * 1000)} m` : `${w._dist.toFixed(1)} km`} away
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
                    {[
                      ['₹' + (w.price || 5) + '/ton/day', '#E8F5E9', '#2D7A3A'],
                      [Number(w.available || 0) + 'T free',          '#E8F5E9', '#2D7A3A'],
                      [Number(w.total_capacity || 0) + 'T total',    '#E3F2FD', '#1565C0'],
                      [w.storage_type || 'General',                  '#FFF8E1', '#E65100'],
                    ].map(([label, bg, color]) => (
                      <div key={label} style={{
                        background: bg, borderRadius: 6,
                        padding: '4px 6px', fontSize: 11,
                        fontWeight: 700, color,
                      }}>{label}</div>
                    ))}
                  </div>
                  {w.phone && (
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>
                      📞 {w.phone}
                    </div>
                  )}
                  <button
                    onClick={() => onSelect(w)}
                    style={{
                      width: '100%', padding: '8px 0',
                      background: '#2D7A3A', color: '#fff',
                      border: 'none', borderRadius: 8,
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    📦 View & Book
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Overlay hint when no search yet */}
        {!hasSearched && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(249,251,247,0.72)',
            backdropFilter: 'blur(2px)',
            zIndex: 500, pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
            <div style={{
              fontWeight: 800, fontSize: 15,
              color: 'var(--green-dark)', marginBottom: 4,
            }}>Search to see warehouses</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Type a name, district or area above
            </div>
          </div>
        )}

        {/* No results state */}
        {hasSearched && markers.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(249,251,247,0.72)',
            backdropFilter: 'blur(2px)',
            zIndex: 500, pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🏭</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--muted)' }}>
              No warehouses found
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Try a different search term
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
