import fs from 'node:fs/promises';
import path from 'node:path';
import { storagePath } from '../config/appConfig.js';

export const saveDataUrlImage = async (dataUrl, originalName = 'perfil.png') => {
  if (!dataUrl || !String(dataUrl).startsWith('data:image/')) return null;
  const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const mime = match[1];
  const ext = mime.includes('jpeg') ? 'jpg' : mime.split('/')[1].replace(/[^a-z0-9]/gi, '').toLowerCase();
  const safeName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '');
  const filename = `${Date.now()}_${safeName || 'perfil'}.${ext || 'png'}`;
  const relative = path.posix.join('perfiles', filename);
  const targetDir = path.join(storagePath, 'perfiles');
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(path.join(targetDir, filename), Buffer.from(match[2], 'base64'));
  return relative;
};
