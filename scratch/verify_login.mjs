import axios from 'axios';

async function testLogin() {
  const url = 'http://localhost:3001/api/login';
  
  const tests = [
    { label: 'Login por Email', data: { email: '23460356@colima.tecnm.mx', password: '123456' } },
    { label: 'Login por Usuario', data: { email: 'alexmendaloza', password: '123456' } },
    { label: 'Login fallido (usuario inexistente)', data: { email: 'noexiste', password: 'wrong' } },
  ];

  for (const test of tests) {
    console.log(`--- ${test.label} ---`);
    try {
      const resp = await axios.post(url, test.data);
      console.log('Status:', resp.status);
      console.log('User:', resp.data.usuario.UserName);
    } catch (err) {
      console.log('Status:', err.response?.status || 'Error');
      console.log('Message:', err.response?.data?.message || err.message);
    }
  }
}

testLogin();
