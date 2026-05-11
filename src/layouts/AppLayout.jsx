import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AppLayout = ({ children, user, onAuth }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isAdminLogin = location.pathname === '/admin/login';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdmin = user?.rol === 'admin';
  const isDashboard = location.pathname === '/dashboard';
  const isLanding = location.pathname === '/';
  const nombre = user?.NombreCompleto || 'Usuario';
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
  const foto = user?.fotoruta ? (String(user.fotoruta).startsWith('http') ? user.fotoruta : `/storage/${user.fotoruta}`) : '';

  useEffect(() => {
    try {
      document.body.classList.toggle('dark-theme', localStorage.getItem('novalearn-theme') === 'dark');
    } catch {
      document.body.classList.remove('dark-theme');
    }
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !document.body.classList.contains('dark-theme');
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.classList.remove('theme-burst-day', 'theme-burst-night', 'theme-liquid-pop');
      void toggle.offsetWidth;
      toggle.classList.add(nextIsDark ? 'theme-burst-night' : 'theme-burst-day', 'theme-liquid-pop');
      window.setTimeout(() => {
        toggle.classList.remove('theme-burst-day', 'theme-burst-night', 'theme-liquid-pop');
      }, 920);
    }
    document.body.classList.toggle('dark-theme', nextIsDark);
    try {
      localStorage.setItem('novalearn-theme', nextIsDark ? 'dark' : 'light');
    } catch {
      // Theme persistence is optional when storage is unavailable.
    }
  };

  const logout = async () => {
    await api.post(isAdmin ? '/admin/logout' : '/logout');
    onAuth(null);
    navigate(isAdmin ? '/admin/login' : '/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdminLogin && !isAuthPage && (
        <header className="sticky top-0 z-50 border-b bg-white/80 shadow-sm backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <Link to="/" className="nav-brand flex items-center gap-3">
              <div className="nav-brand-logo flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422A12 12 0 0112 21.5a12 12 0 01-6.16-4.922L12 14z" />
                </svg>
              </div>
              <div>
                <div className="nav-brand-kicker text-xs font-medium text-gray-600">NovaLearn</div>
                <div className="nav-brand-title bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-lg font-bold text-transparent">LearningCards</div>
              </div>
            </Link>

            <nav className="flex items-center gap-4">
              <button
                type="button"
                id="themeToggle"
                className="theme-toggle flex-shrink-0"
                aria-label="Cambiar tema"
                aria-pressed={document.body.classList.contains('dark-theme') ? 'true' : 'false'}
                onClick={toggleTheme}
              >
                <span className="theme-knob" />
                <span className="moon-icon" />
              </button>

              {!user ? (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600">Iniciar Sesion</Link>
                  <Link to="/register" className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-200">Registrarse</Link>
                  <Link to="/admin/login" className="text-xs font-semibold text-gray-400 hover:text-purple-600">Admin</Link>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  {isAdmin ? (
                    <>
                      <NavLink to="/admin/dashboard" current={location.pathname}>Dashboard Admin</NavLink>
                      <NavLink to="/admin/users" current={location.pathname}>Usuarios</NavLink>
                      <NavLink to="/admin/mazos" current={location.pathname}>Mazos</NavLink>
                      <NavLink to="/admin/ventas" current={location.pathname}>Ventas</NavLink>
                    </>
                  ) : !isLanding && (
                    <div className="flex items-center gap-4">
                      {!isDashboard ? (
                        <Link to="/dashboard" className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800">
                          <HomeIcon className="h-5 w-5" />
                          Volver al Dashboard
                        </Link>
                      ) : (
                        <Link to="/marketplace" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600">
                          <BagIcon className="h-5 w-5" />
                          Marketplace
                        </Link>
                      )}
                    </div>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setOpen(!open)}
                      onBlur={() => setTimeout(() => setOpen(false), 200)}
                      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-indigo-600 font-bold text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      {foto ? <img src={foto} alt="Perfil" className="h-full w-full object-cover" /> : iniciales}
                    </button>
                    {open && (
                      <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                        <div className="mb-1 border-b border-gray-50 px-4 py-2">
                          <p className="text-xs text-gray-400">{isAdmin ? 'Administrador' : 'Mi Cuenta'}</p>
                          <p className="truncate text-sm font-bold text-gray-800">{nombre}</p>
                        </div>
                        <Link to="/configuracion" className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600">Configuracion</Link>
                        {!isAdmin && <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600">Dashboard</Link>}
                        <button onClick={logout} className="block w-full border-t border-gray-50 px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50">Cerrar Sesion</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </nav>
          </div>
        </header>
      )}

      <main className="flex-grow">{children}</main>

      {!isAdminLogin && !isAuthPage && (
        <footer className="mt-auto border-t bg-white/70 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
            © 2026 NovaLearn. Empowering students worldwide.
          </div>
        </footer>
      )}
    </div>
  );
};

const NavLink = ({ to, current, children }) => (
  <Link to={to} className={`text-sm font-medium transition-colors ${current === to ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}>
    {children}
  </Link>
);

const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const BagIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

export default AppLayout;
