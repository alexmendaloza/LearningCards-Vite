async function testRegister() {
  const payload = {
    UserName: 'testuser' + Date.now(),
    NombreCompleto: 'Test User',
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    fechanac: '1990-01-01',
    genero: 'M'
  };

  try {
    const resp = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    console.log('Status:', resp.status);
    console.log('Data:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testRegister();
