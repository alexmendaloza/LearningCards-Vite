import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, Download, Layers, MessageSquare, Plus, UserRound, Eye } from 'lucide-react';
import api from '../../api/axios';
import DeckCard from './DeckCard';
import FilterBar from './FilterBar';
import StarRow from './StarRow';
import {
  MARKETPLACE_CATEGORIES,
  categoryFromSlug,
  empty,
  initials,
  money,
  shortDate,
} from './marketplaceUtils';

const Loading = ({ text = 'Cargando...' }) => (
  <div className="py-16 text-center text-sm font-semibold text-slate-500 animate-pulse">{text}</div>
);

const ErrorBox = ({ message }) => message ? (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
    {message}
  </div>
) : null;

const Alert = ({ children, tone = 'green' }) => (
  <div className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${
    tone === 'green' ? 'border-green-200 bg-green-50 text-green-800' : 'border-blue-200 bg-blue-50 text-blue-800'
  }`}>
    {children}
  </div>
);

const useResource = (loader, deps = []) => {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: '' }));
    loader()
      .then((data) => active && setState({ loading: false, error: '', data }))
      .catch((error) => active && setState({ loading: false, error: error.response?.data?.message || error.message, data: null }));
    return () => { active = false; };
  }, deps);
  return state;
};

export const MarketplacePage = () => {
  const [params, setParams] = useSearchParams();
  const { slug } = useParams();
  const categories = MARKETPLACE_CATEGORIES;
  const routeCategory = categoryFromSlug(slug, categories);
  const category = routeCategory || params.get('categoria') || '';
  const queryParams = useMemo(() => {
    const next = new URLSearchParams(params);
    if (routeCategory) next.set('categoria', routeCategory);
    return next;
  }, [params, routeCategory]);
  const query = queryParams.toString();
  const { loading, error, data } = useResource(async () => (await api.get(`/user/marketplace${query ? `?${query}` : ''}`)).data, [query]);
  const [form, setForm] = useState({
    search: params.get('search') || '',
    categoria: category,
    precio: params.get('precio') || '',
    orden: params.get('orden') || 'popular',
  });

  useEffect(() => {
    setForm({
      search: params.get('search') || '',
      categoria: category,
      precio: params.get('precio') || '',
      orden: params.get('orden') || 'popular',
    });
  }, [params, category]);

  const apply = (event) => {
    event.preventDefault();
    const next = {};
    Object.entries(form).forEach(([key, value]) => {
      if (value && !(key === 'orden' && value === 'popular')) next[key] = value;
    });
    setParams(next);
  };

  const reset = () => {
    setForm({ search: '', categoria: '', precio: '', orden: 'popular' });
    setParams({});
  };

  const acquiredIds = data?.mazosAdquiridos || [];
  const publications = data?.publicaciones || [];
  const sourceCategories = data?.categorias?.length ? data.categorias : categories;

  return (
    <div className="marketplace-page min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <div className="marketplace-hero border-b border-purple-100 bg-white/70 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-3">
                <span className="marketplace-hero-icon flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-400 to-orange-500 text-white shadow-lg shadow-coral-200">
                  <Layers className="h-6 w-6" />
                </span>
                <h1 className="bg-gradient-to-r from-indigo-600 via-purple-600 to-coral-500 bg-clip-text text-3xl font-black text-transparent md:text-4xl">
                  Marketplace
                </h1>
              </div>
              <p className="ml-15 text-gray-500">Descubre y adquiere mazos de flashcards creados por la comunidad</p>
            </div>

            <div className="flex gap-3">
              <Link
                to="/user/creator/stats"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/50 border border-purple-200 px-5 py-3 text-sm font-black text-purple-700 backdrop-blur transition-all hover:bg-white hover:-translate-y-0.5"
              >
                <Eye className="h-5 w-5" />
                Previsualizar Reporte
              </Link>
              <Link 
                to="/user/creator/stats"
                className="marketplace-liquid-btn inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5"
              >
                <Download className="h-5 w-5" />
                Descargar Reporte de Ventas
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <FilterBar
          form={form}
          setForm={setForm}
          categories={sourceCategories}
          onSubmit={apply}
          onReset={reset}
          activeCategory={category}
        />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Mostrando <span className="font-semibold text-gray-800">{publications.length}</span> mazos
            {form.search ? <span> para <em>{form.search}</em></span> : null}
          </p>
          {category && (
            <Link to="/marketplace" className="text-sm font-semibold text-coral-600 hover:underline">
              Ver todas las categorias
            </Link>
          )}
        </div>

        {loading ? <Loading text="Sincronizando marketplace..." /> : error ? <ErrorBox message={error} /> : publications.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {publications.map((pub, index) => (
              <DeckCard
                key={pub.id_Publ}
                publication={pub}
                acquired={acquiredIds.includes(pub.id_Publ)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="marketplace-empty-state py-20 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-coral-500 shadow-xl shadow-coral-100">
              <SearchIcon />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">No encontramos mazos</h3>
            <p className="mb-6 text-gray-500">Intenta con otros filtros o terminos de busqueda</p>
            <button onClick={reset} className="marketplace-liquid-btn rounded-xl px-6 py-2.5 font-black text-white">
              Ver todos los mazos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const MarketplaceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const { loading, error, data } = useResource(async () => (await api.get(`/user/marketplace/${id}`)).data, [id, refresh]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (data?.miValoracion) {
      setRating(data.miValoracion.puntuacion);
      setComment(data.miValoracion.comentario || '');
    }
  }, [data]);

  const acquire = async () => {
    try {
      await api.post(`/user/marketplace/${id}/adquirir`);
      setSuccess({
        mode: 'gratis',
        deckTitle: data?.mazo?.titulo || 'Mazo',
        creatorName: data?.creador?.NombreCompleto || data?.creador?.UserName || 'Desconocido',
        cardCount: data?.tarjetas?.length || 0,
      });
      setRefresh((value) => value + 1);
    } catch (err) {
      const redirect = err.response?.data?.redirect;
      if (redirect) {
        navigate(redirect);
        return;
      }
      setMessage(err.response?.data?.message || 'No fue posible adquirir el mazo.');
    }
  };

  const sendRating = async (event) => {
    event.preventDefault();
    await api.post(`/user/marketplace/${id}/valorar`, { puntuacion: rating, comentario: comment });
    setMessage('Gracias por tu valoracion.');
    setRefresh((value) => value + 1);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  const { publicacion, creador, mazo, tarjetas, valoraciones, yaAdquirido, esPropio } = data;
  const creatorName = creador?.NombreCompleto || creador?.UserName || mazo.NombreCompleto || 'Desconocido';

  return (
    <div className="marketplace-show-page min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {success && (
        <AcquisitionSuccessModal
          {...success}
          onDashboard={() => navigate('/dashboard')}
          onMarketplace={() => navigate('/marketplace')}
        />
      )}

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Link to="/marketplace" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-coral-600">
          <ArrowLeft className="h-4 w-4" />
          Marketplace
        </Link>

        {message && <div className="mb-6"><Alert>{message}</Alert></div>}

        <div className="grid gap-8 lg:grid-cols-3">
          <main className="space-y-6 lg:col-span-2">
            <section className="marketplace-detail-panel overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="relative h-52 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500">
                {publicacion.imagen_url && (
                  <>
                    <img src={publicacion.imagen_url} alt={mazo.titulo} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/30" />
                  </>
                )}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {publicacion.categoria && <span className="rounded-full bg-white/30 px-3 py-1 text-sm text-white backdrop-blur">{publicacion.categoria}</span>}
                  <span className={`rounded-full px-3 py-1 text-sm font-bold text-white ${Number(publicacion.pago) ? 'bg-indigo-600' : 'bg-green-500'}`}>{Number(publicacion.pago) ? money(publicacion.precio) : 'GRATIS'}</span>
                </div>
              </div>
              <div className="p-6">
                <h1 className="mb-2 text-2xl font-black text-gray-900">{mazo.titulo}</h1>
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span>por {creatorName}</span><span>•</span>
                  <span className="flex items-center gap-1"><StarRow value={publicacion.promedio_valoracion} /> {Number(publicacion.promedio_valoracion || 0).toFixed(1)} ({publicacion.num_valoraciones} valoraciones)</span><span>•</span>
                  <span>{publicacion.num_compras} adquiridos</span>
                </div>
                <p className="leading-relaxed text-gray-600">{publicacion.descripcion_publica || mazo.descripcion || empty}</p>
              </div>
            </section>

            <section className="marketplace-detail-panel rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">Contenido del mazo <span className="ml-2 text-sm font-normal text-gray-500">{tarjetas.length} tarjetas</span></h2>
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {tarjetas.slice(0, 8).map((card) => (
                  <div key={card.IDTarjeta} className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-indigo-400">Frente</span>{card.frente}</div>
                    <div className="rounded-xl border border-purple-100 bg-purple-50 p-3"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-purple-400">Reverso</span>{card.reverso}</div>
                  </div>
                ))}
                {tarjetas.length > 8 && <p className="pt-2 text-center text-sm text-gray-400">... y {tarjetas.length - 8} tarjetas mas</p>}
              </div>
            </section>

            <RatingsPanel
              publicacion={publicacion}
              valoraciones={valoraciones}
              rating={rating}
              comment={comment}
              setRating={setRating}
              setComment={setComment}
              sendRating={sendRating}
              hasRating={Boolean(data.miValoracion)}
            />
          </main>

          <aside className="space-y-4">
            <PurchasePanel
              publicacion={publicacion}
              tarjetas={tarjetas}
              yaAdquirido={yaAdquirido}
              esPropio={esPropio}
              onBuy={() => navigate(`/marketplace/${id}/pagar`)}
              onAcquire={acquire}
              onDashboard={() => navigate('/dashboard')}
            />

            <section className="marketplace-detail-panel rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-700"><UserRound className="h-4 w-4 text-indigo-500" /> Creador</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-sm">
                  {initials(creatorName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-800">{creatorName}</p>
                  <p className="text-xs text-gray-500">@{creador?.UserName || mazo.UserName || 'usuario'}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

const RatingsPanel = ({ publicacion, valoraciones, rating, comment, setRating, setComment, sendRating, hasRating }) => (
  <section className="ratings-panel marketplace-detail-panel rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
    <h2 className="mb-5 flex items-center gap-2 text-lg font-bold"><MessageSquare className="h-5 w-5 text-amber-500" /> Valoraciones y comentarios</h2>

    <div className="ratings-summary mb-6 flex items-center gap-6 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-50 p-5 shadow-sm">
      <div className="text-center">
        <div className="rating-score text-4xl font-black text-amber-600">{Number(publicacion.promedio_valoracion || 0).toFixed(1)}</div>
        <div className="mt-1 flex justify-center"><StarRow value={publicacion.promedio_valoracion} /></div>
        <div className="rating-count mt-1 text-xs font-bold text-slate-600">{publicacion.num_valoraciones} valoraciones</div>
      </div>
      <div className="flex-1 space-y-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = valoraciones.filter((val) => Number(val.puntuacion) === star).length;
          const pct = publicacion.num_valoraciones ? Math.round((count / publicacion.num_valoraciones) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-4 text-right font-bold text-slate-700">{star}</span>
              <div className="rating-bar-track h-2 flex-1 rounded-full bg-amber-200">
                <div className="rating-bar-fill h-2 rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 font-semibold text-slate-600">{count}</span>
            </div>
          );
        })}
      </div>
    </div>

    <form onSubmit={sendRating} className="rating-form-card mb-6 rounded-xl border border-purple-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-gray-800">{hasRating ? 'Actualizar tu valoracion' : 'Deja tu valoracion'}</h3>
      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button type="button" key={star} onClick={() => setRating(star)} className="star-btn text-3xl transition-transform hover:scale-110">
            <span className={`star ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows="3" placeholder="Escribe un comentario (opcional)..." className="mb-3 w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-coral-300" />
      <button disabled={!rating} className="marketplace-liquid-btn rounded-xl px-5 py-2 text-sm font-black text-white disabled:opacity-50">{hasRating ? 'Actualizar valoracion' : 'Enviar valoracion'}</button>
    </form>

    <div className="space-y-4">
      {valoraciones.length ? valoraciones.map((val) => (
        <div key={val.id_Val} className="flex gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-bold text-white">{initials(val.NombreCompleto)}</div>
          <div>
            <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-gray-800">{val.NombreCompleto}</span><StarRow value={val.puntuacion} size="h-3.5 w-3.5" /><span className="text-xs text-gray-400">{shortDate(val.fecha)}</span></div>
            {val.comentario && <p className="mt-1 text-sm text-gray-600">{val.comentario}</p>}
          </div>
        </div>
      )) : <p className="py-6 text-center text-sm text-gray-400">Aun no hay valoraciones. Se el primero.</p>}
    </div>
  </section>
);

const PurchasePanel = ({ publicacion, tarjetas, yaAdquirido, esPropio, onBuy, onAcquire, onDashboard }) => (
  <section className="marketplace-purchase-panel sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
    <div className="mb-5 text-center">
      {Number(publicacion.pago) ? (
        <>
          <div className="mb-1 text-4xl font-black text-gray-900">{money(publicacion.precio)}</div>
          <p className="text-sm text-gray-400">Pago unico</p>
        </>
      ) : (
        <>
          <div className="mb-1 text-4xl font-black text-green-600">GRATIS</div>
          <p className="text-sm text-gray-400">Sin costo</p>
        </>
      )}
    </div>

    {yaAdquirido ? (
      <>
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-center font-semibold text-green-700">Ya tienes este mazo</div>
        <button onClick={onDashboard} className="w-full rounded-xl border-2 border-indigo-200 py-3 font-semibold text-indigo-600 transition hover:bg-indigo-50">Ver en Mi Dashboard</button>
      </>
    ) : esPropio ? (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-center text-sm font-medium text-indigo-700">Este es tu mazo publicado</div>
    ) : Number(publicacion.pago) ? (
      <button onClick={onBuy} className="marketplace-liquid-btn w-full rounded-xl py-3.5 text-lg font-black text-white">
        <CreditCard className="mr-2 inline h-5 w-5" />
        Comprar ahora
      </button>
    ) : (
      <button onClick={onAcquire} className="marketplace-liquid-btn w-full rounded-xl py-3.5 text-lg font-black text-white">
        <Plus className="mr-2 inline h-5 w-5" />
        Agregar gratis
      </button>
    )}

    <div className="mt-5 space-y-2.5 text-sm text-gray-500">
      <p>{tarjetas.length} tarjetas incluidas</p>
      <p>El mazo se clona a tu coleccion</p>
      <p>Puedes editarlo libremente</p>
    </div>
  </section>
);

const AcquisitionSuccessModal = ({ mode = 'gratis', deckTitle, creatorName, cardCount, onDashboard, onMarketplace }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
    <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-indigo-950/20">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-coral-400 via-orange-400 to-fuchsia-500" />
      <div className="px-7 pb-7 pt-9 text-center sm:px-9">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-200">
            <CheckCircle2 className="h-11 w-11" />
          </div>
        </div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-coral-600">{mode === 'pago' ? 'Compra completada' : 'Descarga completada'}</p>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Mazo agregado exitosamente</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">{deckTitle} por {creatorName}. Incluye {cardCount || 0} tarjetas.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
          <button onClick={onDashboard} className="marketplace-liquid-btn rounded-2xl px-5 py-3 text-sm font-black text-white">Ir al Dashboard</button>
          <button onClick={onMarketplace} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-coral-200 hover:bg-coral-50 hover:text-coral-600">Seguir explorando</button>
        </div>
      </div>
    </div>
  </div>
);

const SearchIcon = () => (
  <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default MarketplacePage;
