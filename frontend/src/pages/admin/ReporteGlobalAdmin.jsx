import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { CheckMarkIcon, CloseIcon, ErrorBox, Loading, useResource } from './AdminShared';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const dateValue = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const adminLongDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const AdminReportStat = ({ label, value, icon, tone }) => (
  <div className="admin-report-stat group relative overflow-hidden rounded-[2.5rem] p-10 shadow-xl transition-all">
    <div className={`admin-report-glow admin-report-glow-${tone} absolute -right-4 -top-4 h-32 w-32 rounded-full blur-3xl transition-all`} />
    <div className="mb-6 flex items-center gap-5">
      <div className={`admin-report-icon admin-report-icon-${tone} flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg`}>
        {icon}
      </div>
      <p className={`text-xs font-black uppercase tracking-[0.2em] ${tone === 'indigo' ? 'text-indigo-400' : 'text-slate-400'}`}>{label}</p>
    </div>
    <h2 className={`admin-report-value admin-report-value-${tone} text-5xl font-black tracking-tighter`}>{value}</h2>
  </div>
);

const AdminMoneyIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AdminUsersIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const AdminTrendIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const ReportFileIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const CalendarMiniIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

const AdminPrintLayout = ({ data, filters }) => {
  const stats = data?.stats || {};
  const ventas = data?.ventas || [];
  return (
    <div className="hidden print:block bg-white text-black text-[11px] leading-[1.55] uppercase font-sans p-8">
      <div className="text-center bg-[#1e293b] text-white border-b-4 border-[#3b82f6] rounded-2xl p-6 mb-8 break-inside-avoid font-extrabold">
        <h1 className="m-0 text-white text-3xl font-extrabold tracking-wide">LEARNINGCARDS - REPORTE ADMINISTRATIVO</h1>
        <p className="mt-2 text-[11px]">SISTEMA NOVALEARN</p>
        <p className="mt-1 text-[11px]">FECHA DE GENERACION: {new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</p>
        {(filters?.fecha_inicio || filters?.fecha_fin) && (
          <p className="mt-1 text-[11px] text-blue-200">
            PERIODO: {filters.fecha_inicio || 'INICIO'} AL {filters.fecha_fin || 'ACTUALIDAD'}
          </p>
        )}
      </div>

      <table className="w-full border-separate border-spacing-3 -mx-3 mb-8 break-inside-avoid">
        <tbody>
          <tr>
            <td className="w-1/3 p-0">
              <div className="bg-[#f0fdf4] border border-[#86efac] border-t-4 border-t-[#22c55e] rounded-xl p-4 text-center font-bold text-black">
                <div className="text-[9px] mb-2 tracking-wide">VENTAS BRUTAS TOTALES</div>
                <div className="text-lg">{money(stats.total_ganancias)}</div>
              </div>
            </td>
            <td className="w-1/3 p-0">
              <div className="bg-[#eff6ff] border border-[#93c5fd] border-t-4 border-t-[#3b82f6] rounded-xl p-4 text-center font-bold text-black">
                <div className="text-[9px] mb-2 tracking-wide">UTILIDAD NOVALEARN (15%)</div>
                <div className="text-lg">{money(stats.utilidad_novalearn)}</div>
              </div>
            </td>
            <td className="w-1/3 p-0">
              <div className="bg-[#faf5ff] border border-[#d8b4fe] border-t-4 border-t-[#a855f7] rounded-xl p-4 text-center font-bold text-black">
                <div className="text-[9px] mb-2 tracking-wide">USUARIOS ACTIVOS</div>
                <div className="text-lg">{stats.total_usuarios || 0}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-[#0f172a] text-xl font-extrabold text-left mt-8 mb-4 pb-2 border-b-2 border-[#94a3b8] relative break-after-avoid after:content-[''] after:block after:w-32 after:h-0.5 after:mt-2 after:bg-[#3b82f6]">
        HISTORIAL DE TRANSACCIONES
      </h2>
      <table className="w-full border-collapse mb-8 break-inside-auto">
        <thead className="table-header-group">
          <tr>
            <th className="bg-[#1e293b] text-left p-3 text-[9px] text-white font-extrabold tracking-wide border-b-2 border-[#3b82f6]">USUARIO</th>
            <th className="bg-[#1e293b] text-left p-3 text-[9px] text-white font-extrabold tracking-wide border-b-2 border-[#3b82f6]">MAZO ADQUIRIDO</th>
            <th className="bg-[#1e293b] text-left p-3 text-[9px] text-white font-extrabold tracking-wide border-b-2 border-[#3b82f6]">FECHA</th>
            <th className="bg-[#1e293b] text-right p-3 text-[9px] text-white font-extrabold tracking-wide border-b-2 border-[#3b82f6]">MONTO</th>
          </tr>
        </thead>
        <tbody>
          {ventas?.length > 0 ? ventas.map((sale, idx) => (
            <tr key={idx} className="break-inside-avoid even:bg-[#f8fafc]">
              <td className="p-3 border-b border-[#e2e8f0] font-bold">{sale.UserName || 'Anonimo'}</td>
              <td className="p-3 border-b border-[#e2e8f0]">{sale.titulo || 'N/A'}</td>
              <td className="p-3 border-b border-[#e2e8f0]">{adminLongDate(sale.fechaCompra)}</td>
              <td className="p-3 border-b border-[#e2e8f0] text-right font-bold text-emerald-700">{money(sale.precioPagado)}</td>
            </tr>
          )) : (
            <tr><td colSpan="4" className="p-3 border-b border-[#e2e8f0] text-center">NO HAY TRANSACCIONES REGISTRADAS</td></tr>
          )}
        </tbody>
      </table>

      <div className="mt-10 pt-4 border-t-2 border-[#cbd5e1] text-center text-[10px] font-bold text-slate-500">
        REPORTE CONFIDENCIAL - USO EXCLUSIVO ADMINISTRATIVO.
      </div>
    </div>
  );
};

const ReporteGlobalAdmin = () => {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({
    usuario: params.get('usuario') || '',
    orden: params.get('orden') || 'desc',
    fecha_inicio: params.get('fecha_inicio') || '',
    fecha_fin: params.get('fecha_fin') || '',
  });
  const today = dateValue(new Date());
  const query = params.toString();
  const { loading, error, data } = useResource(async () => (await api.get(`/admin/ventas${query ? `?${query}` : ''}`)).data, query);

  useEffect(() => {
    document.body.classList.add('admin-dashboard-mode');
    return () => document.body.classList.remove('admin-dashboard-mode');
  }, []);

  useEffect(() => {
    setFilters({
      usuario: params.get('usuario') || '',
      orden: params.get('orden') || 'desc',
      fecha_inicio: params.get('fecha_inicio') || '',
      fecha_fin: params.get('fecha_fin') || '',
    });
  }, [params]);

  const handleDateFilterChange = (key) => (event) => {
    const value = event.target.value;
    setFilters((current) => ({
      ...current,
      [key]: value && value > today ? today : value,
    }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    const next = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !(key === 'orden' && value === 'desc')) next[key] = value;
    });
    setParams(next);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const stats = data.stats || {};
  const users = stats.lista_usuarios || [];
  const hasFilters = ['usuario', 'orden', 'fecha_inicio', 'fecha_fin'].some((key) => params.get(key));

  return (
    <>
      {data && <AdminPrintLayout data={data} filters={filters} />}
      <div className="print:hidden admin-report-page min-h-screen px-6 pb-20 pt-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-5">
            <div className="h-14 w-2 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
            <div>
              <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-slate-900">
                Reporte Administrativo Global
                <span className="text-3xl">📊</span>
              </h1>
              <p className="mt-1 font-medium text-slate-500">Visualiza el rendimiento financiero y crecimiento de LearningCards</p>
            </div>
          </div>

          <button onClick={() => { document.title = 'Reporte_Administrativo'; window.print(); }} className="admin-report-pdf flex items-center gap-3 rounded-[1.5rem] bg-gradient-to-r from-orange-400 to-rose-500 px-8 py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-orange-500/30 transition-all hover:scale-105 active:scale-95">
            <ReportFileIcon className="h-6 w-6" />
            Descargar Reporte PDF
          </button>
        </div>

        <section className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          <AdminReportStat tone="emerald" label="Ventas Brutas" value={money(stats.total_ganancias)} icon={<AdminMoneyIcon className="h-8 w-8" />} />
          <AdminReportStat tone="indigo" label="Utilidad NovaLearn (15%)" value={money(stats.utilidad_novalearn)} icon={<AdminTrendIcon className="h-8 w-8" />} />
          <AdminReportStat tone="purple" label="Usuarios Activos" value={`${stats.total_usuarios || 0} Users`} icon={<AdminUsersIcon className="h-8 w-8" />} />
        </section>

        <div className="mb-12 flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="flex min-w-max items-center gap-4">
            <div className="h-10 w-2 rounded-full bg-gradient-to-b from-orange-400 to-rose-600 shadow-[0_0_10px_rgba(251,146,60,0.3)]" />
            <h3 className="text-2xl font-black tracking-tight text-slate-800">Historial de Transacciones</h3>
          </div>

          <form onSubmit={applyFilters} className="flex flex-1 flex-col items-center justify-between gap-6 lg:flex-row">
            <div className="admin-report-filters mx-auto flex flex-1 flex-wrap items-center justify-center gap-4 rounded-[2.2rem] border border-slate-100 bg-white/50 p-3 shadow-sm backdrop-blur-sm">
              <select value={filters.usuario} onChange={(event) => setFilters({ ...filters, usuario: event.target.value })} className="min-w-[200px] cursor-pointer appearance-none rounded-xl border border-indigo-500/10 bg-indigo-500/5 px-6 py-3.5 text-sm font-black text-slate-700 transition-all hover:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10">
                <option value="">Todos los Usuarios</option>
                {users.map((user) => <option key={user.IDUsuario} value={user.IDUsuario}>{user.UserName}</option>)}
              </select>

              <select value={filters.orden} onChange={(event) => setFilters({ ...filters, orden: event.target.value })} className="min-w-[180px] cursor-pointer appearance-none rounded-xl border border-indigo-500/10 bg-indigo-500/5 px-6 py-3.5 text-sm font-black text-slate-700 transition-all hover:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10">
                <option value="desc">Mas recientes</option>
                <option value="asc">Mas antiguos</option>
              </select>

              <label className="admin-report-date-field flex items-center gap-3 rounded-xl border border-rose-500/10 bg-rose-500/5 px-5 py-3 transition-all hover:border-rose-500/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-500/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Desde</span>
                <span className="relative flex items-center gap-2">
                  <input type="date" max={today} value={filters.fecha_inicio} onChange={handleDateFilterChange('fecha_inicio')} className="admin-report-date-input bg-transparent p-0 text-sm font-black text-slate-700 focus:ring-0" />
                  <CalendarMiniIcon className="admin-report-calendar-icon h-4 w-4" />
                </span>
              </label>

              <label className="admin-report-date-field flex items-center gap-3 rounded-xl border border-rose-500/10 bg-rose-500/5 px-5 py-3 transition-all hover:border-rose-500/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-500/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Hasta</span>
                <span className="relative flex items-center gap-2">
                  <input type="date" max={today} value={filters.fecha_fin} onChange={handleDateFilterChange('fecha_fin')} className="admin-report-date-input bg-transparent p-0 text-sm font-black text-slate-700 focus:ring-0" />
                  <CalendarMiniIcon className="admin-report-calendar-icon h-4 w-4" />
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" className="admin-report-apply flex items-center gap-3 rounded-[1.5rem] bg-gradient-to-r from-orange-400 to-rose-500 px-10 py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-orange-500/30 transition-all hover:scale-105 active:scale-95">
                <CheckMarkIcon className="h-5 w-5" />
                Aplicar
              </button>
              {hasFilters && (
                <button type="button" onClick={() => setParams({})} className="admin-report-clear flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500">
                  <CloseIcon className="h-7 w-7" />
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-report-table-wrap overflow-hidden rounded-[3rem] border border-slate-100 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="admin-report-table w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-7 text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Usuario</th>
                  <th className="px-10 py-7 text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Mazo Adquirido</th>
                  <th className="px-10 py-7 text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Fecha de Operacion</th>
                  <th className="px-10 py-7 text-right text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.ventas?.length ? data.ventas.map((sale) => (
                  <tr key={sale.id_Compra} className="group transition-colors hover:bg-slate-50/50">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 text-sm font-black text-indigo-500">
                          {(sale.UserName || 'A').slice(0, 1)}
                        </div>
                        <span className="text-lg font-black text-slate-700 transition-colors group-hover:text-indigo-600">{sale.UserName || 'Anonimo'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className="inline-block rounded-xl border border-transparent bg-slate-100 px-4 py-2 font-bold italic text-slate-500 transition-all group-hover:border-indigo-100 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                        {sale.titulo || 'N/A'}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-base font-medium text-slate-400">{adminLongDate(sale.fechaCompra)}</td>
                    <td className="px-10 py-7 text-right">
                      <span className="text-2xl font-black tracking-tighter text-emerald-500"><span className="mr-1 text-sm font-bold opacity-50">$</span>{Number(sale.precioPagado || 0).toFixed(2)}</span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="py-20 text-center text-sm font-bold italic text-slate-400">No hay transacciones registradas aun</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default ReporteGlobalAdmin;
