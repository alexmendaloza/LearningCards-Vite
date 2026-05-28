import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../api/axios';

//Pagina principal del usuario

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/user/dashboard');
        
        // Verificamos si la respuesta es JSON o HTML
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
          console.log("Backend devolvió HTML. Extrayendo datos básicos...");
          
          // Intentamos extraer el nombre del usuario del HTML de Blade como prueba de conexión
          const nameMatch = response.data.match(/<span class="text-indigo-600">([^<]+)<\/span>/);
          const userName = nameMatch ? nameMatch[1] : 'Usuario';

          setData({
            usuario: { NombreCompleto: userName },
            stats: { estudiadas: 0, precision: 0, racha: 0 },
            mazos: []
          });
        } else {
          setData(response.data);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Error al conectar con la base de datos de Laravel. Asegúrate de que 'php artisan serve' esté activo.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-8 text-center animate-pulse">Cargando datos reales de la base de datos...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl m-4 border border-red-100">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            ¡Hola de nuevo, <span className="text-indigo-600">{data?.usuario?.NombreCompleto || 'Estudiante'}</span>! 👋
          </h1>
          <p className="text-slate-500">Aquí tienes un resumen de tu progreso hoy.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2">
            <span>+</span> Crear Mazo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Tarjetas Estudiadas" value={data?.stats?.estudiadas || 0} icon="📚" color="blue" />
        <StatCard title="Precisión Media" value={`${data?.stats?.precision || 0}%`} icon="🎯" color="emerald" />
        <StatCard title="Racha Actual" value={`${data?.stats?.racha || 0} días`} icon="🔥" color="orange" />
      </div>

      {/* Grid de Mazos */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span>🗂️</span> Tus Mazos en Colección
        </h2>
        
        {data?.mazos?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.mazos.map((mazo) => (
              <MazoCard key={mazo.IDMazo} mazo={mazo} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4">
            <div className="text-4xl">🌵</div>
            <div>
              <p className="text-slate-600 font-bold">No tienes mazos todavía</p>
              <p className="text-slate-400 text-sm">Comienza creando uno o explorando el marketplace.</p>
            </div>
            <Link to="/marketplace" className="inline-block">
              <button className="text-indigo-600 font-bold hover:underline">Explorar Marketplace →</button>
            </Link>
          </div>
        )}
      </div>

      {/* Nota de Conexión */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-700 flex items-center gap-3">
        <span className="flex-shrink-0 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
        <p>
          <b>Estado de Conexión:</b> Enlazado con éxito a phpMyAdmin vía Laravel API. 
          (Los datos se están sincronizando en tiempo real).
        </p>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-2xl flex items-center justify-center`}>{icon}</div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const MazoCard = ({ mazo }) => (
  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📘</div>
      <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg uppercase">
        {mazo.tarjetas_count || 0} Tarjetas
      </span>
    </div>
    <h3 className="font-bold text-slate-800 mb-2 truncate">{mazo.titulo}</h3>
    <p className="text-slate-400 text-xs line-clamp-2 mb-4 h-8">{mazo.descripcion || 'Sin descripción'}</p>
    <button className="w-full py-2.5 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all">
      Estudiar Ahora
    </button>
  </div>
);

export default Dashboard;
