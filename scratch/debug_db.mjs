import { pool } from '../server/db.js';
try {
  const [rows] = await pool.query('SELECT * FROM Tarjeta ORDER BY IDTarjeta DESC LIMIT 5');
  console.log(JSON.stringify(rows, null, 2));
} catch (e) {
  console.error(e);
}
process.exit(0);
