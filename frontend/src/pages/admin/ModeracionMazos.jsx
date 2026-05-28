import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { CheckMarkIcon, CloseIcon, ErrorBox, Loading, SearchIcon, UserMiniIcon, useResource } from './AdminShared';

/**
 * Panel de administracion de mazos.
 * Lista todos los mazos en la plataforma para moderacion y mantenimiento.
 */
export const ModeracionMazos = () => {
  const [refresh, setRefresh] = useState(0);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: params.get('search') || '',
    autor: params.get('autor') || '',
    estado: params.get('estado') || '',
    coleccion: params.get('coleccion') || '',
  });
  const query = params.toString();
  const { loading, error, data } = useResource(async () => (await api.get(`/admin/mazos${query ? `?${query}` : ''}`)).data, refresh, query);
  const remove = async (id) => { if (confirm('Borrar mazo?')) { await api.delete(`/admin/mazos/${id}`); setRefresh((value) => value + 1); } };
  const restore = async (id) => { if (confirm('Recuperar mazo?')) { await api.patch(`/admin/mazos/${id}/restore`); setRefresh((value) => value + 1); } };

  useEffect(() => {
    document.body.classList.add('admin-dashboard-mode');
    return () => document.body.classList.remove('admin-dashboard-mode');
  }, []);

  useEffect(() => {
    setFilters({
      search: params.get('search') || '',
      autor: params.get('autor') || '',
      estado: params.get('estado') || '',
      coleccion: params.get('coleccion') || '',
    });
  }, [params]);

  const applyFilters = (event) => {
    event.preventDefault();
    const next = {};
    Object.entries(filters).forEach(([key, value]) => { if (value) next[key] = value; });
    setParams(next);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const hasFilters = ['search', 'autor', 'estado', 'coleccion'].some((key) => params.get(key));
  return (
    <div className="admin-mazos-page mx-auto max-w-[1536px] px-6 py-8">
      <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="h-10 w-2 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Moderación de Mazos</h1>
        </div>

        <form onSubmit={applyFilters} className="flex flex-1 flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="admin-mazos-filters mx-auto flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white/50 p-2 shadow-sm backdrop-blur-sm">
            <label className="group relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500">
                <SearchIcon className="h-4 w-4" />
              </span>
              <input
                name="search"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                placeholder="Título..."
                className="w-40 rounded-xl border-none bg-slate-50 py-2 pl-10 pr-4 text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>

            <label className="group relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500">
                <UserMiniIcon className="h-4 w-4" />
              </span>
              <input
                name="autor"
                value={filters.autor}
                onChange={(event) => setFilters({ ...filters, autor: event.target.value })}
                placeholder="Autor..."
                className="w-32 rounded-xl border-none bg-slate-50 py-2 pl-10 pr-4 text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>

            <select name="estado" value={filters.estado} onChange={(event) => setFilters({ ...filters, estado: event.target.value })} className="cursor-pointer rounded-xl border-none bg-slate-50 px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20">
              <option value="">Estado</option>
              <option value="publicado">Publicado</option>
              <option value="privado">Privado</option>
            </select>

            <select name="coleccion" value={filters.coleccion} onChange={(event) => setFilters({ ...filters, coleccion: event.target.value })} className="cursor-pointer rounded-xl border-none bg-slate-50 px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20">
              <option value="">Colección</option>
              <option value="activo">Activos</option>
              <option value="borrado">Borrados</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="admin-mazos-apply flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 to-rose-500 px-8 py-3 font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95">
              <CheckMarkIcon className="h-5 w-5" />
              <span>Aplicar</span>
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={() => setParams({})}
                className="admin-mazos-clear flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                title="Limpiar filtros"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-mazos-table-wrap overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-xl">
        <table className="admin-mazos-table w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Título</th>
              <th className="px-8 py-5 text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Autor</th>
              <th className="px-8 py-5 text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Colección</th>
              <th className="px-8 py-5 text-center text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Tarjetas</th>
              <th className="px-8 py-5 text-center text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Estado</th>
              <th className="px-8 py-5 text-right text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.mazos.map((mazo) => {
              const isDeleted = Number(mazo.enColeccion) === 0 || mazo.enColeccion === false;

              return (
                <tr key={mazo.IDMazo} className="group transition-colors hover:bg-slate-50/50">
                  <td className="px-8 py-7">
                    <span className="inline-block text-lg font-black text-slate-700 transition-all group-hover:translate-x-1 group-hover:text-indigo-500">{mazo.titulo}</span>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 text-xs font-black text-indigo-500">
                        {(mazo.UserName || 'S').slice(0, 1)}
                      </div>
                      <span className="text-base font-medium text-slate-500 transition-colors group-hover:text-slate-700">{mazo.UserName || 'Desconocido'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    {isDeleted ? (
                      <span className="admin-badge admin-badge-deleted">
                        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                        Borrado
                      </span>
                    ) : (
                      <span className="admin-badge admin-badge-active">
                        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-7 text-center">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 text-sm font-black text-indigo-600 transition-transform group-hover:scale-110">{mazo.tarjetas_count}</span>
                  </td>
                  <td className="px-8 py-7 text-center">
                    {Number(mazo.publico) === 1 ? <span className="admin-badge admin-badge-public">Publicado</span> : <span className="admin-badge admin-badge-private">Privado</span>}
                  </td>
                  <td className="px-8 py-7 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => navigate(`/admin/mazos/${mazo.IDMazo}/tarjetas`)} className="admin-table-action admin-table-view uppercase tracking-widest">Ver</button>
                      {isDeleted ? (
                        <button onClick={() => restore(mazo.IDMazo)} className="admin-table-action admin-table-restore uppercase tracking-widest">Recuperar</button>
                      ) : (
                        <button onClick={() => remove(mazo.IDMazo)} className="admin-table-action admin-table-delete uppercase tracking-widest">Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModeracionMazos;
