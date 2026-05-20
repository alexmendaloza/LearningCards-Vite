import { todaySql } from './dates.js';

export const cleanUser = (user) => {
  if (!user) return null;
  const copy = { ...user };
  delete copy.contrasena;

  if (copy.ultDiaEst) {
    const today = new Date(todaySql());
    const ultimoStr = typeof copy.ultDiaEst === 'string' ? copy.ultDiaEst.slice(0, 10) : copy.ultDiaEst.toISOString().slice(0, 10);
    const ultimo = new Date(ultimoStr);
    const diff = Math.floor((today.getTime() - ultimo.getTime()) / 86400000);
    if (diff > 1) {
      copy.rachaActual = 0;
    }
  } else {
    copy.rachaActual = 0;
  }

  return copy;
};
