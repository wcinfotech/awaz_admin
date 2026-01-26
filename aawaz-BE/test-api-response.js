import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 8000,
});

async function testApiResponse() {
  try {
    // Login first
    const loginResponse = await api.post('/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.body.token;
    
    // Test events API
    const eventsResponse = await api.get('/admin/v1/event-post/incident/list', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: { page: 1, limit: 10 }
    });
    
    console.log('=== Full API Response Structure ===');
    console.log('Response status:', eventsResponse.status);
    console.log('Response data:', JSON.stringify(eventsResponse.data, null, 2));
    
    console.log('\n=== Data Access Tests ===');
    console.log('res.data?.data?.data:', eventsResponse.data?.data?.data);
    console.log('res.data?.body?.data:', eventsResponse.data?.body?.data);
    console.log('res.data?.data:', eventsResponse.data?.data);
    
    console.log('\n=== Expected Frontend Access ===');
    const rows = eventsResponse.data?.data?.data || [];
    console.log('Rows count:', rows.length);
    if (rows.length > 0) {
      console.log('First row:', rows[0]);
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testApiResponse();
