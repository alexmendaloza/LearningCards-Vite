/**
 * @fileoverview Componente para la generación, visualización y descarga de reportes
 * de progreso del usuario. Incluye métricas globales e historial de sesiones de estudio.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, Target, Flame, Calendar, Trophy, Download, Activity, CheckCircle2, XCircle, Eye } from 'lucide-react';
import api from '../api/axios';

const REPORT_FALLBACK_DATE = '2026-01-01T00:00:00.000Z';

const ErrorBox = ({ message }) => message ? (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
    {message}
  </div>
) : null;

const Loading = ({ text = 'Cargando...' }) => (
  <div className="flex flex-col items-center justify-center py-24">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mb-4" />
    <div className="text-sm font-semibold text-slate-500 animate-pulse">{text}</div>
  </div>
);

/**
 * Componente oculto en pantalla pero visible al imprimir.
 * Genera el diseño del PDF cuando el usuario hace clic en "Descargar PDF" o "Previsualizar".
 */
const PrintLayout = ({ data }) => {
  const { usuario, totalSesiones, totalTarjetasEstudiadas, promedioPrecision, totalMazos, sesionesRecientes, filtroEtiqueta } = data;
  return (
    <div className="hidden print:block bg-white text-black text-[11px] leading-[1.55] uppercase font-sans p-8">
      <div className="text-center bg-[#4c1d95] text-white border-b-4 border-[#f5b82e] rounded-2xl p-6 mb-8 break-inside-avoid font-extrabold">
        <h1 className="m-0 text-white text-3xl font-extrabold tracking-wide">LEARNINGCARDS - REPORTE DE PROGRESO</h1>
        <p className="mt-2 text-[11px]">USUARIO: {usuario.NombreCompleto?.toUpperCase() || 'USUARIO'}</p>
        <p className="mt-1 text-[11px]">FILTROS: {filtroEtiqueta?.toUpperCase() || 'SIN FILTROS'}</p>
        <p className="mt-1 text-[11px]">FECHA DE GENERACIÓN: {new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</p>
      </div>

      <table className="w-full border-separate border-spacing-3 -mx-3 mb-8 break-inside-avoid">
        <tbody>
          <tr>
            <td className="w-1/3 p-0">
              <div className="bg-[#fbf7ff] border border-[#d8b4fe] border-t-4 border-t-[#7c3aed] rounded-xl p-4 text-center font-bold text-black">
                <div className="text-[9px] mb-2 tracking-wide">RACHA ACTUAL</div>
                <div className="text-lg">{usuario.rachaActual || 0} DÍAS</div>
              </div>
            </td>
            <td className="w-1/3 p-0">
              <div className="bg-[#fbf7ff] border border-[#d8b4fe] border-t-4 border-t-[#7c3aed] rounded-xl p-4 text-center font-bold text-black">
                <div className="text-[9px] mb-2 tracking-wide">SESIONES TOTALES</div>
                <div className="text-lg">{totalSesiones}</div>
              </div>
            </td>
            <td className="w-1/3 p-0">
              <div className="bg-[#fbf7ff] border border-[#d8b4fe] border-t-4 border-t-[#7c3aed] rounded-xl p-4 text-center font-bold text-black">
                <div className="text-[9px] mb-2 tracking-wide">NIVEL DE RACHA</div>
                <div className="text-lg">{usuario.nivel?.nombreNivel || 'NOVATO'}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td className="w-1/3 p-0 pt-2">
              <div className="bg-[#fbf7ff] border border-[#d8b4fe] border-t-4 border-t-[#7c3aed] rounded-xl p-4 text-center font-bold text-black">
                <div className="text-[9px] mb-2 tracking-wide">TARJETAS ESTUDIADAS</div>
                <div className="text-lg">{totalTarjetasEstudiadas}</div>
              </div>
            </td>
            <td className="w-1/3 p-0 pt-2">
              <div className="bg-[#fbf7ff] border border-[#d8b4fe] border-t-4 border-t-[#7c3aed] rounded-xl p-4 text-center font-bold text-black">
                <div className="text-[9px] mb-2 tracking-wide">PRECISIÓN PROMEDIO</div>
                <div className="text-lg">{promedioPrecision}%</div>
              </div>
            </td>
            <td className="w-1/3 p-0 pt-2">
              <div className="bg-[#fbf7ff] border border-[#d8b4fe] border-t-4 border-t-[#7c3aed] rounded-xl p-4 text-center font-bold text-black">
                <div className="text-[9px] mb-2 tracking-wide">TOTAL DE MAZOS</div>
                <div className="text-lg">{totalMazos}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-[#2e1065] text-xl font-extrabold text-left mt-8 mb-4 pb-2 border-b-2 border-[#c084fc] relative break-after-avoid after:content-[''] after:block after:w-32 after:h-0.5 after:mt-2 after:bg-[#f5b82e]">
        🏆 LOGROS OBTENIDOS
      </h2>
      <div className="mb-8">
        {usuario.logros?.length > 0 ? usuario.logros.map((logro, idx) => (
          <div key={idx} className="mb-3 p-3 bg-[#fffdf7] border border-[#f3d27a] border-l-4 border-l-[#f5b82e] rounded-xl font-medium break-inside-avoid">
            <strong>{logro.nombre}</strong> - {logro.descripcion}<br/>
            <span className="text-[#64748b] text-[10px]">OBTENIDO EL: {new Date(logro.pivot?.fecha_obtenido || REPORT_FALLBACK_DATE).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        )) : (
          <p>AÚN NO SE HAN OBTENIDO LOGROS.</p>
        )}
      </div>

      <h2 className="text-[#2e1065] text-xl font-extrabold text-left mt-8 mb-4 pb-2 border-b-2 border-[#c084fc] relative break-after-avoid after:content-[''] after:block after:w-32 after:h-0.5 after:mt-2 after:bg-[#f5b82e]">
        📅 HISTORIAL DE ESTUDIO
      </h2>
      <table className="w-full border-collapse mb-8 break-inside-auto">
        <thead className="table-header-group">
          <tr>
            <th className="bg-[#4c1d95] text-left p-3 text-[9px] text-white font-extrabold tracking-wide border-b-2 border-[#f5b82e]">FECHA</th>
            <th className="bg-[#4c1d95] text-left p-3 text-[9px] text-white font-extrabold tracking-wide border-b-2 border-[#f5b82e]">MAZO</th>
            <th className="bg-[#4c1d95] text-left p-3 text-[9px] text-white font-extrabold tracking-wide border-b-2 border-[#f5b82e]">ACIERTOS</th>
            <th className="bg-[#4c1d95] text-left p-3 text-[9px] text-white font-extrabold tracking-wide border-b-2 border-[#f5b82e]">FALLOS</th>
            <th className="bg-[#4c1d95] text-left p-3 text-[9px] text-white font-extrabold tracking-wide border-b-2 border-[#f5b82e]">TOTAL</th>
            <th className="bg-[#4c1d95] text-left p-3 text-[9px] text-white font-extrabold tracking-wide border-b-2 border-[#f5b82e]">PRECISIÓN</th>
          </tr>
        </thead>
        <tbody>
          {sesionesRecientes?.length > 0 ? sesionesRecientes.map((sesion, idx) => {
            const precision = sesion.totalTarjetas > 0 ? Math.round((sesion.aciertos / sesion.totalTarjetas) * 100) : 0;
            return (
              <tr key={idx} className="break-inside-avoid even:bg-[#faf5ff]">
                <td className="p-3 border-b border-[#eadcff]">{new Date(sesion.fechaIni).toLocaleString('es-MX', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="p-3 border-b border-[#eadcff]">{sesion.mazo?.titulo || 'MAZO ELIMINADO'}</td>
                <td className="p-3 border-b border-[#eadcff]">{sesion.aciertos}</td>
                <td className="p-3 border-b border-[#eadcff]">{sesion.fallos}</td>
                <td className="p-3 border-b border-[#eadcff]">{sesion.totalTarjetas}</td>
                <td className="p-3 border-b border-[#eadcff]">{precision}%</td>
              </tr>
            );
          }) : (
            <tr><td colSpan="6" className="p-3 border-b border-[#eadcff] text-center">NO HAY SESIONES RECIENTES</td></tr>
          )}
        </tbody>
      </table>

      <div className="mt-10 pt-4 border-t-2 border-[#e9d5ff] text-center text-[10px] font-bold">
        ESTE REPORTE FUE GENERADO AUTOMÁTICAMENTE POR LA PLATAFORMA LEARNINGCARDS.
      </div>
    </div>
  );
};

/**
 * Tarjeta de estadística visual para el dashboard del reporte.
 * Muestra un valor, un título y un ícono con gradientes personalizados.
 */
const StatCard = ({ title, value, icon, colorClass, gradientClass, delay = '0s' }) => (
  <div 
    className={`relative overflow-hidden rounded-2xl p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${colorClass}`}
    style={{ animation: `fadeInUp 0.6s ease-out ${delay} both` }}
  >
    <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-xl ${gradientClass}`} />
    <div className="relative z-10 flex items-center gap-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60 shadow-sm backdrop-blur-sm`}>
        {React.createElement(icon, { className: 'h-5 w-5' })}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 leading-tight">{title}</p>
        <h3 className="mt-0.5 text-xl font-black tracking-tighter leading-none">{value}</h3>
      </div>
    </div>
  </div>
);

/**
 * Página principal del reporte de progreso.
 * Descarga los datos del backend basándose en filtros de fecha y renderiza
 * la vista web y la vista de impresión (`PrintLayout`).
 */
export const ReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    const params = new URLSearchParams();
    if (filterYear) params.append('year', filterYear);
    if (filterMonth) params.append('month', filterMonth);
    if (filterDay) params.append('day', filterDay);

    api.get(`/user/report?${params.toString()}`)
      .then(res => {
        if (mounted) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          // If the endpoint doesn't exist yet, we can mock the data or show error
          console.error(err);
          setError(err.response?.data?.message || 'Error al cargar el reporte de progreso.');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [filterYear, filterMonth, filterDay]);

  if (loading) return <Loading text="Generando tu reporte de progreso..." />;
  if (error) return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <ErrorBox message={error} />
      <div className="mt-8 text-center">
        <Link to="/user/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-600">
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );

  if (!data) return null;

  const {
    usuario = {},
    totalSesiones = 0,
    totalTarjetasEstudiadas = 0,
    promedioPrecision = 0,
    totalMazos = 0,
    sesionesRecientes = [],
    filtroEtiqueta: _filtroEtiqueta = 'Sin Filtros'
  } = data;

  return (
    <>
      <PrintLayout data={data} />
      
      <div className="print:hidden min-h-screen bg-slate-50/50 pb-20">
      <div className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200">
                <Activity className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Reporte de Progreso</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Usuario: <span className="font-bold text-indigo-600">{usuario.NombreCompleto?.toUpperCase() || 'USUARIO'}</span>
                </p>
              </div>
            </div>
              <div className="flex flex-wrap items-center gap-2 print:hidden mb-4 sm:mb-0">
                <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  <option value="">Cualquier Año</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  <option value="">Cualquier Mes</option>
                  {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es', { month: 'long' }).toUpperCase()}</option>)}
                </select>
                <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  <option value="">Cualquier Día</option>
                  {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
              </div>
              
              <div className="flex items-center gap-3 print:hidden">
              <div className="text-right hidden sm:block mr-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Fecha de Generación</p>
                <p className="text-sm font-semibold text-slate-700">{new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</p>
              </div>
              <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-indigo-50 text-indigo-700 px-5 py-2.5 text-sm font-bold border border-indigo-100 shadow-sm transition-all hover:bg-indigo-100 hover:-translate-y-0.5">
                <Eye className="h-4 w-4" />
                Previsualizar
              </button>
              <button onClick={() => {
                document.title = `Reporte_${usuario.NombreCompleto || 'Usuario'}`;
                window.print();
              }} className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-600 hover:shadow-indigo-200 hover:-translate-y-0.5">
                <Download className="h-4 w-4" />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl space-y-12">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-4">
          <StatCard 
            title="Racha Actual" 
            value={`${usuario.rachaActual || 0} DÍAS`}
            icon={Flame} 
            colorClass="bg-gradient-to-br from-orange-50 to-orange-100 text-orange-900 border border-orange-200" 
            gradientClass="bg-orange-400"
            delay="0s"
          />
          <StatCard 
            title="Nivel Actual" 
            value={usuario.nivel?.nombreNivel || 'NOVATO'}
            icon={Trophy} 
            colorClass="bg-gradient-to-br from-amber-50 to-yellow-100 text-amber-900 border border-amber-200" 
            gradientClass="bg-yellow-400"
            delay="0.1s"
          />
          <StatCard 
            title="Precisión Promedio" 
            value={`${promedioPrecision}%`}
            icon={Target} 
            colorClass="bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-900 border border-emerald-200" 
            gradientClass="bg-emerald-400"
            delay="0.2s"
          />
          <StatCard 
            title="Sesiones Totales" 
            value={totalSesiones}
            icon={Calendar} 
            colorClass="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 border border-blue-200" 
            gradientClass="bg-blue-400"
            delay="0.3s"
          />
          <StatCard 
            title="Tarjetas Estudiadas" 
            value={totalTarjetasEstudiadas}
            icon={BookOpen} 
            colorClass="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-900 border border-purple-200" 
            gradientClass="bg-purple-400"
            delay="0.4s"
          />
          <StatCard 
            title="Total de Mazos" 
            value={totalMazos}
            icon={Award} 
            colorClass="bg-gradient-to-br from-pink-50 to-pink-100 text-pink-900 border border-pink-200" 
            gradientClass="bg-pink-400"
            delay="0.5s"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Achievements List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-indigo-100 pb-4">
              <Trophy className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Logros Obtenidos</h2>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {usuario.logros?.length > 0 ? usuario.logros.map((logro, idx) => (
                <div 
                  key={logro.id || idx} 
                  className="group relative overflow-hidden rounded-2xl bg-white border border-amber-200 p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-300"
                >
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-amber-400 to-orange-500" />
                  <h3 className="font-bold text-slate-800 text-sm mb-1 uppercase">{logro.nombre}</h3>
                  <p className="text-xs text-slate-500 mb-3">{logro.descripcion}</p>
                  <div className="inline-block rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Obtenido: {new Date(logro.pivot?.fecha_obtenido || REPORT_FALLBACK_DATE).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <Award className="h-12 w-12 text-slate-300 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-bold text-slate-500 uppercase">Aún no hay logros</p>
                  <p className="text-xs text-slate-400 mt-1">¡Sigue estudiando para desbloquearlos!</p>
                </div>
              )}
            </div>
          </div>

          {/* Study History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-indigo-100 pb-4">
              <Calendar className="h-6 w-6 text-indigo-500" />
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Historial de Estudio</h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-indigo-50/50 text-xs font-black uppercase tracking-widest text-indigo-900 border-b border-indigo-100">
                    <tr>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4">Mazo</th>
                      <th className="px-6 py-4 text-center">Aciertos</th>
                      <th className="px-6 py-4 text-center">Fallos</th>
                      <th className="px-6 py-4 text-center">Total</th>
                      <th className="px-6 py-4 text-right">Precisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                    {sesionesRecientes?.length > 0 ? sesionesRecientes.map((sesion, idx) => {
                      const precision = sesion.totalTarjetas > 0 ? Math.round((sesion.aciertos / sesion.totalTarjetas) * 100) : 0;
                      return (
                        <tr key={sesion.id || idx} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-6 py-4 whitespace-nowrap text-xs">
                            {new Date(sesion.fechaIni).toLocaleString('es-MX', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-800 uppercase">{sesion.mazo?.titulo || 'Mazo Eliminado'}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold">
                              {sesion.aciertos}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-bold">
                              {sesion.fallos}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold">{sesion.totalTarjetas}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${precision >= 80 ? 'bg-emerald-500' : precision >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                  style={{ width: `${precision}%` }}
                                />
                              </div>
                              <span className="font-black text-slate-800 w-8">{precision}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center">
                            <Activity className="h-10 w-10 opacity-20 mb-3" />
                            <p className="font-bold uppercase text-xs">No hay sesiones recientes</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      </div>
    </>
  );
};

export default ReportPage;
