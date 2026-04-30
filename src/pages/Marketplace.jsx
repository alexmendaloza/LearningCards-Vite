import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const Marketplace = () => {
  const [publicaciones, setPublicaciones] = useState([]);
  const [categorias, setCategorias] = useState(['Idiomas', 'Ciencia', 'Tecnología', 'Historia', 'Medicina', 'Otros']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [orden, setOrden] = useState('popular');

  const fetchMarketplace = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoria) params.append('categoria', categoria);
      if (precio) params.append('precio', precio);
      if (orden) params.append('orden', orden);

      const response = await api.get(`/user/marketplace?${params.toString()}`);
      
      // Si el backend devuelve HTML, simulamos datos vacíos por ahora
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.warn("Marketplace: Backend devolvió HTML en lugar de JSON.");
        setPublicaciones([]);
      } else {
        setPublicaciones(response.data.publicaciones || []);
        if (response.data.categorias) setCategorias(response.data.categorias);
      }
    } catch (err) {
      console.error("Marketplace fetch error:", err);
      setError("No se pudo cargar el marketplace. Verifica la conexión con Laravel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, [categoria, precio, orden]); // Auto-fetch al cambiar filtros (excepto search que requiere submit)

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMarketplace();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 pb-20">
      
      {/* ═══════════════ HERO ═══════════════ */}
      <div className="bg-white/70 backdrop-blur border-b border-purple-100">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🛍️</span>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Marketplace
              </h1>
            </div>
            <p className="text-gray-500 ml-12">Descubre y adquiere mazos de flashcards creados por la comunidad</p>
          </div>
          
          <Link to="/dashboard">
            <button className="px-6 py-2.5 rounded-2xl bg-white border border-indigo-100 text-indigo-600 font-bold shadow-sm hover:shadow-md hover:bg-indigo-50 transition-all flex items-center gap-2">
              🏠 Volver al Dashboard
            </button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        
        {/* ═══════════════ BARRA DE FILTROS ═══════════════ */}
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-purple-100 p-5 mb-8">
          <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4 items-center">
            
            {/* Buscador */}
            <div className="relative flex-1 w-full">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, autor o tema..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Dropdown Categoría */}
              <select 
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="flex-1 lg:flex-none bg-gray-50/50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
              >
                <option value="">Todas las Categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Dropdown Precio */}
              <select 
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="flex-1 lg:flex-none bg-gray-50/50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
              >
                <option value="">Todos los Precios</option>
                <option value="gratis">Solo Gratis</option>
                <option value="pago">Solo de Pago</option>
              </select>

              {/* Dropdown Orden */}
              <select 
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="flex-1 lg:flex-none bg-gray-50/50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
              >
                <option value="popular">Más Populares</option>
                <option value="valorados">Mejor Valorados</option>
                <option value="precio_asc">Precio: Menor a Mayor</option>
                <option value="precio_desc">Precio: Mayor a Menor</option>
              </select>

              <button 
                type="submit"
                className="w-full lg:w-auto px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>

        {/* ═══════════════ CONTENIDO ═══════════════ */}
        {loading ? (
          <div className="text-center py-20 animate-pulse">
            <div className="text-4xl mb-4">🛒</div>
            <p className="text-gray-500 font-medium">Sincronizando con el Marketplace...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-10 text-center text-red-600">
            {error}
          </div>
        ) : publicaciones.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {publicaciones.map(pub => (
              <PublicacionCard key={pub.id_Publ} pub={pub} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-indigo-100">
            <div className="text-7xl mb-6">🔍</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No encontramos mazos</h3>
            <p className="text-gray-500 mb-8">Intenta con otros filtros o términos de búsqueda</p>
            <button 
              onClick={() => { setSearch(''); setCategoria(''); setPrecio(''); setOrden('popular'); }}
              className="px-8 py-3 bg-white border border-indigo-200 text-indigo-600 rounded-2xl font-bold shadow-sm hover:bg-indigo-50 transition-all"
            >
              ✕ Limpiar todos los filtros
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

const PublicacionCard = ({ pub }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="group bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-2 transition-all duration-300 flex flex-col h-full"
  >
    <div className="relative h-44 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 overflow-hidden">
      {pub.imagen_url ? (
        <img src={pub.imagen_url} alt={pub.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      ) : (
        <div className="h-full flex items-center justify-center text-6xl opacity-30">📚</div>
      )}
      
      <div className="absolute top-4 right-4">
        {pub.pago ? (
          <span className="bg-white text-indigo-600 text-xs font-black px-3 py-1.5 rounded-full shadow-lg border border-indigo-50">
            ${pub.precio}
          </span>
        ) : (
          <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
            GRATIS
          </span>
        )}
      </div>

      {pub.categoria && (
        <div className="absolute top-4 left-4">
          <span className="bg-black/20 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
            {pub.categoria}
          </span>
        </div>
      )}
    </div>

    <div className="p-6 flex flex-col flex-1">
      <h3 className="font-bold text-gray-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
        {pub.titulo || 'Mazo de Estudio'}
      </h3>
      <p className="text-xs text-gray-400 mb-4 line-clamp-2 flex-1">
        {pub.descripcion || 'Sin descripción disponible para este mazo.'}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400">★</span>
          <span className="text-xs font-bold text-gray-700">{pub.valoracion || '5.0'}</span>
          <span className="text-[10px] text-gray-400">({pub.reviews || 0})</span>
        </div>
        <button className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors">
          Ver Detalles →
        </button>
      </div>
    </div>
  </motion.div>
);

export default Marketplace;
