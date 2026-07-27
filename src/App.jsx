import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LangProvider }      from './LangContext';
import Landing               from './pages/Landing';
import Auth                  from './pages/Auth';
import FarmerDashboard       from './pages/FarmerDashboard';
import OwnerDashboard        from './pages/OwnerDashboard';
import AdminDashboard        from './pages/AdminDashboard';
import TransportDashboard    from './pages/TransportDashboard';

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"            element={<Landing />} />
          <Route path="/auth/:role"  element={<Auth />} />
          <Route path="/farmer"      element={<FarmerDashboard />} />
          <Route path="/owner"       element={<OwnerDashboard />} />
          <Route path="/admin"       element={<AdminDashboard />} />
          <Route path="/transport"   element={<TransportDashboard />} />
          <Route path="*"            element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  );
}
