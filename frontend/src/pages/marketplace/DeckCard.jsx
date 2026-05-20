import { Link } from 'react-router-dom';
import StarRow from './StarRow';
import { deckAccent, empty, money } from './marketplaceUtils';

const DeckCard = ({ publication, acquired = false, index = 0 }) => {
  const accent = deckAccent(publication);
  const isPaid = Number(publication.pago) === 1;
  const creator = publication.NombreCompleto || publication.UserName || 'Desconocido';
  const title = publication.titulo || 'Sin titulo';

  return (
    <Link
      to={`/marketplace/${publication.id_Publ}`}
      className={`marketplace-deck-card marketplace-deck-card-${accent} group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm`}
      style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
    >
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500">
        {publication.imagen_url ? (
          <>
            <img src={publication.imagen_url} alt={title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20" />
          </>
        ) : (
          <div className="marketplace-card-monogram flex h-full items-center justify-center text-5xl font-black text-white/70">
            LC
          </div>
        )}

        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow ${isPaid ? 'bg-indigo-600' : 'bg-green-500'}`}>
          {isPaid ? money(publication.precio) : 'GRATIS'}
        </span>

        {publication.categoria && (
          <span className="absolute left-3 top-3 rounded-full bg-white/30 px-2 py-0.5 text-xs text-white backdrop-blur">
            {publication.categoria}
          </span>
        )}

        {acquired && (
          <span className="absolute bottom-3 left-3 rounded-full bg-green-600/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            En tu coleccion
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 line-clamp-2 font-bold leading-tight text-gray-900 transition-colors group-hover:text-coral-600">
          {title}
        </h3>

        {publication.nivelEstudio && (
          <span className="mb-2 w-max rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
            {publication.nivelEstudio}
          </span>
        )}

        <p className="mb-2 line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500">
          {publication.descripcion_publica || publication.descripcion || empty}
        </p>

        <p className="mb-3 text-xs text-gray-400">
          por <span className="font-medium text-gray-600">{creator}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <StarRow value={publication.promedio_valoracion} size="h-3.5 w-3.5" />
              <span className="ml-1 text-xs text-gray-400">
                {Number(publication.promedio_valoracion || 0).toFixed(1)}
              </span>
            </div>
            <span className="text-[11px] text-gray-400">{publication.num_valoraciones || 0} valoraciones</span>
          </div>

          <span className="whitespace-nowrap text-xs text-gray-400">
            {publication.num_compras || 0} adquiridos
          </span>
        </div>

        <div className="mt-4">
          <span className="marketplace-liquid-btn inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-black text-white">
            Ver detalles
          </span>
        </div>
      </div>
    </Link>
  );
};

export default DeckCard;
