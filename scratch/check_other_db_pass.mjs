import { pool } from '../server/db.js';
import bcrypt from 'bcryptjs';

async function checkOtherDb() {
  try {
    const [users] = await pool.query('SELECT UserName, email, contrasena FROM learningcards.Usuario WHERE UserName = "alexmendaloza"');
    if (users.length > 0) {
      const user = users[0];
      console.log(`User in learningcards: ${user.UserName}, Email: ${user.email}`);
      console.log(`Hash: ${user.contrasena}`);
      const bcryptPassword = String(user.contrasena).replace(/^\$2y\$/, '$2b$');
      const matches = bcrypt.compareSync('password', bcryptPassword) || bcrypt.compareSync('123456', bcryptPassword);
      console.log(`Matches "password" or "123456"? ${matches}`);
    } else {
      console.log('User not found in learningcards.');
    }
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}

checkOtherDb();
