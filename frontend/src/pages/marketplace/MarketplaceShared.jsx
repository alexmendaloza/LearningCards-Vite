import React from 'react';
import { BookOpen, CheckCircle2, Sparkles } from 'lucide-react';

export const money = (value) => `$${Number(value || 0).toFixed(2)}`;

export const AcquisitionSuccessModal = ({ mode = 'gratis', deckTitle, creatorName, cardCount, message = '', onDashboard, onMarketplace }) => {
  const paid = mode === 'pago';
  const particles = [
    ['left-[9%] top-[16%]', 'bg-emerald-300', '0s'],
    ['left-[20%] top-[72%]', 'bg-indigo-300', '.15s'],
    ['left-[35%] top-[10%]', 'bg-fuchsia-300', '.3s'],
    ['left-[62%] top-[18%]', 'bg-amber-300', '.45s'],
    ['left-[78%] top-[76%]', 'bg-sky-300', '.6s'],
    ['left-[90%] top-[31%]', 'bg-purple-300', '.75s'],
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div className="success-burst pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map(([position, color, delay]) => (
          <span key={`${position}-${color}`} className={`success-particle absolute h-2.5 w-2.5 rounded-full ${position} ${color}`} style={{ animationDelay: delay }} />
        ))}
      </div>

      <div className="success-card relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-indigo-950/20">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-indigo-500 to-fuchsia-500" />
        <div className="flex flex-col items-center justify-center gap-6 px-7 py-8 text-center sm:px-9">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
            <div className="success-check-ring flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-200">
              <CheckCircle2 className="h-11 w-11" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" />
              {paid ? 'Compra completada' : 'Descarga completada'}
            </div>

            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {message || 'Mazo agregado exitosamente al dashboard'}
            </h2>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">
              {paid ? 'El pago simulado fue aprobado y tu copia ya quedo registrada.' : 'Tu mazo gratuito ya fue agregado a tu coleccion.'}
            </p>
          </div>

          <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
                <BookOpen className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-extrabold text-slate-900">{deckTitle}</h3>
                <p className="mt-0.5 truncate text-sm text-slate-500">por {creatorName || 'Desconocido'}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">{cardCount || 0} tarjetas</p>
              </div>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <button onClick={onDashboard} className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5">
              Ir al Dashboard
            </button>
            <button onClick={onMarketplace} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">
              Seguir explorando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
