import { pool, databaseName } from './server/db.js';

async function inspect() {
  try {
    console.log(`Checking database: ${databaseName}`);
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables:', tables);
    
    if (tables.some(t => Object.values(t).includes('Usuario'))) {
      const [users] = await pool.query('SELECT COUNT(*) as count FROM Usuario');
      console.log('Users count:', users[0].count);
    } else {
      console.log('Table Usuario does not exist!');
    }

    if (tables.some(t => Object.values(t).includes('NivelRacha'))) {
      const [niveles] = await pool.query('SELECT * FROM NivelRacha');
      console.log('Niveles:', niveles);
    } else {
      console.log('Table NivelRacha does not exist!');
    }
  } catch (err) {
    console.error('Inspection failed:', err.message);
  } finally {
    await pool.end();
  }
}

inspect();
