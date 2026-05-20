import { useEffect, useState } from 'react';
import { Camera, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

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

const Loading = ({ text = 'Cargando...' }) => (
  <div className="py-16 text-center text-sm font-semibold text-slate-500 animate-pulse">{text}</div>
);

const ErrorBox = ({ message }) => message ? (
  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{message}</div>
) : null;

const Alert = ({ children }) => (
  <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-800">{children}</div>
);

const useResource = (loader, deps = []) => {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  useEffect(() => {
    let active = true;
    loader()
      .then((data) => active && setState({ loading: false, error: '', data }))
      .catch((error) => active && setState({ loading: false, error: error.response?.data?.message || error.message, data: null }));
    return () => { active = false; };
  }, deps);
  return state;
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
    <div className="profile-page mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-800">Configuracion de Cuenta</h1>
        <p className="text-gray-500">Administra tu informacion personal y presencia en la plataforma.</p>
      </div>

      {message && <Alert>{message}</Alert>}
      <ErrorBox message={submitError} />

      <form onSubmit={submit} className="profile-card overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="space-y-8 p-8">
          <div className="flex flex-col items-center gap-8 border-b border-gray-100 pb-8 md:flex-row">
            <div className="profile-avatar-wrap relative">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-indigo-100 text-4xl font-bold text-indigo-400 shadow-lg">
                {form.fotorutaData || form.fotoruta ? <img src={form.fotorutaData || storageUrl(form.fotoruta)} className="h-full w-full object-cover" alt="Perfil" /> : initials(form.NombreCompleto)}
              </div>
              <label className="profile-camera-btn absolute bottom-0 right-0 cursor-pointer rounded-full bg-indigo-600 p-2 text-white shadow-md transition-all hover:bg-indigo-700">
                <Camera className="h-5 w-5" />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={async (event) => setForm({ ...form, ...(await readImageFile(event.target.files?.[0])) })}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-bold text-gray-800">Foto de perfil</h3>
              <p className="mb-2 text-sm text-gray-500">JPG o PNG. Maximo 2MB.</p>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">ID de Usuario: #{data.usuario.IDUsuario}</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ProfileField label="Nombre de Usuario" value={form.UserName} onChange={(value) => setForm({ ...form, UserName: value })} />
            <ProfileField label="Nombre Completo" value={form.NombreCompleto} onChange={(value) => setForm({ ...form, NombreCompleto: value })} />
            <ProfileField label="Correo Electronico" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <ProfileField label="Fecha de Nacimiento" type="date" value={form.fechanac} onChange={(value) => setForm({ ...form, fechanac: value })} />
            <label className="block">
              <span className="profile-label mb-2 block text-sm font-bold text-gray-700">Genero</span>
              <select value={form.genero} onChange={(event) => setForm({ ...form, genero: event.target.value })} className="profile-input w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition-all">
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </label>
          </div>
        </div>

        <div className="profile-actions flex justify-end gap-4 border-t border-gray-100 bg-gray-50 p-8">
          <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 text-sm font-bold text-gray-500 transition-colors hover:text-gray-700">Cancelar</button>
          <button className="marketplace-liquid-btn inline-flex items-center gap-2 rounded-xl px-8 py-3 font-black text-white">
            <Save className="h-4 w-4" />
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

const ProfileField = ({ label, value, onChange, type = 'text' }) => (
  <label className="block">
    <span className="profile-label mb-2 block text-sm font-bold text-gray-700">{label}</span>
    <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="profile-input w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition-all" />
  </label>
);

export default ProfilePage;
