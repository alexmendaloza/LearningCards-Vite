import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, CreditCard, Sparkles } from 'lucide-react';
import api from '../api/axios';

export { default as AdminUsersPage } from './admin/GestionUsuarios';
export { default as AdminMazosPage } from './admin/ModeracionMazos';
export { default as AdminDashboardPage } from './admin/AdminHomeDashboard';
export { default as AdminVentasPage } from './admin/ReporteGlobalAdmin';
export { default as StudyPage } from './study/EstudioTarjetas';
export { default as MarketplacePage } from './marketplace/MarketplaceListado';
export { default as MarketplaceDetailPage } from './marketplace/MazoDetalle';
export { default as PaymentPage } from './marketplace/PagoMazo';

const empty = 'Sin descripcion';

// Convierte cualquier valor numérico a una cadena monetaria con dos decimales.
const money = (value) => `$${Number(value || 0).toFixed(2)}`;
// Formatea una fecha corta con configuración regional mexicana.
const shortDate = (value) => (value ? new Date(value).toLocaleDateString('es-MX') : '');
// Normaliza fechas para usarlas en controles tipo date y envíos al backend.
const dateValue = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Genera iniciales a partir del nombre completo del usuario.
const initials = (name = 'U') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
// Resuelve rutas de imágenes locales o absolutas para recursos subidos.
const storageUrl = (path) => path ? (String(path).startsWith('http') ? path : `/storage/${path}`) : '';

// Lee una imagen seleccionada por el usuario y la convierte en base64 con metadatos básicos.
const readImageFile = (file) => new Promise((resolve, reject) => {
  if (!file) {
    resolve({});
    return;
  }
  const reader = new FileReader();
  reader.onload = () => resolve({ fotorutaData: reader.result, fotorutaName: file.name });
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// Muestra mensajes de error compactos cuando el backend o la UI reportan un problema.
const ErrorBox = ({ message }) => message ? (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
    {message}
  </div>
) : null;

// Presenta alertas informativas o de éxito con estilo reutilizable.
const Alert = ({ children, tone = 'green' }) => (
  <div className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${
    tone === 'green' ? 'border-green-200 bg-green-50 text-green-800' : 'border-blue-200 bg-blue-50 text-blue-800'
  }`}>
    {children}
  </div>
);

// Renderiza una vista genérica de carga para operaciones asíncronas.
const Loading = ({ text = 'Cargando...' }) => (
  <div className="py-16 text-center text-sm font-semibold text-slate-500 animate-pulse">{text}</div>
);

const useResource = (loader, deps = []) => {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: '' }));
    loader()
      .then((data) => active && setState({ loading: false, error: '', data }))
      .catch((error) => active && setState({ loading: false, error: error.response?.data?.message || error.message, data: null }));
    return () => { active = false; };
  }, deps);
  return state;
};

/**
 * Componente de página para inicio de sesión y registro de usuarios.
 * Maneja ambos formularios mediante un sistema de pestañas y llamadas a la API.
 */
export const LoginPage = ({ initialTab = 'login', onAuth }) => {
  const navigate = useNavigate();
  const authToggleRef = useRef(null);
  // Estado principal de la pantalla de autenticación para alternar entre vistas.
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [authErrors, setAuthErrors] = useState({});
  const [login, setLogin] = useState({ email: '', password: '' });
  // Datos del formulario de registro.
  const [register, setRegister] = useState({
    UserName: '',
    NombreCompleto: '',
    email: '',
    password: '',
    fechanac: '',
    genero: 'M',
    fotorutaData: '',
    fotorutaName: '',
  });

  // Estados específicos para recuperación de contraseña
  const [recoverPhase, setRecoverPhase] = useState('request'); // 'request' o 'reset'
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverCode, setRecoverCode] = useState('');
  const [recoverPassword, setRecoverPassword] = useState('');

  // Sincroniza la pestaña mostrada con la pestaña solicitada por la ruta.
  useEffect(() => setTab(initialTab), [initialTab]);

  // Aplica la ambientación visual propia de las pantallas de acceso.
  useEffect(() => {
    document.body.classList.add('auth-screen');
    try {
      document.body.classList.toggle('dark-theme', localStorage.getItem('novalearn-theme') === 'dark');
    } catch {
      document.body.classList.remove('dark-theme');
    }
    return () => document.body.classList.remove('auth-screen');
  }, []);

  // Cambia de pestaña y reinicia los errores visibles para el usuario.
  const selectTab = (nextTab) => {
    setTab(nextTab);
    setError('');
    setSuccessMsg('');
    setAuthErrors({});
    // Si salimos de recover, reiniciamos la fase de recuperación
    if (nextTab !== 'recover') {
      setRecoverPhase('request');
      setRecoverEmail('');
      setRecoverCode('');
      setRecoverPassword('');
    }
    const tabs = document.getElementById('auth-tabs');
    if (tabs) {
      tabs.classList.remove('slider-moving');
      void tabs.offsetWidth;
      tabs.classList.add('slider-moving');
      window.setTimeout(() => tabs.classList.remove('slider-moving'), 700);
    }
  };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const namePattern = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;
  const authErrorClass = 'text-red-500 text-xs mt-1 block font-semibold';

  const updateAuthError = (field, message) => {
    setAuthErrors((current) => ({ ...current, [field]: message }));
  };

  const clearAuthError = (field) => {
    setAuthErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleLoginEmailChange = (value) => {
    const nextValue = value.slice(0, 60);
    setLogin({ ...login, email: nextValue });
    if (nextValue.trim()) clearAuthError('loginGeneral');
  };

  const handleLoginPasswordChange = (value) => {
    const nextValue = value.slice(0, 25);
    setLogin({ ...login, password: nextValue });
    if (nextValue) clearAuthError('loginGeneral');
  };

  const handleRegisterUsernameChange = (value) => {
    const nextValue = value.slice(0, 20);
    setRegister({ ...register, UserName: nextValue });
    if (nextValue.trim()) clearAuthError('UserName');
  };

  const handleRegisterNameChange = (value) => {
    const nextValue = value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '').slice(0, 50);
    setRegister({ ...register, NombreCompleto: nextValue });
    if (!nextValue.trim() || !namePattern.test(nextValue.trim())) {
      updateAuthError('NombreCompleto', 'Por favor, ingresa un nombre válido (solo letras y espacios).');
    } else {
      clearAuthError('NombreCompleto');
    }
  };

  const handleRegisterEmailChange = (value) => {
    const nextValue = value.slice(0, 60);
    setRegister({ ...register, email: nextValue });
    if (!nextValue.trim() || emailPattern.test(nextValue.trim())) clearAuthError('email');
  };

  const handleRegisterPasswordChange = (value) => {
    const nextValue = value.slice(0, 25);
    setRegister({ ...register, password: nextValue });
    if (nextValue && nextValue.length < 6) {
      updateAuthError('password', 'La contraseña debe tener entre 6 y 25 caracteres.');
    } else {
      clearAuthError('password');
    }
  };

  const validateRegisterField = (field) => {
    if (field === 'UserName') {
      if (!register.UserName.trim()) {
        updateAuthError('UserName', 'El nombre de usuario es obligatorio.');
        return false;
      }
      clearAuthError('UserName');
    }
    if (field === 'NombreCompleto') {
      const value = register.NombreCompleto.trim();
      if (!value || !namePattern.test(value)) {
        updateAuthError('NombreCompleto', 'Por favor, ingresa un nombre válido (solo letras y espacios).');
        return false;
      }
      clearAuthError('NombreCompleto');
    }
    if (field === 'email') {
      if (!emailPattern.test(register.email.trim())) {
        updateAuthError('email', 'Introduce una dirección de correo electrónico válida.');
        return false;
      }
      clearAuthError('email');
    }
    if (field === 'password') {
      if (register.password.length < 6 || register.password.length > 25) {
        updateAuthError('password', 'La contraseña debe tener entre 6 y 25 caracteres.');
        return false;
      }
      clearAuthError('password');
    }
    return true;
  };

  const validateRegisterForm = () => ['UserName', 'NombreCompleto', 'email', 'password'].every(validateRegisterField);

  // Permite cambiar el tema del formulario sin afectar la lógica de autenticación.
  const toggleAuthTheme = () => {
    const nextIsDark = !document.body.classList.contains('dark-theme');
    const toggle = authToggleRef.current;
    if (toggle) {
      toggle.classList.remove('theme-burst-day', 'theme-burst-night', 'theme-liquid-pop');
      void toggle.offsetWidth;
      toggle.classList.add(nextIsDark ? 'theme-burst-night' : 'theme-burst-day', 'theme-liquid-pop');
      window.setTimeout(() => {
        toggle.classList.remove('theme-burst-day', 'theme-burst-night', 'theme-liquid-pop');
      }, 900);
    }
    document.body.classList.toggle('dark-theme', nextIsDark);
    try {
      localStorage.setItem('novalearn-theme', nextIsDark ? 'dark' : 'light');
    } catch {
      // Storage can be blocked in some browser modes.
    }
  };

  // Envía credenciales al backend y actualiza la sesión global al iniciar.
  const submitLogin = async (event) => {
    event.preventDefault();
    if (!login.email.trim() || !login.password) {
      updateAuthError('loginGeneral', 'Por favor, rellena todos los campos obligatorios.');
      return;
    }
    clearAuthError('loginGeneral');
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post('/login', login);
      onAuth(data.usuario);
      navigate('/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  // Registra una nueva cuenta y autentica automáticamente al usuario creado.
  const submitRegister = async (event) => {
    event.preventDefault();
    if (!validateRegisterForm()) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post('/register', register);
      onAuth(data.usuario);
      navigate('/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible registrar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const submitRecoverRequest = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post('/recover-password/request', { email: recoverEmail });
      setSuccessMsg(data.message);
      setRecoverPhase('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al solicitar código.');
    } finally {
      setLoading(false);
    }
  };

  const submitRecoverReset = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post('/recover-password/reset', {
        email: recoverEmail,
        code: recoverCode,
        newPassword: recoverPassword,
      });
      setSuccessMsg(data.message);
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        selectTab('login');
        setRecoverPhase('request');
        setRecoverEmail('');
        setRecoverCode('');
        setRecoverPassword('');
        setSuccessMsg('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <Link to="/" className="auth-back-link">
        <span aria-hidden="true">&larr;</span>
        Volver al inicio
      </Link>

      <button
        type="button"
        ref={authToggleRef}
        id="authThemeToggle"
        className="auth-theme-toggle"
        aria-label="Cambiar tema"
        aria-pressed={document.body.classList.contains('dark-theme') ? 'true' : 'false'}
        onClick={toggleAuthTheme}
      >
        <span className="auth-theme-icon auth-theme-sun" aria-hidden="true">&#9728;</span>
        <span className="auth-theme-icon auth-theme-moon" aria-hidden="true">&#9790;</span>
        <span className="auth-theme-knob" aria-hidden="true" />
      </button>

      <div className="my-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="auth-kicker text-sm italic">Bienvenido de vuelta. Continua tu camino de aprendizaje.</p>
        </div>

        <div className="auth-card flex max-h-[80vh] flex-col overflow-hidden rounded-3xl shadow-2xl">
          <div className="p-8 pb-4">
            <h1 className="auth-title mb-1 text-3xl font-black tracking-tight">
              {tab === 'recover' ? 'Recuperar Cuenta' : 'Comenzar'}
            </h1>
            <p className="auth-subtitle mb-6 mt-1 text-sm">
              {tab === 'recover' 
                ? 'Restablece tu contraseña usando tu correo electrónico.' 
                : 'Inicia sesion o crea una cuenta nueva'}
            </p>
            {tab !== 'recover' ? (
              <div id="auth-tabs" className={`auth-tabs mb-4 ${tab === 'register' ? 'register-active' : ''}`} role="tablist" aria-label="Acceso a cuenta">
                <span className="auth-tab-slider" aria-hidden="true" />
                <button type="button" className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => selectTab('login')} role="tab" aria-selected={tab === 'login'}>
                  Iniciar sesion
                </button>
                <button type="button" className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => selectTab('register')} role="tab" aria-selected={tab === 'register'}>
                  Registrarse
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => selectTab('login')}
                  className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors bg-transparent border-none cursor-pointer"
                >
                  &larr; Volver al inicio de sesión
                </button>
              </div>
            )}
            {successMsg && (
              <div className="mb-4">
                <Alert tone="green">{successMsg}</Alert>
              </div>
            )}
            <ErrorBox message={error} />
          </div>

          <div className="custom-scrollbar overflow-y-auto px-8 pb-8">
            {tab === 'login' && (
              <form className="space-y-4 py-2" onSubmit={submitLogin}>
                <Field label="Correo electronico" type="text" value={login.email} onChange={handleLoginEmailChange} className="auth-field w-full rounded-xl px-4 py-3 text-sm outline-none transition" />
                <Field label="Contrasena" type="password" value={login.password} onChange={handleLoginPasswordChange} className="auth-field w-full rounded-xl px-4 py-3 text-sm outline-none transition" />
                <div className="flex items-center justify-between text-xs">
                  <label className="group flex cursor-pointer items-center gap-2">
                    <input type="checkbox" className="auth-checkbox rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="auth-muted transition-colors group-hover:text-indigo-600">Recordarme</span>
                  </label>
                  <a href="#" onClick={(e) => { e.preventDefault(); selectTab('recover'); }} className="auth-help-link font-semibold transition-colors">¿Olvidaste tu contraseña?</a>
                </div>
                <button disabled={loading} className="auth-submit w-full rounded-xl py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60">
                  {loading ? 'Cargando...' : 'Iniciar sesion'}
                </button>
                {authErrors.loginGeneral && <span className={authErrorClass}>{authErrors.loginGeneral}</span>}
              </form>
            )}
            
            {tab === 'register' && (
              <form className="space-y-4 py-2" onSubmit={submitRegister}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Usuario" value={register.UserName} onChange={handleRegisterUsernameChange} onBlur={() => validateRegisterField('UserName')} error={authErrors.UserName} errorClassName={authErrorClass} required className="auth-field w-full rounded-xl px-4 py-2.5 text-sm outline-none transition" />
                  <Select label="Genero" value={register.genero} onChange={(value) => setRegister({ ...register, genero: value })} options={[['M', 'Masculino'], ['F', 'Femenino'], ['O', 'Otro']]} className="auth-field w-full rounded-xl px-4 py-2.5 text-sm outline-none transition" />
                </div>
                <Field label="Nombre completo" value={register.NombreCompleto} onChange={handleRegisterNameChange} onBlur={() => validateRegisterField('NombreCompleto')} error={authErrors.NombreCompleto} errorClassName={authErrorClass} required className="auth-field w-full rounded-xl px-4 py-2.5 text-sm outline-none transition" />
                <Field label="Correo electronico" type="email" value={register.email} onChange={handleRegisterEmailChange} onBlur={() => validateRegisterField('email')} error={authErrors.email} errorClassName={authErrorClass} required className="auth-field w-full rounded-xl px-4 py-2.5 text-sm outline-none transition" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Contrasena" type="password" value={register.password} onChange={handleRegisterPasswordChange} onBlur={() => validateRegisterField('password')} error={authErrors.password} errorClassName={authErrorClass} required className="auth-field w-full rounded-xl px-4 py-2.5 text-sm outline-none transition" />
                  <Field label="Nacimiento" type="date" value={register.fechanac} onChange={(value) => setRegister({ ...register, fechanac: value })} max={new Date().toISOString().split('T')[0]} required className="auth-field w-full rounded-xl px-4 py-2.5 text-sm outline-none transition" />
                </div>
                <label className="block">
                  <span className="auth-label mb-1 block text-xs font-black uppercase tracking-wider">Foto de perfil</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={async (event) => setRegister({ ...register, ...(await readImageFile(event.target.files?.[0])) })}
                    className="auth-file w-full cursor-pointer text-xs transition-all"
                  />
                </label>
                <div className="flex items-start gap-2 pt-2">
                  <input type="checkbox" required className="auth-checkbox mt-1 rounded text-indigo-600" />
                  <span className="auth-muted text-[10px] leading-tight">Acepto los Terminos de Servicio y la Politica de Privacidad de LearningCards.</span>
                </div>
                <button disabled={loading} className="auth-submit w-full rounded-xl py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60">
                  {loading ? 'Procesando...' : 'Crear cuenta gratis'}
                </button>
              </form>
            )}

            {tab === 'recover' && (
              recoverPhase === 'request' ? (
                <form className="space-y-4 py-2" onSubmit={submitRecoverRequest}>
                  <Field
                    label="Correo electrónico"
                    type="email"
                    value={recoverEmail}
                    onChange={setRecoverEmail}
                    required
                    placeholder="estudiante@ejemplo.com"
                    className="auth-field w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                  />
                  <button
                    disabled={loading}
                    className="auth-submit w-full rounded-xl py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? 'Enviando...' : 'Enviar código de recuperación'}
                  </button>
                </form>
              ) : (
                <form className="space-y-4 py-2" onSubmit={submitRecoverReset}>
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs font-bold text-indigo-700 leading-relaxed mb-2">
                    Enviamos un código temporal de 6 dígitos a <strong>{recoverEmail}</strong>. Revisa tu bandeja de entrada.
                  </div>
                  <Field
                    label="Código de verificación"
                    type="text"
                    value={recoverCode}
                    onChange={setRecoverCode}
                    required
                    placeholder="123456"
                    maxLength={10}
                    className="auth-field w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                  />
                  <Field
                    label="Nueva Contraseña"
                    type="password"
                    value={recoverPassword}
                    onChange={setRecoverPassword}
                    required
                    placeholder="•••••••• (mínimo 6 caracteres)"
                    className="auth-field w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                  />
                  <button
                    disabled={loading}
                    className="auth-submit w-full rounded-xl py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
                  </button>
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoverPhase('request');
                        setSuccessMsg('');
                        setError('');
                      }}
                      className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors bg-transparent border-none cursor-pointer"
                    >
                      ¿No recibiste el código? Solicitar otro
                    </button>
                  </div>
                </form>
              )
            )}
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link to="/" className="auth-footer-link text-sm font-medium transition-colors">Necesitas ayuda? Contactanos</Link>
        </div>
      </div>
    </div>
  );
};

// Campo reutilizable para entradas de texto simples dentro de formularios.
const Field = ({ label, value, onChange, type = 'text', required = false, placeholder = '', error = '', errorClassName = 'text-red-500 text-xs mt-1 block', ...props }) => (
  <label className="block">
    <span className="auth-label mb-1 block text-xs font-black uppercase tracking-wider">{label}</span>
    <input
      type={type}
      value={value ?? ''}
      required={required}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-400"
      {...props}
    />
    {error && <span className={errorClassName}>{error}</span>}
  </label>
);

// Área de texto reutilizable para contenido más largo o descriptivo.
const TextArea = ({ label, value, onChange, placeholder = '', required = false, ...props }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-700">{label}</span>
    <textarea
      value={value ?? ''}
      required={required}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-28 w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-400"
      {...props}
    />
  </label>
);

// Selector reutilizable para catálogos o listas de opciones.
const Select = ({ label, value, onChange, options, required = false, ...props }) => (
  <label className="block">
    <span className="auth-label mb-1 block text-xs font-black uppercase tracking-wider">{label}</span>
    <select required={required} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-400" {...props}>
      {options.map((option) => Array.isArray(option)
        ? <option key={option[0]} value={option[0]}>{option[1]}</option>
        : <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
);

/**
 * Componente de Dashboard principal del usuario.
 * Muestra estadísticas, rachas, y la lista de mazos creados o adquiridos.
 */
export const DashboardPage = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);
  const [form, setForm] = useState({
    search: params.get('search') || '',
    origin: params.get('origin') || '',
    cards_count: params.get('cards_count') || '',
    category: params.get('category') || '',
  });

  const query = params.toString();
  const { loading, error, data } = useResource(async () => {
    const { data: payload } = await api.get(`/user/dashboard${query ? `?${query}` : ''}`);
    return payload;
  }, [query]);

  const applyFilters = (event) => {
    event.preventDefault();
    const next = {};
    Object.entries(form).forEach(([key, value]) => { if (value) next[key] = value; });
    setParams(next);
    setFilterOpen(false);
  };

  const updateFilter = (key, value, submit = false) => {
    const nextForm = { ...form, [key]: value };
    setForm(nextForm);
    if (submit) {
      const next = {};
      Object.entries(nextForm).forEach(([name, item]) => { if (item) next[name] = item; });
      setParams(next);
    }
  };

  if (loading) return <Loading text="Cargando dashboard..." />;
  if (error) return <ErrorBox message={error} />;

  const usuario = data.usuario || {};
  const saludo = usuario.genero === 'F' ? 'Bienvenida' : 'Bienvenido';
  const hasFilters = ['search', 'origin', 'cards_count', 'category'].some((key) => params.get(key));

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold md:text-4xl">
          ¡{saludo} de vuelta, {usuario.NombreCompleto || 'Usuario'}! 👋
        </h1>
        <p className="text-gray-600">Continuemos tu camino de aprendizaje</p>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
        <StreakCard days={usuario.rachaActual || 0} level={usuario.nombreNivel || 'Novato'} />
        <StudiedCard value={data.totalEstudiadas || 0} />
        <PrecisionCard value={data.precision || 0} />
      </div>

      <div className="flex flex-col items-start gap-10 md:flex-row">
        <section className="w-full space-y-6 md:w-[70%]">
          <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <h2 className="shrink-0 text-2xl font-black tracking-tight text-slate-800">Mis Mazos</h2>

            <div className="relative w-full max-w-2xl flex-1">
              <form action="/user/dashboard" onSubmit={applyFilters} className="relative">
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-indigo-500">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input
                    type="text"
                    name="search"
                    value={form.search}
                    onChange={(event) => updateFilter('search', event.target.value)}
                    placeholder="Buscar mazos..."
                    className="w-full rounded-full border border-slate-200 bg-white/70 py-3 pl-11 pr-24 text-sm shadow-sm outline-none backdrop-blur-sm transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ search: '', origin: '', cards_count: '', category: '' });
                          setParams({});
                        }}
                        className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Limpiar todo"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setFilterOpen(!filterOpen)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-slate-500 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 ${filterOpen ? 'border-indigo-100 bg-indigo-50 text-indigo-600' : 'border-transparent'}`}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    </button>
                  </div>
                </div>

                {filterOpen && (
                  <div className="absolute right-0 z-50 mt-3 w-full overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl transition duration-200 sm:w-80">
                    <div className="space-y-5">
                      <FilterSelect
                        label="Origen del Mazo"
                        value={form.origin}
                        onChange={(value) => updateFilter('origin', value, true)}
                        options={[['', 'Todos los orígenes'], ['mine', 'Mis Mazos'], ['marketplace', 'Marketplace']]}
                      />
                      <FilterSelect
                        label="Cantidad de Tarjetas"
                        value={form.cards_count}
                        onChange={(value) => updateFilter('cards_count', value, true)}
                        options={[['', 'Cualquier tamaño'], ['small', 'Pequeño (1-9)'], ['medium', 'Mediano (10-50)'], ['large', 'Grande (> 50)']]}
                      />
                      <FilterSelect
                        label="Categoría"
                        value={form.category}
                        onChange={(value) => updateFilter('category', value, true)}
                        options={[['', 'Todas las categorías'], ...(data.categorias || []).map((category) => [category, category])]}
                      />
                      <button type="submit" className="w-full rounded-xl bg-slate-900 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-100 transition-colors hover:bg-indigo-600">
                        Aplicar Filtros
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="shrink-0">
              <Link to="/user/mazos/create" className="group">
                <button className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-100 transition-all duration-300 hover:scale-105 hover:shadow-purple-300 active:scale-95 lg:w-auto">
                  <span className="text-xl leading-none transition-transform duration-300 group-hover:rotate-90">+</span>
                  Nuevo Mazo
                </button>
              </Link>
            </div>
          </div>

          {data.mazos?.length ? data.mazos.map((mazo) => (
            <div key={mazo.IDMazo} className="dashboard-deck-card group relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90" />
              <div className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors duration-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 sm:flex">
                    <DeckIcon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="mb-0.5 truncate text-xl font-extrabold leading-tight text-slate-900">{mazo.titulo}</h3>
                    <p className="mb-2 truncate text-sm font-medium text-slate-500">{mazo.descripcion || empty}</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-indigo-100/50 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-500">{mazo.tarjetas_count || 0} Tarjetas</span>
                      {Number(mazo.original) === 0 && <span className="rounded-full border border-amber-100/50 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">Copia</span>}
                      {Number(mazo.publico) === 1 && (
                        <span className="flex items-center gap-1 rounded-full border border-emerald-100/50 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                          <CheckIcon className="h-3 w-3" />
                          Publicado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1 sm:flex-row">
                    <button onClick={() => navigate(`/user/mazos/${mazo.IDMazo}/edit`)} className="dashboard-edit-btn rounded-full border border-indigo-100 bg-indigo-50 p-2 text-indigo-600 transition-all hover:bg-indigo-100 active:scale-90" title="Editar">
                      <EditIcon className="h-5 w-5" />
                    </button>
                    {Number(mazo.original) === 1 && (
                      <button
                        onClick={() => navigate(`/user/mazos/${mazo.IDMazo}/publicar`)}
                        className={`dashboard-share-btn rounded-full p-2 transition-all active:scale-90 ${Number(mazo.publico) === 1 ? 'is-public bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'is-private bg-orange-50 text-orange-500 hover:bg-orange-100'}`}
                        title={Number(mazo.publico) === 1 ? 'Editar publicación' : 'Publicar'}
                      >
                        <ShareIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <button onClick={() => navigate(`/user/estudiar/${mazo.IDMazo}`)} className="dashboard-study-btn flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-md transition-all hover:bg-indigo-600 hover:shadow-indigo-200 active:scale-95">
                    <PlayIcon className="h-4 w-4" />
                    Estudiar
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-[2rem] border border-slate-100 bg-white/80 p-16 text-center shadow-sm backdrop-blur-md">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-4xl shadow-inner">🔍</div>
              {hasFilters ? (
                <>
                  <h3 className="mb-2 text-xl font-bold text-slate-800">Sin coincidencias</h3>
                  <p className="mx-auto mb-8 max-w-xs text-slate-500">No se encontraron mazos con esos criterios. Intenta ajustar los filtros.</p>
                  <button onClick={() => setParams({})} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:shadow-indigo-100">
                    <CloseIcon className="h-4 w-4" />
                    Limpiar todos los filtros
                  </button>
                </>
              ) : (
                <>
                  <h3 className="mb-2 text-xl font-bold text-slate-800">Tu colección está vacía</h3>
                  <p className="mx-auto mb-8 max-w-xs text-slate-500">Aún no tienes mazos creados. ¡Comienza tu aventura de aprendizaje ahora!</p>
                  <Link to="/user/mazos/create" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-purple-100 transition-all hover:scale-105 active:scale-95">
                    <span className="text-lg">+</span>
                    Crear tu primer mazo
                  </Link>
                </>
              )}
            </div>
          )}
        </section>

        <aside className="w-full space-y-6 md:w-[30%]">
          <div className="glass-stat group rounded-3xl p-4 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black tracking-tight text-gray-800">🏆 Logros</h3>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <SparkIcon className="h-5 w-5" />
              </div>
            </div>
            {usuario.nombreNivel ? (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-lg">🔥</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{usuario.nombreNivel}</p>
                  <p className="text-xs text-gray-500">Racha de {usuario.rachaActual || 0} días</p>
                </div>
              </div>
            ) : (
              <p className="mb-4 text-sm text-gray-500">Completa tu primera sesión de estudio para desbloquear logros.</p>
            )}
              <Link to="/user/reportes" className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all duration-300 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600">
              Reporte Completo
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="dashboard-marketplace-card glass-stat group rounded-3xl p-4 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-black tracking-tight text-gray-800">
                <BagIcon className="h-5 w-5 text-indigo-500" />
                Populares
              </h3>
              <Link to="/user/marketplace" className="dashboard-marketplace-all text-[9px] font-black uppercase tracking-widest text-indigo-600 transition-colors hover:text-indigo-800">Ver todo</Link>
            </div>
            <div className="space-y-4">
              {data.mazosPopulares?.length ? data.mazosPopulares.map((mazo) => (
                <div key={mazo.id_Publ} className="dashboard-marketplace-item group/item relative flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-indigo-100 hover:bg-indigo-50/50">
                  <div className="dashboard-marketplace-thumb relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold text-transparent shadow-sm transition-transform group-hover/item:scale-110">
                    {(mazo.titulo || 'M').slice(0, 1)} 📚
                  </div>
                  <span className="pointer-events-none absolute left-3 flex h-9 w-9 items-center justify-center text-xs font-bold text-white">
                    {(mazo.titulo || 'M').slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-extrabold text-gray-900 transition-colors group-hover/item:text-indigo-700">{mazo.titulo}</h4>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-500">{mazo.tarjetas_count} tarjetas</span>
                    </div>
                  </div>
                  <Link to={`/user/marketplace/${mazo.id_Publ}`} className="dashboard-marketplace-plus rounded-full bg-slate-50 p-2 text-slate-400 shadow-sm transition-all hover:scale-110 hover:bg-indigo-600 hover:text-white">
                    <PlusIcon className="h-4 w-4" />
                  </Link>
                </div>
              )) : <p className="py-6 text-center text-xs italic text-gray-400">No hay mazos publicos disponibles.</p>}
            </div>
            <div className="dashboard-marketplace-tip mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
              <p className="text-[10px] text-gray-500">¿Sabías que puedes publicar tus propios mazos para ayudar a otros?</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, options }) => (
  <div className="space-y-2">
    <label className="text-xs font-black uppercase tracking-widest text-slate-800">{label}</label>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border-none bg-slate-50 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20">
      {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
    </select>
  </div>
);

const StreakCard = ({ days, level }) => (
  <div className={`group relative rounded-[2rem] bg-gradient-to-br from-orange-500 to-red-600 p-7 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20 ${days >= 5 ? 'shadow-[0_0_25px_rgba(249,115,22,0.4)]' : ''}`}>
    <div className="mb-4 flex items-center justify-between">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
        <FlameIcon className="h-8 w-8 animate-flame text-white" />
      </div>
      <span className="rounded-full border border-white/20 bg-black/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">{level}</span>
    </div>
    <div className="space-y-1">
      <h3 className="text-4xl font-black italic tracking-tighter text-white">{days} <span className="text-xl font-bold not-italic text-orange-100">días</span></h3>
      <p className="text-sm font-medium text-orange-100/80">Racha de estudio activa</p>
    </div>
  </div>
);

const StudiedCard = ({ value }) => (
  <div className="glass-stat group rounded-[2rem] p-7 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/5">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-transform group-hover:rotate-12">
        <DeckIcon className="h-8 w-8" />
      </div>
    </div>
    <div className="space-y-1">
      <h3 className="text-4xl font-black tracking-tighter text-gray-800"><AnimatedNumber value={value} /></h3>
      <p className="text-sm font-medium text-gray-400">Tarjetas estudiadas</p>
    </div>
  </div>
);

const PrecisionCard = ({ value }) => (
  <div className="glass-stat group rounded-[2rem] p-7 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/5">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
        <TargetIcon className="h-8 w-8" />
      </div>
    </div>
    <div className="space-y-4">
      <div>
        <h3 className="text-4xl font-black tracking-tighter text-gray-800">{value}<span className="text-2xl text-emerald-500">%</span></h3>
        <p className="text-sm font-medium text-gray-400">Precisión promedio</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full border border-emerald-100/50 bg-emerald-50 p-[1px]">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-[1.5s] ease-out" style={{ width: `${value}%` }} />
      </div>
    </div>
  </div>
);

const AnimatedNumber = ({ value }) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let frame;
    let start;
    const duration = 800;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setShown(Math.floor(progress * Number(value || 0)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    const timer = setTimeout(() => { frame = requestAnimationFrame(step); }, 200);
    return () => {
      clearTimeout(timer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value]);
  return shown;
};

const DeckIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const TargetIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><circle cx="12" cy="12" r="6" strokeWidth="2" /><circle cx="12" cy="12" r="2" strokeWidth="2" fill="currentColor" /></svg>;
const FlameIcon = ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M17.5,12c0,3.04-2.46,5.5-5.5,5.5s-5.5-2.46-5.5-5.5c0-1.03,0.28-2,0.77-2.83c0.14-0.24,0.11-0.54-0.08-0.74 c-0.22-0.23-0.58-0.24-0.82-0.04C5.54,9.08,5,10.48,5,12c0,3.87,3.13,7,7,7s7-3.13,7-7c0-1.91-0.76-3.65-2-4.93 c-0.19-0.2-0.52-0.22-0.73-0.03c-0.21,0.19-0.25,0.51-0.08,0.74C16.92,8.87,17.5,10.37,17.5,12z" /><path d="M12,3c0,0-3,3.5-3,6.5c0,1.66,1.34,3,3,3s3-1.34,3-3C15,6.5,12,3,12,3z" /></svg>;
const EditIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const ShareIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
const PlayIcon = ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const BagIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const PlusIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const CloseIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const SearchIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const UserMiniIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CheckMarkIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>;
const CheckIcon = ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const SparkIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>;
const ArrowRightIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;

/**
 * Componente para crear y editar mazos de tarjetas.
 * Permite gestionar el título, descripción y la lista interactiva de tarjetas (anverso, reverso, tipo).
 */
export const MazoFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [deck, setDeck] = useState({ titulo: '', descripcion: '' });
  const [cards, setCards] = useState([]);
  const [cardModal, setCardModal] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const parseOptions = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const normalizeCard = (card) => ({
    ...card,
    tipo: card.tipo || 'basica',
    opciones: parseOptions(card.opciones),
    frente: card.frente || '',
    reverso: card.reverso || '',
  });

  const parseCardOptions = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    let parsed = value;
    for (let i = 0; i < 5; i += 1) {
      if (typeof parsed !== 'string') break;
      try {
        parsed = JSON.parse(parsed);
      } catch {
        break;
      }
    }

    return Array.isArray(parsed) ? parsed : [];
  };

  const load = async () => {
    if (!editing) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/mazos/${id}`);
      setDeck({ titulo: data.mazo.titulo, descripcion: data.mazo.descripcion || '' });
      setCards(Array.isArray(data.tarjetas) ? data.tarjetas.map(normalizeCard) : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar los datos del mazo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch((err) => setError(err.response?.data?.message || err.message)); }, [id]);

  const saveDeck = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/mazos/${id}`, deck);
      } else {
        const { data } = await api.post('/mazos', deck);
        navigate(`/user/mazos/${data.IDMazo}/edit`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible guardar el mazo.');
    }
  };

  const saveCard = async (event) => {
    event.preventDefault();
    try {
      const options = parseOptions(cardModal.opciones);
      const payload = { ...cardModal, IDMazo: id };

      if (cardModal.tipo === 'opcion_multiple') {
        const validOptions = options.filter((o) => typeof o === 'string' && o.trim() !== '');
        if (validOptions.length < 2) {
          alert('Debes incluir al menos 2 opciones.');
          return;
        }
        if (!validOptions.includes(cardModal.reverso)) {
          alert('La respuesta correcta debe estar entre las opciones seleccionadas.');
          return;
        }
        payload.opciones = validOptions;
      } else {
        payload.opciones = null;
      }

      console.log('FRONTEND SENDING:', JSON.stringify(payload, null, 2));
      const res = await api.post('/tarjetas', payload);
      console.log('SERVER RESPONSE:', res.data);
      setCardModal(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar la tarjeta.');
    }
  };

  const deleteCard = async (cardId) => {
    await api.delete(`/tarjetas/${cardId}`);
    await load();
  };

  const deleteDeck = async () => {
    if (!confirm('Seguro que deseas eliminar este mazo?')) return;
    await api.delete(`/mazos/${id}`);
    navigate('/user/dashboard');
  };

  if (editing && loading) {
    return <div className="text-center text-white p-10">Cargando datos del mazo para edición...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <form onSubmit={saveDeck}>
        <div className="mb-8 mt-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{editing ? 'Editar Mazo' : 'Nuevo Mazo'}</h1>
          <button className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2 font-semibold text-white">Guardar mazo</button>
        </div>
        <ErrorBox message={error} />
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg">
          <Field label="Titulo" value={deck.titulo} onChange={(value) => setDeck({ ...deck, titulo: value })} required />
          <div className="mt-3">
            <TextArea label="Descripcion" value={deck.descripcion} onChange={(value) => setDeck({ ...deck, descripcion: value })} />
          </div>
        </div>
      </form>

      {editing && (
        <>
          <div className="mb-8 rounded-[2.5rem] border border-red-100 bg-red-50/50 p-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div>
                <h3 className="text-lg font-bold text-red-600">Zona de Peligro</h3>
                <p className="text-sm text-red-500/70">Una vez eliminado, no aparecera en tu coleccion ni en el marketplace.</p>
              </div>
              <button onClick={deleteDeck} className="rounded-2xl border border-red-200 bg-white px-6 py-3 font-bold text-red-600">Eliminar Mazo</button>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">FLASHCARDS</h2>
            <button onClick={() => setCardModal({ frente: '', reverso: '', tipo: 'basica', opciones: ['', '', '', ''] })} className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2 font-semibold text-white">+ Anadir tarjeta</button>
          </div>
          {cards.length ? cards.map((card, index) => {
            const opciones = parseOptions(card.opciones);
            return (
              <div key={card.IDTarjeta} className="group relative mb-3 rounded-2xl bg-white p-4 shadow">
                <div className="absolute -left-3 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm text-white">{index + 1}</div>
                <div className="ml-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[10px] font-black uppercase text-gray-400">Pregunta</div>
                    <div className="rounded-xl bg-gray-50 p-3">{card.frente}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] font-black uppercase text-purple-400">
                      {card.tipo === 'opcion_multiple' ? 'Respuesta Correcta' : 'Respuesta'}
                      <span className="ml-2 rounded bg-purple-100 px-1 text-[8px] text-purple-600">{(card.tipo || 'basica').toUpperCase()}</span>
                    </div>
                    <div className="rounded-xl bg-purple-50 p-3">{card.reverso}</div>
                    {card.tipo === 'opcion_multiple' && opciones.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {opciones.map((opt, i) => (
                          <span key={i} className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{opt}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute right-2 top-2 hidden gap-2 group-hover:flex">
                  <button onClick={() => setCardModal({ ...card, tipo: card.tipo || 'basica', opciones: opciones.length ? opciones : ['', '', '', ''] })} className="rounded-lg bg-gray-200 p-2 text-sm">Editar</button>
                  <button onClick={() => deleteCard(card.IDTarjeta)} className="rounded-lg bg-red-500 p-2 text-sm text-white">Eliminar</button>
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
              <p className="text-gray-500">Aun no hay tarjetas</p>
            </div>
          )}
        </>
      )}

      {cardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form onSubmit={saveCard} className="my-auto w-full max-w-lg rounded-2xl bg-white p-6">
            <h2 className="mb-1 text-2xl font-bold">{cardModal.IDTarjeta ? 'Editar tarjeta' : 'Anade nueva tarjeta'}</h2>
            <p className="mb-4 text-sm text-gray-500">Configura el tipo y contenido de tu tarjeta</p>

            <div className="mb-4">
              <Select
                label="Tipo de tarjeta"
                value={cardModal.tipo || 'basica'}
                onChange={(value) => setCardModal({ ...cardModal, tipo: value, opciones: value === 'opcion_multiple' ? (cardModal.opciones?.length ? cardModal.opciones : ['', '', '', '']) : null })}
                options={[
                  ['basica', 'Básica (Frente y Reverso)'],
                  ['opcion_multiple', 'Opción Múltiple'],
                  ['escritura', 'Escritura (Teclear respuesta)'],
                ]}
              />
            </div>

            <TextArea label={(cardModal.tipo || 'basica') === 'escritura' ? 'Pregunta / Enunciado' : 'Frente'} value={cardModal.frente} onChange={(value) => setCardModal({ ...cardModal, frente: value })} required />

            {(cardModal.tipo || 'basica') === 'opcion_multiple' ? (
              <div className="mt-4">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-700">Opciones y Respuesta Correcta</span>
                <div className="grid gap-2">
                  {(cardModal.opciones || []).map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={cardModal.reverso === opt && opt !== ''}
                        onChange={() => setCardModal({ ...cardModal, reverso: opt })}
                        className="mt-3"
                        disabled={opt === ''}
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          const newOpts = [...cardModal.opciones];
                          const oldOpt = newOpts[i];
                          newOpts[i] = newValue;
                          
                          const updates = { opciones: newOpts };
                          if (cardModal.reverso === oldOpt && oldOpt !== '') {
                            updates.reverso = newValue;
                          }
                          
                          setCardModal({ ...cardModal, ...updates });
                        }}
                        placeholder={`Opción ${i + 1}`}
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      {cardModal.opciones.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = cardModal.opciones.filter((_, idx) => idx !== i);
                            setCardModal({ ...cardModal, opciones: newOpts });
                          }}
                          className="text-red-400 hover:text-red-600"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {cardModal.opciones.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setCardModal({ ...cardModal, opciones: [...cardModal.opciones, ''] })}
                    className="mt-2 text-xs font-bold text-purple-600"
                  >
                    + Añadir opción
                  </button>
                )}
                <p className="mt-2 text-[10px] text-gray-400 italic">* Selecciona el círculo a la izquierda de la respuesta correcta.</p>
              </div>
            ) : (
              <div className="mt-2">
                <TextArea label={(cardModal.tipo || 'basica') === 'escritura' ? 'Respuesta Exacta' : 'Reverso'} value={cardModal.reverso} onChange={(value) => setCardModal({ ...cardModal, reverso: value })} required />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setCardModal(null)} className="rounded-xl border px-4 py-2">Cancelar</button>
              <button className="rounded-xl bg-purple-600 px-4 py-2 text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

/**
 * Componente de la sesión de estudio.
 * Presenta las tarjetas al usuario secuencialmente y evalúa sus respuestas
 * mediante un sistema de autoevaluación o coincidencia difusa (fuzzy match).
 */
export const PublishPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, data } = useResource(async () => (await api.get(`/mazos/${id}/publicar`)).data, [id]);
  const [form, setForm] = useState({ categoria: '', descripcion_publica: '', imagen_url: '', pago: '0', precio: '' });
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (data) {
      setForm({
        categoria: data.publicacion?.categoria || '',
        descripcion_publica: data.publicacion?.descripcion_publica || data.mazo.descripcion || '',
        imagen_url: data.publicacion?.imagen_url || '',
        pago: String(data.publicacion?.pago ?? 0),
        precio: data.publicacion?.precio || '',
      });
    }
  }, [data]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    try {
      await api.post(`/mazos/${id}/publicar`, form);
      navigate('/user/marketplace');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'No fue posible publicar el mazo.');
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const editing = Boolean(data.publicacion);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 px-4 py-10">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <div className="mb-1 flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <h1 className="text-3xl font-bold text-gray-900">{editing ? 'Editar publicación' : 'Publicar en Marketplace'}</h1>
          </div>
          <p className="ml-12 text-gray-500">
            Comparte tu mazo <span className="font-semibold text-indigo-600">{data.mazo.titulo}</span> con la comunidad
          </p>
        </div>
        <ErrorBox message={submitError} />
        <div className="mb-6 mt-4 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 text-2xl">📚</div>
          <div><div className="font-bold text-gray-800">{data.mazo.titulo}</div><div className="text-sm text-gray-400">{data.mazo.descripcion || empty}</div><div className="mt-0.5 text-xs text-gray-400">{data.tarjetas_count} tarjetas</div></div>
        </div>
        <form onSubmit={submit} className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <Select label="Categoría" required value={form.categoria} onChange={(value) => setForm({ ...form, categoria: value })} options={['', ...data.categorias].map((cat) => cat ? [cat, cat] : ['', 'Selecciona una categoría'])} />
          <TextArea
            label="Descripción para el Marketplace"
            value={form.descripcion_publica}
            onChange={(value) => setForm({ ...form, descripcion_publica: value })}
            placeholder="Describe qué aprenderán los usuarios con este mazo..."
            maxLength={500}
          />
          <Field
            label="URL de imagen de portada"
            type="url"
            value={form.imagen_url}
            onChange={(value) => setForm({ ...form, imagen_url: value })}
            placeholder="https://ejemplo.com/imagen.jpg"
            maxLength={300}
          />
          {form.imagen_url?.startsWith('http') && <img src={form.imagen_url} alt="Preview" className="h-28 w-full rounded-xl border border-gray-200 object-cover" />}
          <div>
            <span className="mb-3 block text-sm font-semibold text-gray-700">Tipo de precio <span className="text-red-500">*</span></span>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm({ ...form, pago: '0' })} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${form.pago === '0' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}><span className="text-3xl">🆓</span><span className="font-semibold text-gray-700">Gratis</span><span className="text-center text-xs text-gray-400">Cualquier usuario puede agregarlo sin costo</span></button>
              <button type="button" onClick={() => setForm({ ...form, pago: '1' })} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${form.pago === '1' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}><span className="text-3xl">💰</span><span className="font-semibold text-gray-700">De pago</span><span className="text-center text-xs text-gray-400">Establece un precio para tu mazo</span></button>
            </div>
          </div>
          {form.pago === '1' && <Field label="Precio (USD)" type="number" value={form.precio} onChange={(value) => setForm({ ...form, precio: value })} required step="0.01" min="0.01" max="999.99" placeholder="9.99" />}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/user/dashboard')} className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-semibold text-gray-600">Cancelar</button>
            <button className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-200">{editing ? '💾 Actualizar publicación' : '🚀 Publicar en Marketplace'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Página de configuración del perfil del usuario.
 * Permite cambiar nombre, contraseña y foto de perfil.
 */
export const ProfilePage = ({ onAuth }) => {
  const navigate = useNavigate();
  const { loading, error, data } = useResource(async () => (await api.get('/user/configuracion')).data, []);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (data?.usuario) {
      setForm({
        UserName: data.usuario.UserName || '',
        NombreCompleto: data.usuario.NombreCompleto || '',
        email: data.usuario.email || '',
        fechanac: dateValue(data.usuario.fechanac),
        genero: data.usuario.genero || 'M',
        fotoruta: data.usuario.fotoruta || '',
        fotorutaData: '',
        fotorutaName: '',
      });
    }
  }, [data]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const { data: payload } = await api.put('/user/configuracion', form);
      onAuth(payload.usuario);
      setMessage('Perfil actualizado correctamente.');
      setSubmitError('');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'No fue posible actualizar el perfil.');
    }
  };

  if (loading || !form) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageTitle title="Configuracion de Cuenta" subtitle="Administra tu informacion personal y presencia en la plataforma." />
      {message && <div className="mb-6"><Alert>{message}</Alert></div>}
      <ErrorBox message={submitError} />
      <form onSubmit={submit} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="space-y-8 p-8">
          <div className="flex flex-col items-center gap-8 border-b border-gray-100 pb-8 md:flex-row">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-indigo-100 text-4xl font-bold text-indigo-400 shadow-lg">
              {form.fotorutaData || form.fotoruta ? <img src={form.fotorutaData || storageUrl(form.fotoruta)} className="h-full w-full object-cover" alt="Perfil" /> : initials(form.NombreCompleto)}
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-bold text-gray-800">Foto de perfil</h3>
              <p className="mb-2 text-sm text-gray-500">JPG o PNG. Maximo 2MB.</p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={async (event) => setForm({ ...form, ...(await readImageFile(event.target.files?.[0])) })}
                className="mb-3 w-full text-xs text-gray-400"
              />
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">ID de Usuario: #{data.usuario.IDUsuario}</span>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Nombre de Usuario" value={form.UserName} onChange={(value) => setForm({ ...form, UserName: value })} />
            <Field label="Nombre Completo" value={form.NombreCompleto} onChange={(value) => setForm({ ...form, NombreCompleto: value })} />
            <Field label="Correo Electronico" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field label="Fecha de Nacimiento" type="date" value={form.fechanac} onChange={(value) => setForm({ ...form, fechanac: value })} />
            <Select label="Genero" value={form.genero} onChange={(value) => setForm({ ...form, genero: value })} options={[['M', 'Masculino'], ['F', 'Femenino'], ['O', 'Otro']]} />
          </div>
        </div>
        <div className="flex justify-end gap-4 border-t border-gray-100 bg-gray-50 p-8">
          <button type="button" onClick={() => navigate('/user/dashboard')} className="px-6 py-3 text-sm font-bold text-gray-500">Cancelar</button>
          <button className="rounded-xl bg-indigo-600 px-8 py-3 font-bold text-white shadow-lg shadow-indigo-100">Guardar Cambios</button>
        </div>
      </form>
    </div>
  );
};

/**
 * Página de inicio de sesión exclusiva para el panel de administradores.
 */
export const AdminLoginPage = ({ onAuth }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('admin-mode');
    return () => document.documentElement.classList.remove('admin-mode');
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/admin/login', form);
      onAuth(data.usuario);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas o sin permisos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center"><div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-xs font-medium uppercase tracking-wider text-slate-400">Panel Seguro</span></div></div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="mb-8 text-center"><div className="shield-pulse mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-800 text-violet-200">LC</div><h1 className="mb-1.5 text-2xl font-bold tracking-tight text-slate-100">Panel de Administracion</h1><p className="text-sm text-slate-500">LearningCards · NovaLearn</p></div>
          <ErrorBox message={error} />
          <form onSubmit={submit} className="mt-6 space-y-5">
            <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Correo electronico</span><input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500/70" /></label>
            <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Contrasena</span><input type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500/70" /></label>
            <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Verificando...' : 'Acceder al Panel'}</button>
          </form>
        </div>
        <Link to="/" className="mt-6 block text-center text-xs font-medium text-slate-600 hover:text-slate-400">Volver al sitio principal</Link>
      </div>
    </div>
  );
};

/**
 * Vista de detalle en administración para ver y gestionar las tarjetas de un mazo.
 */
export const AdminMazoDetailPage = () => {
  const { id } = useParams();
  const [refresh, setRefresh] = useState(0);
  const { loading, error, data } = useResource(async () => (await api.get(`/admin/mazos/${id}/tarjetas`)).data, [id, refresh]);
  const restore = async () => { await api.patch(`/admin/mazos/${id}/restore`); setRefresh((value) => value + 1); };
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  return (
    <div className="container mx-auto px-6 py-8">
      <Link to="/admin/mazos" className="mb-6 flex items-center gap-2 font-medium text-gray-400 hover:text-purple-600">← Volver al listado de mazos</Link>
      <div className="mb-10 text-center"><h1 className="mb-2 text-3xl font-black italic text-gray-900 md:text-4xl">"{data.mazo.titulo}"</h1><div className="mx-auto h-1 w-16 rounded-full bg-purple-500 opacity-50" /></div>
      <div className="mb-12 rounded-[2.5rem] border border-gray-100 bg-white p-10 text-center shadow-xl shadow-purple-100/30"><div className="flex flex-col items-center justify-center gap-8 md:flex-row md:gap-24"><InfoBlock label="Autor del Mazo" value={data.mazo.UserName} /><div className="hidden h-16 w-px bg-gray-100 md:block" /><InfoBlock label="Contenido" value={`${data.tarjetas.length} tarjetas`} /></div></div>
      <div className="mb-8 flex justify-center">{Number(data.mazo.enColeccion) === 0 ? <button onClick={restore} className="rounded-2xl bg-orange-500 px-8 py-3 font-black text-white shadow-lg">Recuperar Mazo</button> : <span className="rounded-full border border-green-100 bg-green-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-500">Este mazo esta activo en la coleccion del usuario</span>}</div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{data.tarjetas.map((card) => <div key={card.IDTarjeta} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm"><span className="rounded bg-gray-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-gray-400">Frente</span><p className="mt-3 text-lg font-bold leading-tight text-gray-800">{card.frente}</p><div className="my-5 h-px bg-gray-50" /><span className="rounded bg-purple-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-purple-400">Reverso</span><p className="mt-3 leading-relaxed text-gray-600">{card.reverso}</p></div>)}</div>
    </div>
  );
};


const InfoBlock = ({ label, value }) => <div><p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</p><p className="text-4xl font-extrabold tracking-tight text-purple-600 md:text-5xl">{value}</p></div>;
const AdminPage = ({ title, children }) => <div className="container mx-auto px-6 py-8"><h1 className="mb-8 text-3xl font-bold text-gray-800">{title}</h1><div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm">{children}</div></div>;
const Th = ({ children, align = 'left' }) => <th className={`px-6 py-4 text-${align} text-xs font-bold uppercase text-gray-400`}>{children}</th>;
const Td = ({ children, align = 'left', strong = false }) => <td className={`px-6 py-4 text-${align} ${strong ? 'font-bold text-gray-700' : 'text-gray-600'}`}>{children}</td>;

const Table = ({ headers, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead className="bg-gray-50"><tr>{headers.map((header) => <Th key={header}>{header}</Th>)}</tr></thead>
      <tbody className="divide-y divide-gray-50">{rows.map((row, index) => <tr key={index} className="hover:bg-gray-50/50">{row.map((cell, cellIndex) => <Td key={cellIndex} strong={cellIndex === 0}>{cell}</Td>)}</tr>)}</tbody>
    </table>
  </div>
);
