import axios from 'axios';
import mysql from 'mysql2/promise';

async function verifyStreak() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'learning_cards_react'
  });

  console.log('--- Verificando Lógica de Rachas ---');

  // 1. Limpiar/Preparar usuario de prueba
  await pool.query('UPDATE Usuario SET rachaActual = 0, ultDiaEst = CURDATE() WHERE UserName = "alexmendaloza"');
  console.log('Usuario alexmendaloza reseteado a Racha 0 y ultimo estudio Hoy.');

  // Encontrar un mazo válido
  const [mazos] = await pool.query('SELECT IDMazo FROM Mazo LIMIT 1');
  if (mazos.length === 0) {
    console.log('❌ ERROR: No hay mazos en la DB para probar.');
    await pool.end();
    return;
  }
  const mazoId = mazos[0].IDMazo;
  console.log(`Usando Mazo ID: ${mazoId}`);
  try {
    // Necesitamos el cookie de sesión. Como ya probamos el login, podemos usar el script de verify_login para obtenerlo o simplemente hacer login aquí.
    const loginResp = await axios.post('http://localhost:3001/api/login', {
      email: 'alexmendaloza',
      password: '123456'
    });
    const cookie = loginResp.headers['set-cookie'][0];

    console.log('Login exitoso. Enviando sesión de estudio...');
    
    // 3. Finalizar estudio
    const studyResp = await axios.post(`http://localhost:3001/api/estudiar/${mazoId}/finalizar`, 
      { aciertos: 5, fallos: 0 },
      { headers: { Cookie: cookie } }
    );

    console.log('Respuesta del servidor:', studyResp.data);

    // 4. Verificar en DB
    const [rows] = await pool.query('SELECT rachaActual, ultDiaEst FROM Usuario WHERE UserName = "alexmendaloza"');
    console.log('Estado final en DB:', rows[0]);

    if (rows[0].rachaActual === 1) {
      console.log('✅ ÉXITO: La racha se inició correctamente en 1.');
    } else {
      console.log('❌ ERROR: La racha no se actualizó correctamente.');
    }

  } catch (err) {
    console.error('Error durante la prueba:', err.response?.data || err.message);
  } finally {
    await pool.end();
  }
}

verifyStreak();
