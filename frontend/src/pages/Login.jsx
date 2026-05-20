import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

// Gestiona el acceso y registro de usuarios desde la interfaz pública.
const Login = ({ initialTab = 'login' }) => {
  // Controla qué formulario se muestra: inicio de sesión o registro.
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sincroniza la pestaña visible cuando cambia el modo inicial desde la ruta.
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Estados de soporte para solicitudes, errores y navegación posterior.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Datos del formulario de inicio de sesión.
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    remember: false
  });

  // Datos del formulario de registro de usuario.
  const [registerData, setRegisterData] = useState({
    UserName: '',
    NombreCompleto: '',
    email: '',
    password: '',
    fechanac: '',
    genero: 'M',
    fotoruta: null
  });

  // Envía las credenciales del usuario al backend y gestiona la respuesta.
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log("Intentando login con:", loginData.email);
      const response = await api.post('/login', loginData);
      
      // Verificamos si la respuesta es HTML (indica redirección manual de Blade)
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        if (response.data.includes('incorrectas') || response.data.includes('inválidas')) {
          setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
          return;
        }
        if (response.data.includes('administradores deben acceder')) {
          setError('Esta cuenta es de administrador. Por favor, usa el panel de administración.');
          return;
        }
      }

      console.log("Login exitoso, redirigiendo...");
      window.location.href = '/dashboard';
    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.status === 419) {
        setError('La sesión ha expirado. Por favor, recarga la página.');
      } else {
        setError(err.response?.data?.message || 'Error de conexión con el servidor. Verifica que Laravel esté activo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Construye y envía el formulario multipart para registrar una cuenta nueva.
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('UserName', registerData.UserName);
      formData.append('NombreCompleto', registerData.NombreCompleto);
      formData.append('email', registerData.email);
      formData.append('password', registerData.password);
      formData.append('fechanac', registerData.fechanac);
      formData.append('genero', registerData.genero);
      if (registerData.fotoruta) {
        formData.append('fotoruta', registerData.fotoruta);
      }

      console.log("Registrando usuario:", registerData.email);
      await api.post('/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      window.location.href = '/dashboard';
    } catch (err) {
      console.error("Register error:", err);
      setError(err.response?.data?.message || 'Error al registrarse. Posiblemente el correo ya existe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md my-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100">
          <div className="p-8 pb-4">
            <h2 className="text-3xl font-bold mb-1 text-gray-800 tracking-tight">Comenzar</h2>
            <p className="text-gray-500 text-sm mb-6">Inicia sesión o crea una cuenta nueva</p>

            <div className="flex rounded-xl bg-gray-100 p-1.5 mb-2">
              <button onClick={() => { setActiveTab('login'); setError(null); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'login' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Iniciar sesión</button>
              <button onClick={() => { setActiveTab('register'); setError(null); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'register' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Registrarse</button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-bold">
                ⚠️ {error}
              </div>
            )}
          </div>

          <div className="px-8 pb-8 overflow-y-auto custom-scrollbar">
            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 py-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 ml-1">Correo o Usuario</label>
                  <input type="text" placeholder="estudiante@ejemplo.com o Zalo123" required value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 ml-1">Contraseña</label>
                  <input type="password" placeholder="••••••••" required value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" checked={loginData.remember} onChange={(e) => setLoginData({...loginData, remember: e.target.checked})} className="rounded text-indigo-600" /><span className="text-gray-500">Recordarme</span></label>
                  <a href="#" className="text-indigo-600 font-semibold hover:underline">¿Olvidaste tu contraseña?</a>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-all disabled:opacity-50">{loading ? 'Cargando...' : 'Iniciar sesión'}</button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 py-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Usuario</label>
                    <input type="text" placeholder="Zalo123" required value={registerData.UserName} onChange={(e) => setRegisterData({...registerData, UserName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Género</label>
                    <select value={registerData.genero} onChange={(e) => setRegisterData({...registerData, genero: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="M">Masculino</option><option value="F">Femenino</option><option value="O">Otro</option></select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nombre completo</label>
                  <input type="text" placeholder="Gonzalo Fletes" required value={registerData.NombreCompleto} onChange={(e) => setRegisterData({...registerData, NombreCompleto: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Correo electrónico</label>
                  <input type="email" placeholder="estudiante@ejemplo.com" required value={registerData.email} onChange={(e) => setRegisterData({...registerData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Contraseña</label>
                    <input type="password" placeholder="••••••••" required value={registerData.password} onChange={(e) => setRegisterData({...registerData, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nacimiento</label>
                    <input type="date" required value={registerData.fechanac} onChange={(e) => setRegisterData({...registerData, fechanac: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Foto de perfil</label>
                  <input type="file" accept="image/*" onChange={(e) => setRegisterData({...registerData, fotoruta: e.target.files[0]})} className="w-full text-xs text-gray-400 cursor-pointer" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-100 transition-all disabled:opacity-50">{loading ? 'Procesando...' : 'Crear cuenta gratis'}</button>
              </form>
            )}
          </div>
        </div>
        <div className="text-center mt-8"><Link to="/" className="text-gray-400 hover:text-indigo-500 text-sm font-medium transition-colors">← Volver al inicio</Link></div>
      </div>
    </div>
  );
};

export default Login;
