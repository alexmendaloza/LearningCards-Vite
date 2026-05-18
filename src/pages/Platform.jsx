import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BookOpen, CheckCircle2, CreditCard, LockKeyhole, Sparkles } from 'lucide-react';
import api from '../api/axios';

const empty = 'Sin descripcion';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const shortDate = (value) => (value ? new Date(value).toLocaleDateString('es-MX') : '');
const dateValue = (value) => (value ? String(value).slice(0, 10) : '');

const initials = (name = 'U') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
const storageUrl = (path) => path ? (String(path).startsWith('http') ? path : `/storage/${path}`) : '';

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

const ErrorBox = ({ message }) => message ? (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
    {message}
  </div>
) : null;

const Alert = ({ children, tone = 'green' }) => (
  <div className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${
    tone === 'green' ? 'border-green-200 bg-green-50 text-green-800' : 'border-blue-200 bg-blue-50 text-blue-800'
  }`}>
    {children}
  </div>
);

const Loading = ({ text = 'Cargando...' }) => (
  <div className="py-16 text-center text-sm font-semibold text-slate-500 animate-pulse">{text}</div>
);

const AcquisitionSuccessModal = ({ mode = 'gratis', deckTitle, creatorName, cardCount, onDashboard, onMarketplace }) => {
  const paid = mode === 'pago';
  const particles = [
    ['left-[9%] top-[16%]', 'bg-emerald-300', '0s'],
    ['left-[20%] top-[72%]', 'bg-indigo-300', '.15s'],
    ['left-[35%] top-[10%]', 'bg-fuchsia-300', '.3s'],
    ['left-[62%] top-[18%]', 'bg-amber-300', '.45s'],
    ['left-[78%] top-[76%]', 'bg-sky-300', '.6s'],
    ['left-[90%] top-[31%]', 'bg-purple-300', '.75s'],
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div className="success-burst pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map(([position, color, delay]) => (
          <span key={`${position}-${color}`} className={`success-particle absolute h-2.5 w-2.5 rounded-full ${position} ${color}`} style={{ animationDelay: delay }} />
        ))}
      </div>

      <div className="success-card relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-indigo-950/20">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-indigo-500 to-fuchsia-500" />
        <div className="px-7 pb-7 pt-9 text-center sm:px-9">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
            <div className="success-check-ring flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-200">
              <CheckCircle2 className="h-11 w-11" />
            </div>
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-600">
            <Sparkles className="h-3.5 w-3.5" />
            {paid ? 'Compra completada' : 'Descarga completada'}
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Mazo agregado exitosamente al dashboard
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
            {paid ? 'El pago simulado fue aprobado y tu copia ya quedo registrada.' : 'Tu mazo gratuito ya fue agregado a tu coleccion.'}
          </p>

          <div className="my-7 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
                <BookOpen className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-extrabold text-slate-900">{deckTitle}</h3>
                <p className="mt-0.5 truncate text-sm text-slate-500">por {creatorName || 'Desconocido'}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">{cardCount || 0} tarjetas</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <button onClick={onDashboard} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-200">
              Ir al Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={onMarketplace} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">
              Seguir explorando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PageTitle = ({ title, subtitle, action }) => (
  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const StarRow = ({ value = 0, size = 'w-4 h-4' }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg key={star} className={`${size} ${star <= Math.round(value) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
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

export const LoginPage = ({ initialTab = 'login', onAuth }) => {
  const navigate = useNavigate();
  const authToggleRef = useRef(null);
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [login, setLogin] = useState({ email: '', password: '' });
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

  useEffect(() => setTab(initialTab), [initialTab]);

  useEffect(() => {
    document.body.classList.add('auth-screen');
    try {
      document.body.classList.toggle('dark-theme', localStorage.getItem('novalearn-theme') === 'dark');
    } catch {
      document.body.classList.remove('dark-theme');
    }
    return () => document.body.classList.remove('auth-screen');
  }, []);

  const selectTab = (nextTab) => {
    setTab(nextTab);
    setError('');
    const tabs = document.getElementById('auth-tabs');
    if (tabs) {
      tabs.classList.remove('slider-moving');
      void tabs.offsetWidth;
      tabs.classList.add('slider-moving');
      window.setTimeout(() => tabs.classList.remove('slider-moving'), 700);
    }
  };

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

  const submitLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/login', login);
      onAuth(data.usuario);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/register', register);
      onAuth(data.usuario);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible registrar el usuario.');
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
            <h1 className="auth-title mb-1 text-3xl font-black tracking-tight">Comenzar</h1>
            <p className="auth-subtitle mb-6 mt-1 text-sm">Inicia sesion o crea una cuenta nueva</p>
            <div id="auth-tabs" className={`auth-tabs mb-4 ${tab === 'register' ? 'register-active' : ''}`} role="tablist" aria-label="Acceso a cuenta">
              <span className="auth-tab-slider" aria-hidden="true" />
              <button type="button" className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => selectTab('login')} role="tab" aria-selected={tab === 'login'}>
                Iniciar sesion
              </button>
              <button type="button" className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => selectTab('register')} role="tab" aria-selected={tab === 'register'}>
                Registrarse
              </button>
            </div>
            <ErrorBox message={error} />
          </div>

          <div className="custom-scrollbar overflow-y-auto px-8 pb-8">
            {tab === 'login' ? (
              <form className="space-y-4 py-2" onSubmit={submitLogin}>
                <Field label="Correo electronico" type="email" value={login.email} onChange={(value) => setLogin({ ...login, email: value })} required className="auth-field w-full rounded-xl px-4 py-3 text-sm outline-none transition" />
                <Field label="Contrasena" type="password" value={login.password} onChange={(value) => setLogin({ ...login, password: value })} required className="auth-field w-full rounded-xl px-4 py-3 text-sm outline-none transition" />
                <div className="flex items-center justify-between text-xs">
                  <label className="group flex cursor-pointer items-center gap-2">
                    <input type="checkbox" className="auth-checkbox rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="auth-muted transition-colors group-hover:text-indigo-600">Recordarme</span>
                  </label>
                  <a href="#" className="auth-help-link font-semibold transition-colors">Olvidaste tu contrasena?</a>
                </div>
                <button disabled={loading} className="auth-submit w-full rounded-xl py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60">
                  {loading ? 'Cargando...' : 'Iniciar sesion'}
                </button>
              </form>
            ) : (
              <form className="space-y-4 py-2" onSubmit={submitRegister}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Usuario" value={register.UserName} onChange={(value) => setRegister({ ...register, UserName: value })} required className="auth-field w-full rounded-xl px-4 py-2.5 text-sm outline-none transition" />
                  <Select label="Genero" value={register.genero} onChange={(value) => setRegister({ ...register, genero: value })} options={[['M', 'Masculino'], ['F', 'Femenino'], ['O', 'Otro']]} className="auth-field w-full rounded-xl px-4 py-2.5 text-sm outline-none transition" />
                </div>
                <Field label="Nombre completo" value={register.NombreCompleto} onChange={(value) => setRegister({ ...register, NombreCompleto: value })} required className="auth-field w-full rounded-xl px-4 py-2.5 text-sm outline-none transition" />
                <Field label="Correo electronico" type="email" value={register.email} onChange={(value) => setRegister({ ...register, email: value })} required className="auth-field w-full rounded-xl px-4 py-2.5 text-sm outline-none transition" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Contrasena" type="password" value={register.password} onChange={(value) => setRegister({ ...register, password: value })} required className="auth-field w-full rounded-xl px-4 py-2.5 text-sm outline-none transition" />
                  <Field label="Nacimiento" type="date" value={register.fechanac} onChange={(value) => setRegister({ ...register, fechanac: value })} required className="auth-field w-full rounded-xl px-4 py-2.5 text-sm outline-none transition" />
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
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link to="/" className="auth-footer-link text-sm font-medium transition-colors">Necesitas ayuda? Contactanos</Link>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text', required = false, placeholder = '', ...props }) => (
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
  </label>
);

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
    <div className="container mx-auto px-4 py-8">
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

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <h2 className="shrink-0 text-2xl font-black tracking-tight text-slate-800">Mis Mazos</h2>

            <div className="relative w-full max-w-2xl flex-1">
              <form onSubmit={applyFilters} className="relative">
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-indigo-500">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input
                    type="text"
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
              <Link to="/mazos/create" className="group">
                <button className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-100 transition-all duration-300 hover:scale-105 hover:shadow-purple-300 active:scale-95 lg:w-auto">
                  <span className="text-xl leading-none transition-transform duration-300 group-hover:rotate-90">+</span>
                  Nuevo Mazo
                </button>
              </Link>
            </div>
          </div>

          {data.mazos?.length ? data.mazos.map((mazo) => (
            <div key={mazo.IDMazo} className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
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
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1 sm:flex-row">
                    <button onClick={() => navigate(`/mazos/${mazo.IDMazo}/edit`)} className="rounded-full p-2 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-90" title="Editar">
                      <EditIcon className="h-5 w-5" />
                    </button>
                    {Number(mazo.original) === 1 && (
                      <button
                        onClick={() => navigate(`/mazos/${mazo.IDMazo}/publicar`)}
                        className={`rounded-full p-2 transition-all active:scale-90 ${mazo.id_Publ ? 'text-purple-600 bg-purple-50' : 'text-slate-400 hover:bg-purple-50 hover:text-purple-600'}`}
                        title={mazo.id_Publ ? 'Editar Publicación' : 'Publicar'}
                      >
                        {mazo.id_Publ ? <GlobeIcon className="h-5 w-5" /> : <ShareIcon className="h-5 w-5" />}
                      </button>
                    )}
                  </div>
                  <button onClick={() => navigate(`/estudiar/${mazo.IDMazo}`)} className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-md transition-all hover:bg-indigo-600 hover:shadow-indigo-200 active:scale-95">
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
                  <Link to="/mazos/create" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-purple-100 transition-all hover:scale-105 active:scale-95">
                    <span className="text-lg">+</span>
                    Crear tu primer mazo
                  </Link>
                </>
              )}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 font-bold">🏆 Logros</h3>
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
            <Link to="/reporte" className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 text-sm font-bold text-indigo-700 transition-all hover:from-indigo-100 hover:to-purple-100 active:scale-95">
              <svg className="h-5 w-5 text-indigo-500 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Ver Reporte de Progreso
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold text-gray-800">
                <BagIcon className="h-5 w-5 text-indigo-500" />
                Explorar Marketplace
              </h3>
              <Link to="/marketplace" className="text-xs font-semibold text-indigo-600">Ver todo</Link>
            </div>
            <div className="space-y-3">
              {data.mazosPopulares?.length ? data.mazosPopulares.map((mazo) => (
                <div key={mazo.id_Publ} className="group relative flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-indigo-100 hover:bg-indigo-50/30">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold text-white shadow-sm">
                    {(mazo.titulo || 'M').slice(0, 1)} 📚
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-bold text-gray-800 transition-colors group-hover:text-indigo-700">{mazo.titulo}</h4>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">{mazo.tarjetas_count} tarjetas</span>
                      <span className="text-[10px] text-gray-400">por {String(mazo.NombreCompleto || mazo.UserName || 'Usuario').split(' ')[0]}</span>
                    </div>
                  </div>
                  <Link to={`/marketplace/${mazo.id_Publ}`} className="rounded-full bg-gray-50 p-1.5 text-gray-400 transition-all group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
                    <PlusIcon className="h-4 w-4" />
                  </Link>
                </div>
              )) : <p className="py-6 text-center text-xs italic text-gray-400">No hay mazos publicos disponibles.</p>}
            </div>
            <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-center">
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
const GlobeIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20" /></svg>;

export const MazoFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [deck, setDeck] = useState({ titulo: '', descripcion: '' });
  const [cards, setCards] = useState([]);
  const [cardModal, setCardModal] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    if (!editing) return;
    try {
      const { data } = await api.get(`/mazos/${id}`);
      setDeck({ titulo: data.mazo.titulo, descripcion: data.mazo.descripcion || '' });
      setCards(data.tarjetas || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar los datos del mazo.');
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
        navigate(`/mazos/${data.IDMazo}/edit`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible guardar el mazo.');
    }
  };

  const saveCard = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...cardModal, IDMazo: id };
      
      if (cardModal.tipo === 'opcion_multiple') {
        const validOptions = (cardModal.opciones || []).filter((o) => o.trim() !== '');
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
    navigate('/dashboard');
  };

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
          {cards.length ? cards.map((card, index) => (
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
                  {card.tipo === 'opcion_multiple' && card.opciones && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(typeof card.opciones === 'string' ? JSON.parse(card.opciones) : (card.opciones || [])).map((opt, i) => (
                        <span key={i} className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{opt}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute right-2 top-2 hidden gap-2 group-hover:flex">
                <button onClick={() => setCardModal({ ...card, tipo: card.tipo || 'basica', opciones: typeof card.opciones === 'string' ? JSON.parse(card.opciones) : (card.opciones || ['', '', '', '']) })} className="rounded-lg bg-gray-200 p-2 text-sm">Editar</button>
                <button onClick={() => deleteCard(card.IDTarjeta)} className="rounded-lg bg-red-500 p-2 text-sm text-white">Eliminar</button>
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

export const StudyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, data } = useResource(async () => (await api.get(`/estudiar/${id}`)).data, [id]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pass, setPass] = useState(0);
  const [fail, setFail] = useState(0);
  const [finished, setFinished] = useState(null);
  const [startTime] = useState(() => new Date());

  // Advanced card types state
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // { correct: boolean, revealed: boolean }

  const levenshtein = (a, b) => {
    const tmp = [];
    for (let i = 0; i <= a.length; i += 1) {
      tmp[i] = [i];
      if (i === 0) for (let j = 1; j <= b.length; j += 1) tmp[0][j] = j;
      else {
        for (let j = 1; j <= b.length; j += 1) {
          tmp[i][j] = Math.min(tmp[i - 1][j] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
      }
    }
    return tmp[a.length][b.length];
  };

  const isCorrect = (input, target) => {
    const s1 = String(input).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const s2 = String(target).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (s1 === s2) return true;
    const distance = levenshtein(s1, s2);
    const threshold = Math.max(1, Math.floor(s2.length * 0.2));
    return distance <= threshold;
  };

  const cards = data?.tarjetas || [];
  const current = cards[index] || {};
  const progress = cards.length ? (index / cards.length) * 100 : 0;

  const finish = async (nextPass, nextFail) => {
    const end = new Date();
    const { data: payload } = await api.post(`/estudiar/${id}/finalizar`, {
      aciertos: nextPass,
      fallos: nextFail,
      fechaini: startTime.toISOString().slice(0, 19).replace('T', ' '),
      fechafin: end.toISOString().slice(0, 19).replace('T', ' '),
    });
    setFinished({ ...payload, pass: nextPass, fail: nextFail });
  };

  const answer = (known) => {
    const nextPass = pass + (known ? 1 : 0);
    const nextFail = fail + (known ? 0 : 1);
    setPass(nextPass);
    setFail(nextFail);
    if (index + 1 >= cards.length) {
      finish(nextPass, nextFail);
    } else {
      setIndex(index + 1);
      setFlipped(false);
      setUserAnswer('');
      setFeedback(null);
    }
  };

  const submitEscritura = (event) => {
    event.preventDefault();
    if (feedback) return;
    const correct = isCorrect(userAnswer, current.reverso);
    setFeedback({ correct, revealed: true });
    setTimeout(() => answer(correct), 1500);
  };

  const selectOption = (opt) => {
    if (feedback) return;
    const correct = opt === current.reverso;
    setFeedback({ correct, revealed: true, selected: opt });
    setTimeout(() => answer(correct), 1500);
  };

  if (loading) return <Loading text="Preparando estudio..." />;
  if (error) return <ErrorBox message={error} />;
  if (!cards.length) return <div className="py-20 text-center"><h1 className="text-2xl font-bold">Este mazo no contiene tarjetas.</h1><Link className="mt-4 inline-block text-indigo-600" to="/dashboard">Volver al dashboard</Link></div>;

  if (finished) {
    const total = finished.pass + finished.fail;
    const accuracy = total ? Math.round((finished.pass / total) * 100) : 0;
    return (
      <div className="flex min-h-[calc(100vh-150px)] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[2.5rem] border border-indigo-50 bg-white p-10 text-center shadow-2xl">
          <div className="mb-6 text-6xl">OK</div>
          <h1 className="mb-2 text-3xl font-black text-gray-900">Sesion Terminada</h1>
          <p className="mb-8 text-gray-400">Has completado este mazo.</p>
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-5"><div className="text-3xl font-black text-indigo-600">{finished.pass}</div><div className="text-[10px] font-bold uppercase text-indigo-400">Aciertos</div></div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5"><div className="text-3xl font-black text-slate-400">{finished.fail}</div><div className="text-[10px] font-bold uppercase text-slate-400">Fallos</div></div>
          </div>
          <div className="mb-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-[2px]"><div className="flex items-center justify-between rounded-[14px] bg-white p-4"><span className="text-sm font-bold text-gray-500">Precision</span><span className="text-xl font-black text-indigo-600">{accuracy}%</span></div></div>
          <button onClick={() => navigate('/dashboard')} className="w-full rounded-2xl bg-gray-900 py-4 font-bold text-white">Volver al dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-150px)] flex-col items-center px-4 py-10">
      <div className="mb-12 w-full max-w-2xl">
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-600">Mazo: {data.mazo.titulo}</span>
          <span className="text-sm font-black text-gray-400"><span className="text-lg text-indigo-600">{index + 1}</span> / {cards.length}</span>
        </div>
        <div className="h-5 rounded-full bg-white/40 p-1 shadow-inner"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="w-full max-w-2xl">
        {current.tipo === 'opcion_multiple' ? (
          <div className="rounded-3xl border border-white/80 bg-white p-8 shadow-xl">
            <span className="mb-4 inline-block rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">Selecciona la opción correcta</span>
            <p className="mb-8 text-2xl font-bold text-gray-800 md:text-3xl">{current.frente}</p>
            <div className="grid gap-3">
              {(typeof current.opciones === 'string' ? JSON.parse(current.opciones) : (current.opciones || [])).map((opt, i) => {
                const isSelected = feedback?.selected === opt;
                const isTheCorrectOne = opt === current.reverso;
                let btnClass = 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50';
                if (feedback?.revealed) {
                  if (isTheCorrectOne) btnClass = 'border-green-500 bg-green-50 text-green-700';
                  else if (isSelected) btnClass = 'border-red-500 bg-red-50 text-red-700';
                  else btnClass = 'opacity-40';
                }
                return (
                  <button
                    key={i}
                    onClick={() => selectOption(opt)}
                    disabled={feedback?.revealed}
                    className={`flex items-center justify-between rounded-2xl border-2 px-6 py-4 font-bold transition-all ${btnClass}`}
                  >
                    <span>{opt}</span>
                    {feedback?.revealed && isTheCorrectOne && <span>✓</span>}
                    {feedback?.revealed && isSelected && !isTheCorrectOne && <span>&times;</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : current.tipo === 'escritura' ? (
          <div className="rounded-3xl border border-white/80 bg-white p-8 shadow-xl">
            <span className="mb-4 inline-block rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">Escribe tu respuesta</span>
            <p className="mb-8 text-2xl font-bold text-gray-800 md:text-3xl">{current.frente}</p>
            <form onSubmit={submitEscritura}>
              <input
                autoFocus
                type="text"
                value={userAnswer}
                disabled={feedback?.revealed}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Escribe aqui..."
                className={`w-full rounded-2xl border-2 p-5 text-xl font-bold outline-none transition-all ${
                  feedback ? (feedback.correct ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700') : 'border-gray-100 focus:border-indigo-400'
                }`}
              />
              {!feedback && (
                <button className="mt-4 w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-100">Enviar respuesta</button>
              )}
              {feedback && !feedback.correct && (
                <div className="mt-4 text-center">
                  <p className="text-sm font-bold text-gray-400">Respuesta correcta:</p>
                  <p className="text-xl font-black text-green-600">{current.reverso}</p>
                </div>
              )}
            </form>
          </div>
        ) : (
          <>
            <button onClick={() => setFlipped(!flipped)} className="relative flex min-h-[350px] w-full items-center justify-center rounded-3xl border border-white/80 bg-white p-8 text-center shadow-xl">
              <div>
                <span className={`mb-4 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${flipped ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-500'}`}>{flipped ? 'Respuesta' : 'Pregunta'}</span>
                <p className={`text-2xl font-bold md:text-3xl ${flipped ? 'text-white' : 'text-gray-800'}`}>{flipped ? current.reverso : current.frente}</p>
              </div>
              {flipped && <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700" />}
            </button>

            {flipped && (
              <div className="mx-auto mt-12 w-full max-w-md">
                <p className="mb-6 text-center text-sm font-medium italic text-gray-400">Que tal te ha ido con esta tarjeta?</p>
                <div className="flex gap-4">
                  <button onClick={() => answer(false)} className="flex-1 rounded-2xl border-2 border-red-100 bg-white py-5 text-sm font-black uppercase tracking-widest text-red-500">No lo sabia</button>
                  <button onClick={() => answer(true)} className="flex-1 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-green-200">Lo sabia</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-auto flex w-full max-w-2xl justify-around border-t border-gray-100 py-8">
        <Counter label="Aciertos" value={pass} color="text-green-500" />
        <Counter label="Fallos" value={fail} color="text-red-400" />
      </div>
    </div>
  );
};

const Counter = ({ label, value, color }) => (
  <div className="flex flex-col items-center">
    <span className="mb-1 text-xs font-bold uppercase tracking-tighter text-gray-400">{label}</span>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
  </div>
);

export const MarketplacePage = () => {
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState({
    search: params.get('search') || '',
    categoria: params.get('categoria') || '',
    precio: params.get('precio') || '',
    orden: params.get('orden') || 'popular',
  });
  const query = params.toString();
  const { loading, error, data } = useResource(async () => (await api.get(`/user/marketplace${query ? `?${query}` : ''}`)).data, [query]);

  const apply = (event) => {
    event.preventDefault();
    const next = {};
    Object.entries(form).forEach(([key, value]) => { if (value && !(key === 'orden' && value === 'popular')) next[key] = value; });
    setParams(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <div className="border-b border-purple-100 bg-white/70 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-indigo-600 md:text-4xl">Marketplace</h1>
          <p className="text-gray-500">Descubre y adquiere mazos de flashcards creados por la comunidad</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <form onSubmit={apply} className="mb-8 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_170px_200px_auto]">
            <input value={form.search} onChange={(event) => setForm({ ...form, search: event.target.value })} placeholder="Buscar por titulo, autor o tema..." className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-400" />
            <select value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm"><option value="">Todas</option>{(data?.categorias || []).map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select>
            <select value={form.precio} onChange={(event) => setForm({ ...form, precio: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm"><option value="">Todos</option><option value="gratis">Solo Gratis</option><option value="pago">Solo de Pago</option></select>
            <select value={form.orden} onChange={(event) => setForm({ ...form, orden: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm"><option value="popular">Mas Populares</option><option value="valorados">Mejor Valorados</option><option value="precio_asc">Precio: Menor a Mayor</option><option value="precio_desc">Precio: Mayor a Menor</option></select>
            <button className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white">Buscar</button>
          </div>
        </form>

        {loading ? <Loading text="Sincronizando marketplace..." /> : error ? <ErrorBox message={error} /> : data.publicaciones?.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.publicaciones.map((pub) => (
              <Link key={pub.id_Publ} to={`/marketplace/${pub.id_Publ}`} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-100">
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500">
                  {pub.imagen_url ? <img src={pub.imagen_url} alt={pub.titulo} className="h-full w-full object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-5xl opacity-60">LC</div>}
                  <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow ${Number(pub.pago) ? 'bg-indigo-600' : 'bg-green-500'}`}>{Number(pub.pago) ? money(pub.precio) : 'GRATIS'}</span>
                  {pub.categoria && <span className="absolute left-3 top-3 rounded-full bg-white/30 px-2 py-0.5 text-xs text-white backdrop-blur">{pub.categoria}</span>}
                  {data.mazosAdquiridos?.includes(pub.id_Publ) && <span className="absolute bottom-3 left-3 rounded-full bg-green-600/90 px-2.5 py-1 text-xs font-semibold text-white">En tu coleccion</span>}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="mb-1 line-clamp-2 font-bold text-gray-900 group-hover:text-indigo-600">{pub.titulo || 'Sin titulo'}</h3>
                  <p className="mb-2 line-clamp-2 flex-1 text-xs text-gray-500">{pub.descripcion_publica || pub.descripcion || empty}</p>
                  <p className="mb-3 text-xs text-gray-400">por <span className="font-medium text-gray-600">{pub.NombreCompleto || pub.UserName || 'Desconocido'}</span></p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1"><StarRow value={pub.promedio_valoracion} size="w-3.5 h-3.5" /><span className="ml-1 text-xs text-gray-400">{Number(pub.promedio_valoracion || 0).toFixed(1)} ({pub.num_valoraciones})</span></div>
                    <span className="text-xs text-gray-400">{pub.num_compras} adquiridos</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <h3 className="text-xl font-bold text-gray-700">No encontramos mazos</h3>
            <p className="mb-6 text-gray-500">Intenta con otros filtros o terminos de busqueda</p>
            <button onClick={() => setParams({})} className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 font-semibold text-white">Ver todos los mazos</button>
          </div>
        )}
      </div>
    </div>
  );
};

export const MarketplaceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const { loading, error, data } = useResource(async () => (await api.get(`/user/marketplace/${id}`)).data, [id, refresh]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (data?.miValoracion) {
      setRating(data.miValoracion.puntuacion);
      setComment(data.miValoracion.comentario || '');
    }
  }, [data]);

  const acquire = async () => {
    try {
      await api.post(`/user/marketplace/${id}/adquirir`);
      setSuccess({
        mode: 'gratis',
        deckTitle: data?.mazo?.titulo || 'Mazo',
        creatorName: data?.creador?.NombreCompleto || data?.creador?.UserName || 'Desconocido',
        cardCount: data?.tarjetas?.length || 0,
      });
      setRefresh((value) => value + 1);
    } catch (err) {
      const redirect = err.response?.data?.redirect;
      if (redirect) {
        navigate(redirect);
        return;
      }
      setMessage(err.response?.data?.message || 'No fue posible adquirir el mazo.');
    }
  };

  const sendRating = async (event) => {
    event.preventDefault();
    await api.post(`/user/marketplace/${id}/valorar`, { puntuacion: rating, comentario: comment });
    setMessage('Gracias por tu valoracion.');
    setRefresh((value) => value + 1);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  const { publicacion, creador, mazo, tarjetas, valoraciones, yaAdquirido, esPropio } = data;
  const creatorName = creador?.NombreCompleto || creador?.UserName || mazo.NombreCompleto || 'Desconocido';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {success && (
        <AcquisitionSuccessModal
          {...success}
          onDashboard={() => navigate('/dashboard')}
          onMarketplace={() => navigate('/marketplace')}
        />
      )}
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {message && <div className="mb-6"><Alert>{message}</Alert></div>}
        <div className="grid gap-8 lg:grid-cols-3">
          <main className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="relative h-52 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500">
                {publicacion.imagen_url && <img src={publicacion.imagen_url} alt={mazo.titulo} className="h-full w-full object-cover" />}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {publicacion.categoria && <span className="rounded-full bg-white/30 px-3 py-1 text-sm text-white backdrop-blur">{publicacion.categoria}</span>}
                  <span className={`rounded-full px-3 py-1 text-sm font-bold text-white ${Number(publicacion.pago) ? 'bg-indigo-600' : 'bg-green-500'}`}>{Number(publicacion.pago) ? money(publicacion.precio) : 'GRATIS'}</span>
                </div>
              </div>
              <div className="p-6">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">{mazo.titulo}</h1>
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span>por {creatorName}</span><span>•</span>
                  <span className="flex items-center gap-1"><StarRow value={publicacion.promedio_valoracion} /> {Number(publicacion.promedio_valoracion || 0).toFixed(1)} ({publicacion.num_valoraciones} valoraciones)</span><span>•</span>
                  <span>{publicacion.num_compras} adquiridos</span>
                </div>
                <p className="leading-relaxed text-gray-600">{publicacion.descripcion_publica || mazo.descripcion || empty}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">Contenido del mazo <span className="ml-2 text-sm font-normal text-gray-500">{tarjetas.length} tarjetas</span></h2>
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {tarjetas.slice(0, 8).map((card) => (
                  <div key={card.IDTarjeta} className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-indigo-400">Frente</span>{card.frente}</div>
                    <div className="rounded-xl border border-purple-100 bg-purple-50 p-3"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-purple-400">Reverso</span>{card.reverso}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold">Valoraciones y comentarios</h2>
              <div className="mb-6 flex items-center gap-6 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
                <div className="text-center"><div className="text-4xl font-bold text-amber-500">{Number(publicacion.promedio_valoracion || 0).toFixed(1)}</div><StarRow value={publicacion.promedio_valoracion} /><div className="mt-1 text-xs text-gray-400">{publicacion.num_valoraciones} valoraciones</div></div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = valoraciones.filter((val) => val.puntuacion === star).length;
                    const pct = publicacion.num_valoraciones ? Math.round((count / publicacion.num_valoraciones) * 100) : 0;
                    return <div key={star} className="flex items-center gap-2 text-xs"><span className="w-4 text-right text-gray-500">{star}</span><div className="h-2 flex-1 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-amber-400" style={{ width: `${pct}%` }} /></div><span className="w-8 text-gray-400">{count}</span></div>;
                  })}
                </div>
              </div>

              <form onSubmit={sendRating} className="mb-6 rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                <h3 className="mb-3 font-semibold text-gray-800">{data.miValoracion ? 'Actualizar tu valoracion' : 'Deja tu valoracion'}</h3>
                <div className="mb-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => <button type="button" key={star} onClick={() => setRating(star)} className={`text-3xl ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}>★</button>)}
                </div>
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows="3" placeholder="Escribe un comentario (opcional)..." className="mb-3 w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                <button disabled={!rating} className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{data.miValoracion ? 'Actualizar valoracion' : 'Enviar valoracion'}</button>
              </form>

              <div className="space-y-4">
                {valoraciones.length ? valoraciones.map((val) => (
                  <div key={val.id_Val} className="flex gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-bold text-white">{initials(val.NombreCompleto)}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-gray-800">{val.NombreCompleto}</span><StarRow value={val.puntuacion} size="w-3.5 h-3.5" /><span className="text-xs text-gray-400">{shortDate(val.fecha)}</span></div>
                      {val.comentario && <p className="mt-1 text-sm text-gray-600">{val.comentario}</p>}
                    </div>
                  </div>
                )) : <p className="py-6 text-center text-sm text-gray-400">Aun no hay valoraciones.</p>}
              </div>
            </div>
          </main>

          <aside className="space-y-4">
            <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-5 text-center">{Number(publicacion.pago) ? <><div className="mb-1 text-4xl font-bold text-gray-900">{money(publicacion.precio)}</div><p className="text-sm text-gray-400">Pago unico</p></> : <><div className="mb-1 text-4xl font-bold text-green-600">GRATIS</div><p className="text-sm text-gray-400">Sin costo</p></>}</div>
              {yaAdquirido ? <><div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-center font-semibold text-green-700">Ya tienes este mazo</div><button onClick={() => navigate('/dashboard')} className="w-full rounded-xl border-2 border-indigo-200 py-3 font-semibold text-indigo-600">Ver en Mi Dashboard</button></> : esPropio ? <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-center text-sm font-medium text-indigo-700">Este es tu mazo publicado</div> : Number(publicacion.pago) ? <button onClick={() => navigate(`/marketplace/${id}/pagar`)} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-lg font-bold text-white">Comprar ahora</button> : <button onClick={acquire} className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3.5 text-lg font-bold text-white">Agregar gratis</button>}
              <div className="mt-5 space-y-2.5 text-sm text-gray-500">
                <p>{tarjetas.length} tarjetas incluidas</p>
                <p>El mazo se clona a tu coleccion</p>
                <p>Puedes editarlo libremente</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, data } = useResource(async () => (await api.get(`/user/marketplace/${id}`)).data, [id]);
  const [form, setForm] = useState({ nombre_titular: '', numero_tarjeta: '', vencimiento: '', cvv: '' });
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(null);
  const redirected = useRef(false);

  useEffect(() => {
    if (!data || redirected.current) return;
    if (data.yaAdquirido) {
      redirected.current = true;
      navigate('/dashboard');
      return;
    }
    if (!Number(data.publicacion.pago)) {
      redirected.current = true;
      api.post(`/user/marketplace/${id}/adquirir`)
        .then(() => setSuccess({
          mode: 'gratis',
          deckTitle: data.mazo?.titulo || 'Mazo',
          creatorName: data.creador?.NombreCompleto || data.creador?.UserName || 'Desconocido',
          cardCount: data.tarjetas?.length || 0,
        }))
        .catch((err) => setSubmitError(err.response?.data?.message || 'No fue posible adquirir el mazo.'));
    }
  }, [data, id, navigate]);

  const formatCardNumber = (value) => value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    return digits.length >= 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const validatePayment = () => {
    const errors = [];
    const cardNumber = form.numero_tarjeta.replace(/\s/g, '');
    if (!form.nombre_titular.trim()) errors.push('El nombre del titular es obligatorio.');
    if (!/^\d{16}$/.test(cardNumber)) errors.push('El numero de tarjeta debe tener 16 digitos.');
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.vencimiento)) errors.push('El vencimiento debe tener formato MM/AA.');
    if (!/^\d{3}$/.test(form.cvv)) errors.push('El CVV debe tener 3 digitos.');
    return errors;
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    const errors = validatePayment();
    if (errors.length) {
      setSubmitError(errors.join(' '));
      return;
    }
    try {
      await api.post(`/user/marketplace/${id}/confirmar`, {
        ...form,
        numero_tarjeta: form.numero_tarjeta.replace(/\s/g, ''),
      });
      setSuccess({
        mode: 'pago',
        deckTitle: data?.mazo?.titulo || 'Mazo',
        creatorName: data?.creador?.NombreCompleto || data?.creador?.UserName || 'Desconocido',
        cardCount: data?.tarjetas?.length || 0,
      });
    } catch (err) {
      const serverErrors = err.response?.data?.errors ? Object.values(err.response.data.errors).join(' ') : '';
      setSubmitError(serverErrors || err.response?.data?.message || 'No fue posible confirmar la compra.');
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  const { publicacion, creador, mazo, tarjetas } = data;
  const creatorName = creador?.NombreCompleto || creador?.UserName || mazo.NombreCompleto || 'Desconocido';
  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 px-4 py-12">
      {success && (
        <AcquisitionSuccessModal
          {...success}
          onDashboard={() => navigate('/dashboard')}
          onMarketplace={() => navigate('/marketplace')}
        />
      )}
      <div className="w-full max-w-2xl">
        <ErrorBox message={submitError} />
        <div className="mb-6 mt-4 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 text-white">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="flex-1"><h2 className="text-lg font-bold text-gray-900">{mazo.titulo}</h2><p className="text-sm text-gray-500">por {creatorName} · {tarjetas.length} tarjetas</p></div>
          <div className="text-right"><div className="text-2xl font-bold text-indigo-600">{money(publicacion.precio)}</div><div className="text-xs text-gray-400">Pago unico</div></div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Datos de pago</h1>
                <p className="text-sm text-indigo-200">Entorno de demostracion, no se cobraran cargos reales</p>
              </div>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-5 p-6">
            <Field label="Nombre del titular" value={form.nombre_titular} onChange={(value) => setForm({ ...form, nombre_titular: value })} required />
            <Field label="Numero de tarjeta" value={form.numero_tarjeta} onChange={(value) => setForm({ ...form, numero_tarjeta: formatCardNumber(value) })} placeholder="1234 5678 9012 3456" maxLength="19" required />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vencimiento" value={form.vencimiento} onChange={(value) => setForm({ ...form, vencimiento: formatExpiry(value) })} placeholder="MM/AA" maxLength="5" required />
              <Field label="CVV" value={form.cvv} onChange={(value) => setForm({ ...form, cvv: value.replace(/\D/g, '').slice(0, 3) })} placeholder="123" maxLength="3" required />
            </div>
            <div className="border-t border-gray-100 pt-4"><div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{money(publicacion.precio)}</span></div><div className="flex justify-between text-base font-bold text-gray-900"><span>Total</span><span className="text-indigo-600">{money(publicacion.precio)} USD</span></div></div>
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700"><AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>Este es un entorno de demostracion. Usa cualquier numero de tarjeta de 16 digitos, fecha futura y CVV de 3 digitos. No se realizaran cargos reales.</span></div>
            <button className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-4 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-200"><span className="inline-flex items-center justify-center gap-2"><CreditCard className="h-5 w-5" />Confirmar compra - {money(publicacion.precio)}</span></button>
            <p className="flex items-center justify-center gap-1 text-center text-xs text-gray-400"><LockKeyhole className="h-3.5 w-3.5" />Pago seguro simulado · Al confirmar, el mazo se agregara a tu coleccion</p>
          </form>
        </div>
      </div>
    </div>
  );
};

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
      navigate('/marketplace');
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
            <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-semibold text-gray-600">Cancelar</button>
            <button className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-200">{editing ? '💾 Actualizar publicación' : '🚀 Publicar en Marketplace'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
          <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 text-sm font-bold text-gray-500">Cancelar</button>
          <button className="rounded-xl bg-indigo-600 px-8 py-3 font-bold text-white shadow-lg shadow-indigo-100">Guardar Cambios</button>
        </div>
      </form>
    </div>
  );
};

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

export const AdminDashboardPage = () => {
  const { loading, error, data } = useResource(async () => (await api.get('/admin/dashboard')).data, []);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AdminMetric label="Ganancias" value={money(data.totalGanancias)} text="Ingresos totales brutos" />
        <AdminMetric label="Comunidad" value={data.stats.usuarios} text="Usuarios en la plataforma" />
        <AdminMetric label="Contenido" value={data.stats.mazos} text="Mazos creados totales" />
        <AdminMetric label="Ventas" value={data.stats.ventas} text="Transacciones exitosas" />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-50 p-8"><h3 className="text-xl font-bold text-gray-800">Ventas Recientes</h3><Link to="/admin/ventas" className="text-sm font-bold text-purple-600">Ver todas</Link></div>
          <Table headers={['Comprador', 'Mazo', 'Monto', 'Fecha']} rows={data.comprasRecientes.map((sale) => [sale.UserName || 'Anonimo', sale.titulo || 'Mazo borrado', money(sale.precioPagado), shortDate(sale.fechaCompra)])} />
        </div>
        <div className="rounded-[2.5rem] bg-gradient-to-r from-purple-900 to-indigo-900 p-8 text-white shadow-xl">
          <h3 className="mb-6 text-xl font-bold">Acciones de Control</h3>
          <div className="grid gap-4">
            <AdminLink to="/admin/users">Gestionar Usuarios</AdminLink>
            <AdminLink to="/admin/mazos">Gestionar Mazos</AdminLink>
            <AdminLink to="/admin/ventas">Gestionar Ventas</AdminLink>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminMetric = ({ label, value, text }) => (
  <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><div className="mb-4 flex items-center justify-between"><div className="rounded-2xl bg-purple-100 p-3 text-purple-600">LC</div><span className="text-xs font-bold uppercase text-gray-400">{label}</span></div><h2 className="text-2xl font-black text-gray-800">{value}</h2><p className="text-sm text-gray-500">{text}</p></div>
);

const AdminLink = ({ to, children }) => <Link to={to} className="w-full rounded-2xl bg-white/10 px-6 py-4 font-bold transition hover:bg-white/20">{children}</Link>;

export const AdminUsersPage = () => {
  const [refresh, setRefresh] = useState(0);
  const { loading, error, data } = useResource(async () => (await api.get('/admin/users')).data, [refresh]);
  const promote = async (id, name) => { if (confirm(`Ascender a ${name} a administrador?`)) { await api.patch(`/admin/users/${id}/toggle`); setRefresh((value) => value + 1); } };
  const remove = async (id, name) => { if (confirm(`Borrar todos los datos de ${name}?`)) { await api.delete(`/admin/users/${id}`); setRefresh((value) => value + 1); } };
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  return (
    <AdminPage title="Gestion de Usuarios">
      <table className="w-full text-left"><thead className="bg-gray-50"><tr><Th>Usuario</Th><Th>Email</Th><Th>Rol Actual</Th><Th align="right">Acciones</Th></tr></thead><tbody className="divide-y divide-gray-50">{data.usuarios.map((user) => <tr key={user.IDUsuario} className="hover:bg-gray-50/50"><Td><div className="flex items-center"><div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600">{user.UserName?.[0]}</div><span className="font-bold text-gray-700">{user.UserName}</span></div></Td><Td>{user.email}</Td><Td><span className={`rounded-full px-3 py-1 text-xs font-bold ${user.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{String(user.rol).toUpperCase()}</span></Td><Td align="right">{user.rol !== 'admin' ? <div className="space-x-2"><button onClick={() => promote(user.IDUsuario, user.UserName)} className="text-sm font-bold text-blue-600">Hacer Admin</button><button onClick={() => remove(user.IDUsuario, user.UserName)} className="text-sm font-bold text-red-500">Eliminar</button></div> : <span className="text-xs italic text-gray-400">Cuenta protegida</span>}</Td></tr>)}</tbody></table>
    </AdminPage>
  );
};

export const AdminMazosPage = () => {
  const [refresh, setRefresh] = useState(0);
  const navigate = useNavigate();
  const { loading, error, data } = useResource(async () => (await api.get('/admin/mazos')).data, [refresh]);
  const remove = async (id) => { if (confirm('Borrar mazo?')) { await api.delete(`/admin/mazos/${id}`); setRefresh((value) => value + 1); } };
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  return (
    <AdminPage title="Moderacion de Mazos">
      <table className="w-full text-left"><thead className="bg-gray-50"><tr><Th>Titulo</Th><Th>Autor</Th><Th>Coleccion</Th><Th>Tarjetas</Th><Th>Estado</Th><Th align="right">Acciones</Th></tr></thead><tbody className="divide-y divide-gray-50">{data.mazos.map((mazo) => <tr key={mazo.IDMazo} className="hover:bg-gray-50/50"><Td strong>{mazo.titulo}</Td><Td>{mazo.UserName || 'S/N'}</Td><Td>{Number(mazo.enColeccion) ? <span className="text-xs font-bold text-green-600">Activo</span> : <span className="text-xs font-bold italic text-red-400">Borrado</span>}</Td><Td>{mazo.tarjetas_count}</Td><Td>{Number(mazo.publico) === 1 ? <span className="rounded-lg bg-green-100 px-2 py-1 text-[10px] font-black uppercase text-green-700">Publicado</span> : <span className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-black uppercase text-gray-400">Privado</span>}</Td><Td align="right"><button onClick={() => navigate(`/admin/mazos/${mazo.IDMazo}/tarjetas`)} className="mr-2 font-bold text-blue-600">Ver</button><button onClick={() => remove(mazo.IDMazo)} className="font-bold text-red-500">Eliminar</button></Td></tr>)}</tbody></table>
    </AdminPage>
  );
};

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

export const AdminVentasPage = () => {
  const { loading, error, data } = useResource(async () => (await api.get('/admin/ventas')).data, []);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  return (
    <AdminPage title="Historial Global de Ventas">
      <Table headers={['ID', 'Comprador', 'Mazo Adquirido', 'Precio', 'Fecha']} rows={data.ventas.map((sale) => [`#${sale.id_Compra}`, sale.UserName, sale.titulo || 'N/A', money(sale.precioPagado), new Date(sale.fechaCompra).toLocaleString('es-MX')])} />
    </AdminPage>
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
