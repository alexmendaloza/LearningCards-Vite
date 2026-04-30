import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Home from './pages/Home';
import {
  AdminDashboardPage,
  AdminLoginPage,
  AdminMazoDetailPage,
  AdminMazosPage,
  AdminUsersPage,
  AdminVentasPage,
  DashboardPage,
  LoginPage,
  MarketplaceDetailPage,
  MarketplacePage,
  MazoFormPage,
  PaymentPage,
  ProfilePage,
  PublishPage,
  StudyPage,
} from './pages/Platform';
import api from './api/axios';

const LoadingScreen = () => (
  <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    <p className="font-medium text-slate-500">Cargando...</p>
  </div>
);

const RequireUser = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const RequireAdmin = ({ user, children }) => {
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.rol !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/me')
      .then(({ data }) => setUser(data.usuario))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <AppLayout user={user} onAuth={setUser}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage initialTab="login" onAuth={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage initialTab="register" onAuth={setUser} />} />
          <Route path="/admin/login" element={<AdminLoginPage onAuth={setUser} />} />

          <Route path="/dashboard" element={<RequireUser user={user}><DashboardPage /></RequireUser>} />
          <Route path="/configuracion" element={<RequireUser user={user}><ProfilePage onAuth={setUser} /></RequireUser>} />
          <Route path="/mazos/create" element={<RequireUser user={user}><MazoFormPage /></RequireUser>} />
          <Route path="/mazos/:id/edit" element={<RequireUser user={user}><MazoFormPage /></RequireUser>} />
          <Route path="/mazos/:id/publicar" element={<RequireUser user={user}><PublishPage /></RequireUser>} />
          <Route path="/estudiar/:id" element={<RequireUser user={user}><StudyPage /></RequireUser>} />
          <Route path="/marketplace" element={<RequireUser user={user}><MarketplacePage /></RequireUser>} />
          <Route path="/marketplace/:id" element={<RequireUser user={user}><MarketplaceDetailPage /></RequireUser>} />
          <Route path="/marketplace/:id/pagar" element={<RequireUser user={user}><PaymentPage /></RequireUser>} />

          <Route path="/admin/dashboard" element={<RequireAdmin user={user}><AdminDashboardPage /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequireAdmin user={user}><AdminUsersPage /></RequireAdmin>} />
          <Route path="/admin/mazos" element={<RequireAdmin user={user}><AdminMazosPage /></RequireAdmin>} />
          <Route path="/admin/mazos/:id/tarjetas" element={<RequireAdmin user={user}><AdminMazoDetailPage /></RequireAdmin>} />
          <Route path="/admin/ventas" element={<RequireAdmin user={user}><AdminVentasPage /></RequireAdmin>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;