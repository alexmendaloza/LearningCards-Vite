import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { ErrorBox, Loading, LockIcon, useResource } from './AdminShared';

/**
 * Panel de administracion para la gestion de usuarios.
 * Permite al admin listar y cambiar contrasenas o roles de otros usuarios.
 */
export const GestionUsuarios = () => {
  const [refresh, setRefresh] = useState(0);
  const { loading, error, data } = useResource(async () => (await api.get('/admin/users')).data, [refresh]);
  const [usuarios, setUsuarios] = useState([]);
  const promote = async (id, name) => { if (confirm(`Ascender a ${name} a administrador?`)) { await api.patch(`/admin/users/${id}/toggle`); setRefresh((value) => value + 1); } };
  const remove = async (id, name) => {
    if (confirm(`Desactivar la cuenta de ${name}?`)) {
      await api.delete(`/admin/users/${id}`);
      setUsuarios((current) => current.map((user) => (Number(user.IDUsuario) === Number(id) ? { ...user, activo: 0 } : user)));
      setRefresh((value) => value + 1);
    }
  };
  const restore = async (id, name) => {
    if (confirm(`Restaurar la cuenta de ${name}?`)) {
      await api.patch(`/admin/users/${id}/restore`);
      setUsuarios((current) => current.map((user) => (Number(user.IDUsuario) === Number(id) ? { ...user, activo: 1 } : user)));
      setRefresh((value) => value + 1);
    }
  };

  useEffect(() => {
    setUsuarios(data?.usuarios || []);
  }, [data]);

  useEffect(() => {
    document.body.classList.add('admin-dashboard-mode');
    return () => document.body.classList.remove('admin-dashboard-mode');
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  return (
    <div className="admin-users-page mx-auto max-w-[1536px] px-6 py-8">
      <div className="mb-10 flex items-center gap-4">
        <div className="h-10 w-2 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
        <h1 className="text-3xl font-black text-slate-900">Gestión de Usuarios</h1>
      </div>

      <div className="admin-users-table-wrap overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-xl">
        <table className="admin-users-table w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-6 text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Usuario</th>
              <th className="px-8 py-6 text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Email</th>
              <th className="px-8 py-6 text-center text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Rol Actual</th>
              <th className="px-8 py-6 text-center text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Estado</th>
              <th className="px-8 py-6 text-right text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {usuarios.map((user) => {
              const isInactive = Number(user.activo) === 0 || user.activo === false;

              return (
              <tr key={user.IDUsuario} className="group transition-colors hover:bg-slate-50/50">
                <td className="px-8 py-7">
                  <div className="flex items-center">
                    <div className="mr-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl font-black text-indigo-600 transition-transform group-hover:scale-110">
                      {user.UserName?.slice(0, 1)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-slate-700 transition-colors group-hover:text-indigo-600">{user.UserName}</span>
                      <span className="text-[13px] font-bold uppercase tracking-tight text-slate-400">ID: #{user.IDUsuario}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-7 text-base font-medium text-slate-500">{user.email}</td>
                <td className="px-8 py-7 text-center">
                  <span className={`admin-role-badge ${user.rol === 'admin' ? 'admin-role-admin' : 'admin-role-user'}`}>
                    {user.rol}
                  </span>
                </td>
                <td className="px-8 py-7 text-center">
                  <span className={`admin-user-status ${isInactive ? 'admin-user-status-inactive' : 'admin-user-status-active'}`}>
                    {isInactive ? 'Desactivado' : 'Activo'}
                  </span>
                </td>
                <td className="px-8 py-7 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {user.rol !== 'admin' ? (
                      <>
                        {!isInactive && <button onClick={() => promote(user.IDUsuario, user.UserName)} className="admin-user-action admin-user-promote uppercase tracking-widest">Promover</button>}
                        {isInactive ? (
                          <button onClick={() => restore(user.IDUsuario, user.UserName)} className="admin-user-action admin-user-restore uppercase tracking-widest">Restaurar</button>
                        ) : (
                          <button onClick={() => remove(user.IDUsuario, user.UserName)} className="admin-user-action admin-user-delete uppercase tracking-widest">Eliminar</button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-300">
                        <LockIcon className="h-5 w-5" />
                        <span className="text-[12px] font-black uppercase italic tracking-widest opacity-60">Protegido</span>
                      </div>
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

export default GestionUsuarios;
