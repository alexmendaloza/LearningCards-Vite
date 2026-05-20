import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const port = Number(process.env.API_PORT || 3001);
export const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost';
export const jwtSecret = process.env.JWT_SECRET || 'learningcards-local-secret';
export const tokenCookie = 'lc_session';
export const storagePath = path.resolve(__dirname, '..', '..', '..', 'frontend', 'public', 'storage');

export const categories = [
  'Test Prep',
  'Science',
  'Medical',
  'Languages',
  'Technology',
  'Mathematics',
  'History',
  'Other',
];
