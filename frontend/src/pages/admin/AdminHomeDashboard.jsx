import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { ErrorBox, Loading, useResource } from './AdminShared';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const adminShortDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const AdminMetric = ({ label, value, text, icon, tone = 'purple' }) => (
  <div className="admin-metric-card group rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl transition-all duration-500 hover:scale-105">
    <div className="mb-6 flex items-center justify-between">
      <div className={`admin-metric-icon admin-metric-${tone} rounded-2xl p-4 transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
    </div>
    <h2 className="mb-1 text-3xl font-black text-slate-900">{value}</h2>
    <p className="text-xs font-medium tracking-wide text-slate-500">{text}</p>
  </div>
);

const AdminLink = ({ to, icon, children }) => (
  <Link to={to} className="admin-action-btn flex w-full items-center rounded-2xl border border-white/10 bg-white/10 px-8 py-5 shadow-lg transition-all duration-300 hover:border-white/30 hover:bg-white/20">
    <span className="admin-action-icon mr-4 text-2xl transition-transform duration-300">{icon}</span>
    <span className="text-sm font-black uppercase tracking-widest">{children}</span>
  </Link>
);

const AdminMoneyIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AdminUsersIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const AdminTrendIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const AdminInfoIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DeckIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;

const AdminHomeDashboard = () => {
  useEffect(() => {
    document.body.classList.add('admin-dashboard-mode');
    return () => document.body.classList.remove('admin-dashboard-mode');
  }, []);

  const { loading, error, data } = useResource(async () => (await api.get('/admin/dashboard')).data);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const recentSales = data.comprasRecientes || [];
  return (
    <div className="admin-dashboard-page mx-auto max-w-[1536px] px-6 py-8">
      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AdminMetric tone="emerald" label="Ganancias" value={money(data.totalGanancias)} text="Ingresos totales brutos" icon={<AdminMoneyIcon className="h-6 w-6" />} />
        <AdminMetric tone="cyan" label="Comunidad" value={data.stats.usuarios} text="Usuarios en la plataforma" icon={<AdminUsersIcon className="h-6 w-6" />} />
        <AdminMetric tone="purple" label="Contenido" value={data.stats.mazos} text="Mazos creados totales" icon={<DeckIcon className="h-6 w-6" />} />
        <AdminMetric tone="orange" label="Ventas" value={data.stats.ventas} text="Transacciones exitosas" icon={<AdminTrendIcon className="h-6 w-6" />} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="admin-sales-panel overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-50 p-10">
            <div className="flex items-center gap-4">
              <div className="h-8 w-2 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
              <h3 className="text-2xl font-black text-slate-900">Ventas Recientes</h3>
            </div>
            <Link to="/admin/ventas" className="admin-view-all rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest text-purple-600 transition-all">Ver todas</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-sales-table w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Comprador</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Mazo</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Monto</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentSales.map((sale) => (
                  <tr key={sale.id_Compra} className="group transition-colors hover:bg-slate-50/50">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-600">
                          {(sale.UserName || 'A').slice(0, 1)}
                        </div>
                        <span className="font-bold text-slate-700 transition-colors group-hover:text-indigo-600">{sale.UserName || 'Anonimo'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-slate-500 transition-colors group-hover:text-slate-700">{sale.titulo || 'Mazo borrado'}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="admin-amount font-black text-lg">{money(sale.precioPagado)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold tracking-tighter text-slate-400">{adminShortDate(sale.fechaCompra)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="admin-actions-panel relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 p-10 text-white shadow-2xl">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-transform duration-700" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-black/20 blur-3xl" />
            <h3 className="relative z-10 mb-8 text-2xl font-black">Acciones de Control</h3>
            <div className="relative z-10 grid gap-5">
              <AdminLink to="/admin/users" icon="👤">Gestionar Usuarios</AdminLink>
              <AdminLink to="/admin/mazos" icon="🃏">Gestionar Mazos</AdminLink>
              <AdminLink to="/admin/ventas" icon="📊">Reporte Completo</AdminLink>
            </div>
          </div>

          <div className="admin-info-panel flex items-center gap-4 rounded-[2.5rem] border border-dashed border-slate-200 bg-slate-50 p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
              <AdminInfoIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight text-slate-600">Panel de Control Admin</h4>
              <p className="text-xs font-medium text-slate-400">Sistema v2.5.0 • Operativo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHomeDashboard;
