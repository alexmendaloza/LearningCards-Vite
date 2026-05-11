import { pool } from '../server/db.js';

async function listUsers() {
  try {
    const [users] = await pool.query('SELECT IDUsuario, UserName, email, rol FROM Usuario');
    console.log('Users in database:');
    console.table(users);
  } catch (err) {
    console.error('Failed to list users:', err.message);
  } finally {
    await pool.end();
  }
}

listUsers();
