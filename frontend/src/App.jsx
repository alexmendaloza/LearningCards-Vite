/**
 * @fileoverview Componente raíz de la aplicación React.
 * Configura React Router, maneja el estado de autenticación global y define
 * todas las rutas de la plataforma (públicas, de usuario y de administrador).
 */

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
import ReportPage from './pages/Report';
import UserStatsPage from './pages/reports/UserStats';
import api from './api/axios';


/**
 * Pantalla de carga que se muestra mientras se verifica la sesión del usuario.
 */
const LoadingScreen = () => (
  <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    <p className="font-medium text-slate-500">Cargando...</p>
  </div>
);

/**
 * Componente envoltorio (HOC) para proteger rutas que requieren autenticación.
 * Redirige a la página de login si el usuario no ha iniciado sesión.
 */
const RequireUser = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

/**
 * Componente envoltorio (HOC) para proteger rutas exclusivas de administrador.
 * Redirige al login o al dashboard normal si no tiene permisos.
 */
const RequireAdmin = ({ user, children }) => {
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.rol !== 'admin') return <Navigate to="/user/dashboard" replace />;
  return children;
};

/**
 * Componente para redirigir URLs antiguas a las nuevas rutas.
 * Reemplaza los parámetros de la URL según el patrón definido.
 */
const LegacyUserRedirect = ({ pattern }) => {
  const params = useParams();
  const to = pattern.replace(/:([A-Za-z0-9_]+)/g, (_, key) => params[key] ?? '');
  return <Navigate to={to} replace />;
};

/**
 * Componente principal de la aplicación.
 * Maneja el estado global del usuario y define el árbol de rutas.
 */
function App() {
  // Almacena el usuario autenticado para compartirlo en toda la aplicación.
  const [user, setUser] = useState(null);
  // Controla el estado de carga inicial mientras se consulta la sesión.
  const [loading, setLoading] = useState(true);

  // Verifica la sesión del usuario al cargar la aplicación por primera vez.
  useEffect(() => {
    api.get('/me')
      .then(({ data }) => setUser(data.usuario))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Muestra un estado de espera antes de renderizar las rutas protegidas o públicas.
  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <AppLayout user={user} onAuth={setUser}>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to={user.rol === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace /> : <LoginPage initialTab="login" onAuth={setUser} />} />
          <Route path="/register" element={user ? <Navigate to={user.rol === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace /> : <LoginPage initialTab="register" onAuth={setUser} />} />
          <Route path="/admin/login" element={<AdminLoginPage onAuth={setUser} />} />

          {/* Rutas de Usuario (Protegidas) */}
          <Route path="/user/dashboard" element={<RequireUser user={user}><DashboardPage /></RequireUser>} />
          <Route path="/user/creator/stats" element={<RequireUser user={user}><UserStatsPage /></RequireUser>} />
          <Route path="/user/reportes" element={<RequireUser user={user}><ReportPage /></RequireUser>} />
          <Route path="/user/configuracion" element={<RequireUser user={user}><ProfilePage onAuth={setUser} /></RequireUser>} />
          <Route path="/user/mazos/create" element={<RequireUser user={user}><MazoFormPage /></RequireUser>} />
          <Route path="/user/mazos/:id/edit" element={<RequireUser user={user}><MazoFormPage /></RequireUser>} />
          <Route path="/user/mazos/:id/publicar" element={<RequireUser user={user}><PublishPage /></RequireUser>} />
          <Route path="/user/estudiar/:id" element={<RequireUser user={user}><StudyPage /></RequireUser>} />
          <Route path="/user/marketplace" element={<RequireUser user={user}><MarketplacePage /></RequireUser>} />
          <Route path="/user/marketplace/:id" element={<RequireUser user={user}><MarketplaceDetailPage /></RequireUser>} />
          <Route path="/user/marketplace/:id/pagar" element={<RequireUser user={user}><PaymentPage /></RequireUser>} />

          {/* Redirecciones de URLs legacy */}
          <Route path="/dashboard" element={<Navigate to="/user/dashboard" replace />} />
          <Route path="/reporte" element={<Navigate to="/user/reportes" replace />} />
          <Route path="/configuracion" element={<Navigate to="/user/configuracion" replace />} />
          <Route path="/mazos/create" element={<LegacyUserRedirect pattern="/user/mazos/create" />} />
          <Route path="/mazos/:id/edit" element={<LegacyUserRedirect pattern="/user/mazos/:id/edit" />} />
          <Route path="/mazos/:id/publicar" element={<LegacyUserRedirect pattern="/user/mazos/:id/publicar" />} />
          <Route path="/estudiar/:id" element={<LegacyUserRedirect pattern="/user/estudiar/:id" />} />
          <Route path="/marketplace" element={<Navigate to="/user/marketplace" replace />} />
          <Route path="/marketplace/:id" element={<LegacyUserRedirect pattern="/user/marketplace/:id" />} />
          <Route path="/marketplace/:id/pagar" element={<LegacyUserRedirect pattern="/user/marketplace/:id/pagar" />} />

          {/* Rutas de Administrador (Protegidas) */}
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
