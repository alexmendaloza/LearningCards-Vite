import { pool } from '../server/db.js';

async function listDatabases() {
  try {
    const [dbs] = await pool.query('SHOW DATABASES');
    console.log('Available databases:');
    console.table(dbs);
    
    const [currentDb] = await pool.query('SELECT DATABASE() as db');
    console.log('Current database:', currentDb[0].db);
    
  } catch (err) {
    console.error('Failed to list databases:', err.message);
  } finally {
    await pool.end();
  }
}

listDatabases();
