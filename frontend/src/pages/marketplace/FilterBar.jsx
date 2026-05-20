import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slugifyCategory } from './marketplaceUtils';

const FilterBar = ({ form, setForm, categories = [], onSubmit, onReset, activeCategory = '' }) => (
  <form onSubmit={onSubmit} className="marketplace-filter-bar mb-8 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
    <div className="grid gap-3 lg:grid-cols-[1fr_180px_170px_200px_auto]">
      <label className="relative block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={form.search}
          onChange={(event) => setForm({ ...form, search: event.target.value })}
          placeholder="Buscar por titulo, autor o tema..."
          className="marketplace-filter-field w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-coral-300"
        />
      </label>

      <FilterSelect
        label="Categoria"
        value={form.categoria}
        onChange={(value) => setForm({ ...form, categoria: value })}
        options={[['', 'Todas'], ...categories.map((category) => [category, category])]}
        active={Boolean(activeCategory)}
      />

      <FilterSelect
        label="Precio"
        value={form.precio}
        onChange={(value) => setForm({ ...form, precio: value })}
        options={[['', 'Todos'], ['gratis', 'Solo Gratis'], ['pago', 'Solo de Pago']]}
        active={Boolean(form.precio)}
      />

      <FilterSelect
        label="Orden"
        value={form.orden}
        onChange={(value) => setForm({ ...form, orden: value })}
        options={[
          ['popular', 'Mas Populares'],
          ['valorados', 'Mejor Valorados'],
          ['precio_asc', 'Precio: Menor a Mayor'],
          ['precio_desc', 'Precio: Mayor a Menor'],
        ]}
        active={form.orden !== 'popular'}
      />

      <button className="marketplace-liquid-btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white">
        <SlidersHorizontal className="h-4 w-4" />
        Buscar
      </button>
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Categorias</span>
      {categories.map((category) => (
        <Link
          key={category}
          to={`/marketplace/category/${slugifyCategory(category)}`}
          className={`marketplace-category-chip rounded-full px-3 py-1.5 text-xs font-bold transition ${form.categoria === category ? 'active' : ''}`}
        >
          {category}
        </Link>
      ))}
      {(form.search || form.categoria || form.precio || form.orden !== 'popular') && (
        <button
          type="button"
          onClick={onReset}
          className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-coral-600 transition hover:bg-coral-50"
        >
          <X className="h-3.5 w-3.5" />
          Limpiar filtros
        </button>
      )}
    </div>
  </form>
);

const FilterSelect = ({ label, value, onChange, options, active = false }) => (
  <label className="relative block">
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`marketplace-filter-field w-full appearance-none rounded-xl border border-gray-200 px-4 py-2.5 pr-8 text-sm font-medium outline-none focus:ring-2 focus:ring-coral-300 ${active ? 'is-active' : ''}`}
    >
      {options.map(([optionValue, optionLabel]) => (
        <option key={`${label}-${optionValue}`} value={optionValue}>{optionLabel}</option>
      ))}
    </select>
    <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  </label>
);

export default FilterBar;
