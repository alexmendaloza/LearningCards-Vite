import {
  BadgeDollarSign,
  BookOpen,
  CreditCard,
  Download,
  Filter,
  ShoppingCart,
  Star,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const rating = (value) => `${Number(value || 0).toFixed(1)}/5`;

const Loading = ({ text = 'Cargando...' }) => (
  <div className="py-16 text-center text-sm font-semibold text-slate-500 animate-pulse">{text}</div>
);

const ErrorBox = ({ message }) => message ? (
  <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{message}</div>
) : null;

const useCreatorStats = (params) => {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const query = params.toString();

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: '' }));
    api.get(`/user/creator/stats${query ? `?${query}` : ''}`)
      .then((response) => active && setState({ loading: false, error: '', data: response.data }))
      .catch(async (error) => {
        if (error.response?.status === 404) {
          try {
            const fallback = (await api.get('/user/dashboard')).data;
            const publishedDecks = (fallback.mazos || []).filter((deck) => Number(deck.original) === 1 && Number(deck.publico) === 1);
            if (active) {
              setState({
                loading: false,
                error: '',
                data: {
                  usuario: fallback.usuario,
                  stats: {
                    mazos_publicados: publishedDecks.length,
                    mazos_gratis: publishedDecks.length,
                    mazos_pago: 0,
                    copias_vendidas: 0,
                    valoraciones: 0,
                    promedio_estrellas: 0,
                    ingresos_brutos: 0,
                    comision_plataforma: 0,
                    dinero_neto: 0,
                    ticket_promedio: 0,
                    porcentaje_comision: 15,
                  },
                  topMazos: publishedDecks.slice(0, 5).map((deck) => ({
                    id_Publ: deck.id_Publ || deck.IDMazo,
                    pago: 0,
                    precio: 0,
                    categoria: deck.descripcion || 'Gratis',
                    promedio_valoracion: 0,
                    titulo: deck.titulo,
                    descripcion: deck.descripcion,
                    copias_vendidas: 0,
                    ingresos_brutos: 0,
                    ingresos_netos: 0,
                  })),
                  categorias: fallback.categorias || [],
                  ventasRecientes: [],
                },
              });
            }
            return;
          } catch (fallbackError) {
            if (active) setState({ loading: false, error: fallbackError.response?.data?.message || fallbackError.message, data: null });
            return;
          }
        }
        if (active) setState({ loading: false, error: error.response?.data?.message || error.message, data: null });
      });
    return () => { active = false; };
  }, [query]);

  return state;
};

export const UserStatsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { loading, error, data } = useCreatorStats(searchParams);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawDone, setWithdrawDone] = useState(false);

  const initialFilters = useMemo(() => ({
    search: searchParams.get('search') || '',
    tipo: searchParams.get('tipo') || '',
    categoria: searchParams.get('categoria') || '',
    ingresos_min: searchParams.get('ingresos_min') || '',
    fecha_desde: searchParams.get('fecha_desde') || '',
    fecha_hasta: searchParams.get('fecha_hasta') || '',
  }), [searchParams]);
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const submitFilters = (event) => {
    event.preventDefault();
    const next = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) next.set(key, value);
    });
    setSearchParams(next);
    setFiltersOpen(false);
  };

  if (loading) return <Loading text="Calculando estadísticas..." />;
  if (error) return <ErrorBox message={error} />;

  const stats = data.stats || {};
  const topMazos = data.topMazos || [];
  const ventasRecientes = data.ventasRecientes || [];
  const categorias = data.categorias || [];

  return (
    <div className="creator-stats-page min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-cyan-50 py-8">
      <div className="mx-auto max-w-[1536px] px-4">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <span className="mb-4 inline-block rounded-full bg-violet-100 px-4 py-1 text-xs font-black uppercase tracking-wider text-violet-500">Panel de Creador</span>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">Mis Estadísticas</h1>
            <p className="mt-2 font-medium text-slate-500">Monitorea tus ventas, calificaciones e ingresos netos disponibles para retiro.</p>
          </div>
          <a
            href="/user/marketplace/reporte-ventas/pdf"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 px-6 py-4 text-sm font-black text-white shadow-xl shadow-rose-500/25 transition-all hover:-translate-y-1"
          >
            <Download className="h-4 w-4" />
            Descargar reporte PDF
          </a>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Mazos Publicados" value={stats.mazos_publicados || 0} sub={`${stats.mazos_gratis || 0} gratis - ${stats.mazos_pago || 0} de pago`} icon={<BookOpen className="h-5 w-5" />} />
          <MetricCard label="Copias Vendidas" value={stats.copias_vendidas || 0} sub="Transacciones completadas" icon={<ShoppingCart className="h-5 w-5" />} />
          <MetricCard label="Valoraciones" value={rating(stats.promedio_estrellas)} sub={`${stats.valoraciones || 0} reseñas recibidas`} icon={<Star className="h-5 w-5 fill-current" />} />
          <MetricCard label="Ticket Promedio" value={money(stats.ticket_promedio)} sub="Ingresos brutos / copias vendidas" icon={<BadgeDollarSign className="h-5 w-5" />} tone="cyan" />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AmountCard title="Ingresos Brutos Totales" value={money(stats.ingresos_brutos)} sub="Dinero generado por todas las ventas completadas." />
          <AmountCard title="Comisión de la Plataforma" value={money(stats.comision_plataforma)} sub={`${stats.porcentaje_comision || 15}% retenido por operación.`} />
          <div className="withdrawable-card rounded-[1.75rem] border border-emerald-200 bg-gradient-to-br from-emerald-500 to-cyan-500 p-7 text-white shadow-xl shadow-emerald-500/20">
            <p className="mb-4 text-sm font-black">Ganancias Retirables</p>
            <p className="text-4xl font-black tracking-tight">{money(stats.dinero_neto)}</p>
            <p className="mt-4 text-sm font-bold">85% neto disponible para transferencia simulada.</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="creator-panel rounded-[1.75rem] bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900">Rendimiento de tus mazos</h2>
                <span className="rounded-full bg-violet-100 px-4 py-2 text-xs font-black text-violet-400">Top por ingresos</span>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen((value) => !value)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 px-5 py-3 text-xs font-black text-white shadow-lg shadow-rose-500/25"
              >
                <Filter className="h-4 w-4" />
                Filtros Inteligentes
              </button>
            </div>

            {filtersOpen && (
              <form onSubmit={submitFilters} className="creator-filter-panel mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-3">
                <input className="creator-input" name="search" placeholder="Buscar mazo..." value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
                <select className="creator-input" value={filters.tipo} onChange={(event) => setFilters({ ...filters, tipo: event.target.value })}>
                  <option value="">Todos los tipos</option>
                  <option value="gratis">Gratis</option>
                  <option value="pago">De pago</option>
                </select>
                <select className="creator-input" value={filters.categoria} onChange={(event) => setFilters({ ...filters, categoria: event.target.value })}>
                  <option value="">Todas las categorías</option>
                  {categorias.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <input className="creator-input" type="number" min="0" step="0.01" placeholder="Ingresos minimos" value={filters.ingresos_min} onChange={(event) => setFilters({ ...filters, ingresos_min: event.target.value })} />
                <input className="creator-input" type="date" value={filters.fecha_desde} onChange={(event) => setFilters({ ...filters, fecha_desde: event.target.value })} />
                <input className="creator-input" type="date" value={filters.fecha_hasta} onChange={(event) => setFilters({ ...filters, fecha_hasta: event.target.value })} />
                <div className="flex gap-2 md:col-span-3">
                  <button type="submit" className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-black text-white">Aplicar</button>
                  <button type="button" onClick={() => setSearchParams({})} className="rounded-xl bg-white px-5 py-2 text-xs font-black text-slate-500">Limpiar</button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="creator-table w-full text-left">
                <thead>
                  <tr className="border-b border-cyan-900/20 bg-slate-50 text-xs font-black uppercase text-slate-700">
                    <th className="px-1 py-4">Mazo</th>
                    <th className="px-1 py-4">Tipo</th>
                    <th className="px-1 py-4">Ventas</th>
                    <th className="px-1 py-4">Bruto</th>
                    <th className="px-1 py-4">Neto</th>
                    <th className="px-1 py-4">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {topMazos.length ? topMazos.map((mazo) => (
                    <tr key={mazo.id_Publ} className="border-b border-slate-100 last:border-0">
                      <td className="px-1 py-5">
                        <p className="font-black text-slate-900">{mazo.titulo}</p>
                        <p className="text-xs font-bold text-slate-500">{mazo.categoria || mazo.descripcion || 'Sin categoría'}</p>
                      </td>
                      <td className="px-1 py-5">
                        <span className="deck-type-badge rounded-full px-4 py-2 text-xs font-black">{Number(mazo.pago) === 1 ? money(mazo.precio) : 'Gratis'}</span>
                      </td>
                      <td className="px-1 py-5 text-sm font-black text-slate-700">{mazo.copias_vendidas}</td>
                      <td className="px-1 py-5 text-sm font-black text-white md:text-slate-700">{money(mazo.ingresos_brutos)}</td>
                      <td className="px-1 py-5 text-sm font-black text-emerald-500">{money(mazo.ingresos_netos)}</td>
                      <td className="px-1 py-5 text-sm font-black text-yellow-400">{rating(mazo.promedio_valoracion)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-sm font-bold text-slate-400">No hay publicaciones que coincidan con los filtros.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="creator-panel rounded-[1.75rem] bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-2xl font-black text-slate-900">Retiro de Ganancias</h3>
              <p className="mb-6 text-sm font-medium text-slate-500">Saldo neto calculado después de la comisión de plataforma.</p>
              <div className="rounded-3xl bg-gradient-to-br from-violet-500 via-sky-400 to-emerald-400 p-6 text-white shadow-lg">
                <p className="text-sm font-black">Disponible para retirar</p>
                <p className="mt-3 text-4xl font-black">{money(stats.dinero_neto)}</p>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawOpen(true)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-500/20"
              >
                <CreditCard className="h-4 w-4" />
                Retirar Fondos a Tarjeta
              </button>
            </div>

            <div className="creator-panel rounded-[1.75rem] bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-black text-slate-900">Ventas Recientes</h3>
              <div className="space-y-3">
                {ventasRecientes.length ? ventasRecientes.map((sale) => (
                  <div key={sale.id_Compra} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{sale.titulo}</p>
                        <p className="text-xs font-bold text-slate-500">por {sale.UserName || sale.NombreCompleto}</p>
                      </div>
                      <span className="text-sm font-black text-emerald-500">{money(sale.precioPagado)}</span>
                    </div>
                  </div>
                )) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-xs font-bold text-slate-400">Aún no hay ventas registradas.</p>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>

      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Retiro de Ganancias</h3>
              <button type="button" onClick={() => setWithdrawOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            {withdrawDone ? (
              <div className="rounded-2xl bg-emerald-50 p-5 text-sm font-bold text-emerald-700">
                Solicitud de retiro registrada correctamente.
              </div>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); setWithdrawDone(true); }} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase text-slate-500">Monto disponible</label>
                  <input className="creator-input w-full" readOnly value={money(stats.dinero_neto)} />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase text-slate-500">Tarjeta destino</label>
                  <input className="creator-input w-full" placeholder="**** **** **** 4242" />
                </div>
                <button type="submit" className="w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white">Confirmar retiro</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, sub, icon, tone = 'slate' }) => (
  <div className="creator-panel rounded-[1.5rem] bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center justify-between">
      <p className="text-sm font-black text-slate-700">{label}</p>
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${tone === 'cyan' ? 'border-cyan-400 text-cyan-400' : 'border-slate-100 text-slate-500'}`}>{icon}</div>
    </div>
    <p className="text-4xl font-black text-slate-900">{value}</p>
    <p className="mt-3 text-xs font-bold text-slate-500">{sub}</p>
  </div>
);

const AmountCard = ({ title, value, sub }) => (
  <div className="creator-panel rounded-[1.75rem] bg-white p-7 shadow-sm">
    <p className="mb-4 text-sm font-black text-slate-700">{title}</p>
    <p className="text-4xl font-black tracking-tight text-slate-900">{value}</p>
    <p className="mt-4 text-sm font-bold text-slate-500">{sub}</p>
  </div>
);

export default UserStatsPage;
