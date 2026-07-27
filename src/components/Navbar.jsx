import { useState } from 'react';
import { Search, Bell, Leaf, Menu, X } from 'lucide-react';
import { useLang } from '../LangContext';
import { langNames } from '../i18n';

/**
 * Premium top navbar used by all dashboards.
 * Props:
 *   userName      – display name
 *   avatarUrl     – optional photo URL
 *   userInitial   – fallback letter for avatar
 *   onMenuToggle  – called when burger is clicked (mobile)
 *   sidebarOpen   – boolean, controls burger icon state
 *   onBack        – optional back button (Auth pages)
 *   dueCount      – notification badge count
 *   onNotifications – callback for bell click
 *   searchValue   – controlled search value
 *   onSearch      – search change handler
 *   showSearch    – whether to render search bar (default true)
 */
export default function Navbar({
  userName, avatarUrl, userInitial,
  onMenuToggle, sidebarOpen,
  onBack, dueCount = 0,
  onNotifications,
  searchValue, onSearch,
  showSearch = false,
}) {
  const { lang, setLang } = useLang();
  const initial = userInitial || (userName ? userName[0].toUpperCase() : 'U');

  return (
    <nav className="top-nav" role="navigation" aria-label="Main navigation">
      {/* Burger (mobile) */}
      <button className="icon-btn hide-desktop" onClick={onMenuToggle}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        style={{ flexShrink: 0 }}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo — shown on mobile when no sidebar */}
      <div className="nav-logo hide-desktop" style={{ display: 'flex' }}>
        <div className="nav-logo-icon" style={{ overflow: 'hidden', padding: 0 }}>
          <img src="/logo.png" alt="AgriStore" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
        </div>
        <span>AgriStore</span>
      </div>

      {/* Back button (Auth pages) */}
      {onBack && (
        <button className="btn btn-ghost btn-sm" onClick={onBack}
          style={{ flexShrink: 0 }}>
          ← Back
        </button>
      )}

      {/* Search bar */}
      {showSearch && (
        <div className="top-nav nav-search hide-mobile" role="search">
          <Search size={16} color="var(--text-4)" strokeWidth={2} />
          <input
            placeholder="Search warehouses, locations…"
            value={searchValue || ''}
            onChange={e => onSearch?.(e.target.value)}
            aria-label="Search warehouses"
          />
        </div>
      )}

      {/* Right side */}
      <div className="nav-right">
        {/* Language */}
        <select className="lang-select hide-mobile" value={lang}
          onChange={e => setLang(e.target.value)} aria-label="Select language">
          {Object.keys(langNames).map(l => (
            <option key={l} value={l}>🌐 {langNames[l]}</option>
          ))}
        </select>

        {/* Notifications bell */}
        {onNotifications && (
          <button className="icon-btn" onClick={onNotifications}
            aria-label={`Notifications${dueCount > 0 ? `, ${dueCount} due` : ''}`}>
            <Bell size={18} strokeWidth={2} />
            {dueCount > 0 && <span className="badge-dot" aria-hidden="true" />}
          </button>
        )}

        {/* Avatar */}
        <div className="nav-avatar" role="img" aria-label={`Signed in as ${userName || 'User'}`}>
          {avatarUrl
            ? <img src={avatarUrl} alt={userName} />
            : <span>{initial}</span>}
        </div>
      </div>
    </nav>
  );
}
