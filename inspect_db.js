import { pool } from './server/db.js';

async function inspect() {
  try {
    const [columns] = await pool.query('SHOW COLUMNS FROM usuario');
    console.log('Columns in usuario:', columns.map(c => c.Field));
  } catch (err) {
    console.error('Inspection failed:', err.message);
  } finally {
    await pool.end();
  }
}

inspect();
