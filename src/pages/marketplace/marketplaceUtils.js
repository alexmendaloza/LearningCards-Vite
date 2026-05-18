export const MARKETPLACE_CATEGORIES = [
  'Test Prep',
  'Science',
  'Medical',
  'Languages',
  'Technology',
  'Mathematics',
  'History',
  'Other',
];

export const money = (value) => `$${Number(value || 0).toFixed(2)}`;

export const empty = 'Sin descripcion';

export const slugifyCategory = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const categoryFromSlug = (slug = '', categories = MARKETPLACE_CATEGORIES) => (
  categories.find((category) => slugifyCategory(category) === slug) || ''
);

export const initials = (name = 'U') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase() || 'U';

export const shortDate = (value) => (value ? new Date(value).toLocaleDateString('es-MX') : '');

export const deckAccent = (pub = {}) => {
  const category = String(pub.categoria || '').toLowerCase();
  if (category.includes('science') || category.includes('ciencia')) return 'science';
  if (category.includes('medical') || category.includes('medic')) return 'medical';
  if (category.includes('language') || category.includes('idioma')) return 'language';
  if (category.includes('tech') || category.includes('tecnolog')) return 'tech';
  if (category.includes('math') || category.includes('matem')) return 'math';
  if (category.includes('history') || category.includes('historia')) return 'history';
  return Number(pub.pago) ? 'paid' : 'free';
};
