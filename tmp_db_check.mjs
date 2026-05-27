import mysql from 'mysql2/promise';
const config = { host:'localhost', user:'root', password:'', database:'learning_cards_react' };
(async () => {
  try {
    const conn = await mysql.createConnection(config);
    const [tables] = await conn.query('SHOW TABLES');
    console.log('TABLES', tables);
    const [users] = await conn.query('SELECT IDUsuario, UserName, email, rol FROM Usuario LIMIT 5');
    console.log('USERS', users);
    await conn.end();
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();