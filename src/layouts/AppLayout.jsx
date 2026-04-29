import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const AppLayout = ({ children, user }) => {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const nombre = user?.NombreCompleto || 'Usuario';
  const iniciales = nombre
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422A12 12 0 0112 21.5a12 12 0 01-6.16-4.922L12 14z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium">NovaLearn</div>
              <div className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                LearningCards
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            {isHome && !user ? (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                  Registrarse
                </Link>
              </div>
            ) : user ? (
              <div className="flex items-center gap-6">
                <Link to="/dashboard" className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}>
                  Dashboard
                </Link>
                <Link to="/marketplace" className={`text-sm font-medium transition-colors ${location.pathname === '/marketplace' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}>
                  Marketplace
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                    className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold hover:bg-indigo-700 transition-all shadow-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {user?.fotoruta ? (
                      <img src={`http://localhost:8000/storage/${user.fotoruta}`} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm tracking-tighter">{iniciales}</span>
                    )}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-50 mb-1">
                        <p className="text-xs text-gray-400">Mi Cuenta</p>
                        <p className="text-sm font-bold truncate text-gray-800">{user.NombreCompleto}</p>
                      </div>
                      <Link to="/configuracion" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Configuración
                      </Link>
                      <div className="border-t border-gray-50 mt-1"></div>
                      <button 
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        onClick={async () => {
                          await api.post('/logout');
                          window.location.href = '/';
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link to="/login">
                <button className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm">Entrar</button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="border-t bg-white/70 backdrop-blur-xl mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          © 2026 NovaLearn. Empowering students worldwide.
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
