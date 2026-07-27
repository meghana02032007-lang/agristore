import { Search, BookOpen, CreditCard, User, LayoutDashboard, ClipboardList, Truck } from 'lucide-react';
import { useLang } from '../LangContext';

function BnavItem({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button className={`bnav-item${active ? ' active' : ''}`} onClick={onClick}
      aria-label={label} aria-current={active ? 'page' : undefined}>
      <span className="bnav-icon-wrap">
        <Icon size={20} strokeWidth={active ? 2.5 : 2}
          color={active ? 'var(--green-800)' : 'var(--text-4)'} />
        {badge > 0 && (
          <span className="bnav-badge" aria-label={`${badge} notifications`}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="bnav-label">{label}</span>
    </button>
  );
}

export function FarmerBottomNav({ activeTab, onSwitch, onPayments, dueCount = 0 }) {
  const { t } = useLang();
  return (
    <nav className="bottom-nav hide-desktop" role="navigation" aria-label="Bottom navigation">
      <BnavItem icon={Search}      label={t.search}   active={activeTab === 'search'}   onClick={() => onSwitch('search')} />
      <BnavItem icon={BookOpen}    label={t.bookings} active={activeTab === 'bookings'} onClick={() => onSwitch('bookings')} />
      <BnavItem icon={CreditCard}  label={t.payments} active={false}                   onClick={onPayments} badge={dueCount} />
      <BnavItem icon={User}        label={t.profile}  active={activeTab === 'profile'}  onClick={() => onSwitch('profile')} />
    </nav>
  );
}

export function OwnerBottomNav({ activeTab, onSwitch }) {
  const { t } = useLang();
  return (
    <nav className="bottom-nav hide-desktop" role="navigation" aria-label="Bottom navigation">
      <BnavItem icon={LayoutDashboard} label={t.dashboard} active={activeTab === 'dashboard'} onClick={() => onSwitch('dashboard')} />
      <BnavItem icon={ClipboardList}   label={t.requests}  active={activeTab === 'bookings'}  onClick={() => onSwitch('bookings')} />
      <BnavItem icon={User}            label={t.profile}   active={activeTab === 'profile'}   onClick={() => onSwitch('profile')} />
    </nav>
  );
}

export function AdminBottomNav({ activeTab, onSwitch }) {
  const items = [
    { key: 'overview',  icon: LayoutDashboard, label: 'Overview'  },
    { key: 'approvals', icon: ClipboardList,   label: 'Approvals' },
    { key: 'bookings',  icon: BookOpen,        label: 'Bookings'  },
    { key: 'profile',   icon: User,            label: 'Profile'   },
  ];
  return (
    <nav className="bottom-nav hide-desktop" role="navigation" aria-label="Bottom navigation"
      style={{ display: 'flex' }}>
      {items.map(item => (
        <BnavItem key={item.key} icon={item.icon} label={item.label}
          active={activeTab === item.key} onClick={() => onSwitch(item.key)} />
      ))}
    </nav>
  );
}

export function TransportBottomNav({ activeTab, onSwitch }) {
  return (
    <nav className="bottom-nav hide-desktop" role="navigation" aria-label="Bottom navigation">
      <BnavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => onSwitch('dashboard')} />
      <BnavItem icon={Truck}           label="Trips"     active={activeTab === 'trips'}     onClick={() => onSwitch('trips')} />
      <BnavItem icon={User}            label="Profile"   active={activeTab === 'profile'}   onClick={() => onSwitch('profile')} />
    </nav>
  );
}
