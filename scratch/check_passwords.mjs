import { pool } from '../server/db.js';
import bcrypt from 'bcryptjs';

async function checkPasswords() {
  try {
    const [users] = await pool.query('SELECT UserName, email, contrasena FROM Usuario');
    console.log('Checking password hashes in learning_cards_react:');
    for (const user of users) {
      const hash = user.contrasena;
      const isValidFormat = hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
      console.log(`User: ${user.UserName}, Email: ${user.email}`);
      console.log(`  Hash: ${hash.substring(0, 10)}...`);
      console.log(`  Valid format for bcryptjs? ${isValidFormat}`);
      
      // Try a common password
      const bcryptPassword = String(hash).replace(/^\$2y\$/, '$2b$');
      try {
        const matches = bcrypt.compareSync('password', bcryptPassword) || bcrypt.compareSync('123456', bcryptPassword);
        if (matches) console.log('  Matches "password" or "123456"');
      } catch (e) {
        console.log('  Error comparing:', e.message);
      }
    }
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}

checkPasswords();
