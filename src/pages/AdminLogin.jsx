/**
 * @fileoverview Componente de inicio de sesión exclusivo para administradores.
 * Proporciona una interfaz segura e independiente del login de usuarios normales
 * para acceder al panel de control de la plataforma.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

/**
 * Componente de la página de Login de Administrador.
 * Gestiona el formulario, la autenticación y los efectos visuales de seguridad.
 */
const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Activar modo oscuro de admin en el body
  useEffect(() => {
    document.documentElement.classList.add('admin-mode');
    return () => document.documentElement.classList.remove('admin-mode');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Petición al endpoint de admin de Laravel
      const response = await api.post('/admin/login', { email, password });
      
      // Detectar errores en el HTML de retorno (Blade redirects)
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        if (response.data.includes('incorrectas') || response.data.includes('permisos')) {
          setError('Credenciales incorrectas o no tienes permisos de administrador.');
          return;
        }
      }

      window.location.href = '/dashboard'; 
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.response?.data?.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Orbes de fondo (Réplica del Blade) */}
      <div className="fixed w-[500px] h-[500px] bg-[radial-gradient(circle,#7c3aed,transparent)] top-[-150px] left-[-100px] blur-[80px] opacity-15 animate-drift pointer-events-none"></div>
      <div className="fixed w-[400px] h-[400px] bg-[radial-gradient(circle,#c026d3,transparent)] bottom-[-100px] right-[-80px] blur-[80px] opacity-15 animate-drift pointer-events-none" style={{ animationDelay: '-4s' }}></div>
      <div className="fixed w-[300px] h-[300px] bg-[radial-gradient(circle,#4f46e5,transparent)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-[80px] opacity-15 animate-drift pointer-events-none" style={{ animationDelay: '-8s' }}></div>

      {/* Contenedor principal */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Badge de seguridad */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">Panel Seguro</span>
          </div>
        </div>

        {/* Card principal */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            {/* Ícono de escudo con pulso */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shield-pulse"
              style={{ background: 'linear-gradient(135deg, #4c1d95, #6d28d9)' }}>
              <svg className="w-8 h-8 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-slate-100 mb-1.5 tracking-tight">Panel de Administración</h1>
            <p className="text-sm text-slate-500">LearningCards · <span className="text-violet-400 font-medium">NovaLearn</span></p>
          </div>

          {/* Alerta de error */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
              >
                <svg className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <p className="text-sm text-rose-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Correo electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-600 group-focus-within:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@learningcards.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-600 group-focus-within:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPwd ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm tracking-wide flex items-center justify-center gap-2.5 mt-2 transition-all duration-200 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:shadow-[0_8px_32px_rgba(124,58,237,0.45)] hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {!loading ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Acceder al Panel
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Verificando...
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Volver al sitio principal
          </Link>
        </div>

        {/* Firma de seguridad */}
        <div className="text-center mt-4">
          <p className="text-[10px] text-slate-800 uppercase tracking-widest font-bold opacity-50">
            Acceso restringido · Solo personal autorizado
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
