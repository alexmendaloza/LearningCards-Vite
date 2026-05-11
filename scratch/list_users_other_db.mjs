import { pool } from '../server/db.js';

async function listUsersInOtherDb() {
  try {
    console.log('--- Users in learningcards ---');
    const [users] = await pool.query('SELECT IDUsuario, UserName, email, rol FROM learningcards.Usuario');
    console.table(users);
  } catch (err) {
    console.error('Failed to list users in learningcards:', err.message);
  } finally {
    await pool.end();
  }
}

listUsersInOtherDb();
