export const nowSql = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
export const todaySql = () => new Date().toISOString().slice(0, 10);
