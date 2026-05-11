import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════ HERO ══ */}
      {/* Reducimos el padding superior (pt-8) para minimizar la separación con el header */}
      <section className="relative container mx-auto px-4 pt-8 pb-24 flex flex-col md:flex-row items-center gap-16 overflow-hidden">
        
        {/* Orbes de fondo */}
        <div className="hero-orb absolute w-96 h-96 bg-indigo-300 opacity-20 -top-20 -left-20 rounded-full blur-[70px] pointer-events-none animate-float" style={{ animationDelay: '-2s' }}></div>
        <div className="hero-orb absolute w-72 h-72 bg-pink-300 opacity-15 bottom-0 left-1/3 rounded-full blur-[70px] pointer-events-none animate-float" style={{ animationDelay: '-5s' }}></div>

        {/* Columna izquierda — texto */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 relative z-10"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-200/60 badge-shimmer mb-6 text-sm font-semibold text-purple-700">
            <span className="text-base">✨</span>
            Transforma tu forma de aprender
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tight text-gray-900">
              Domina cualquier
              <span className="animated-gradient-text"> materia</span>
              <br />con tarjetas inteligentes
            </h1>
          </div>

          {/* Subtítulo */}
          <div>
            <p className="text-xl text-gray-500 mb-8 leading-relaxed max-w-lg">
              Crea mazos, estudia con el modo interactivo, mantén tu racha y accede al marketplace de la comunidad.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <Link to="/register">
              <button
                id="hero-cta-primary"
                className="btn-cta-primary px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-lg font-bold shadow-xl hover:scale-105 active:scale-95 transition-transform duration-200 flex items-center gap-2"
              >
                Empezar gratis
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200 group-hover:scale-110 transition-transform duration-200">
                🎁
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">100% Gratis</div>
                <div className="text-xs text-gray-400">Para siempre</div>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-200">
                ⚡
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">Acceso inmediato</div>
                <div className="text-xs text-gray-400">Sin tarjeta de crédito</div>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform duration-200">
                🔥
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">Rachas diarias</div>
                <div className="text-xs text-gray-400">Construye hábitos</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Columna derecha — tarjeta demo */}
        <motion.div 
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex-1 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-3xl blur-3xl opacity-20"></div>
          <div className="relative card-float">
            <div className="absolute -top-5 -right-5 bg-white rounded-2xl px-4 py-2.5 shadow-xl border border-gray-100 flex items-center gap-2 z-20">
              <span className="text-lg">🔥</span>
              <div>
                <div className="text-xs font-black text-gray-800">Racha</div>
                <div className="text-xs text-orange-500 font-bold">7 días 🏆</div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl px-4 py-2.5 shadow-xl border border-gray-100 flex items-center gap-2 z-20">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-sm text-white">✓</div>
              <div>
                <div className="text-xs font-black text-gray-800">Correcto</div>
                <div className="text-xs text-emerald-500 font-bold">+10 puntos</div>
              </div>
            </div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/60">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold">
                  Modo Estudio
                </span>
                <span className="text-xs text-gray-400 font-semibold bg-gray-100 px-3 py-1 rounded-full">8 / 20</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <div className="progress-fill h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-inner p-8 text-center min-h-[180px] flex flex-col items-center justify-center mb-6 border border-gray-100">
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mb-4">Pregunta</span>
                <p className="text-2xl font-bold text-gray-800 mb-3 leading-snug">
                  ¿Cuál es la central energética de la célula?
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
                  </svg>
                  Haz clic para revelar la respuesta
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 transition-all font-bold text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  No lo sé
                </button>
                <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-green-200 hover:shadow-green-400/50 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                  ¡Lo sé!
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════ FEATURES ══ */}
      <section className="container mx-auto px-4 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-4 border border-indigo-100">
            🚀 Características
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            ¿Por qué
            <span className="animated-gradient-text"> LearningCards</span>?
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Todo lo que necesitas para estudiar mejor, en un solo lugar</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="feature-card bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-sm border border-green-100/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl mb-5 shadow-lg shadow-green-200">🎁</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Acceso Gratuito</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Mazos y tarjetas ilimitadas sin costos ocultos ni suscripciones. Gratis para siempre.</p>
          </div>

          <div className="feature-card bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-sm border border-blue-100/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl mb-5 shadow-lg shadow-blue-200">⚡</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Simple e Intuitivo</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Interfaz limpia pensada para que estudies sin distracciones ni fricción.</p>
          </div>

          <div className="feature-card bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 shadow-sm border border-purple-100/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl mb-5 shadow-lg shadow-purple-200">🛍️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Marketplace</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Accede a miles de mazos creados por la comunidad. Aprende de los mejores.</p>
          </div>

          <div className="feature-card bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 shadow-sm border border-orange-100/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl mb-5 shadow-lg shadow-orange-200">🔥</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Racha de Estudio</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Mantén tu racha diaria y construye hábitos de estudio constantes y duraderos.</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ CTA ══ */}
      <section className="container mx-auto px-4 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.5rem] p-14 text-center text-white shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white/90 text-sm font-semibold mb-6 border border-white/20">
              🎓 Únete a la comunidad
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              ¿Listo para transformar<br />tu aprendizaje?
            </h2>
            <p className="text-lg opacity-80 mb-10 max-w-xl mx-auto leading-relaxed">
              Únete a estudiantes de todo el mundo que dominan sus materias con LearningCards
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <button
                  id="cta-main-btn"
                  className="px-10 py-4 rounded-2xl bg-white text-purple-700 text-lg font-black shadow-2xl hover:shadow-white/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
                >
                  Empezar gratis
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </button>
              </Link>
            </div>
            <p className="text-xs mt-6 opacity-50">Sin tarjeta de crédito &nbsp;·&nbsp; Gratis para siempre &nbsp;·&nbsp; Cancela cuando quieras</p>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
