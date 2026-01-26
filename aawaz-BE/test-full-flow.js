import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 8000,
});

async function testAuthAndEvents() {
  try {
    console.log('=== Testing Admin Login ===');
    
    // Try to login with a test admin account
    const loginResponse = await api.post('/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    console.log('Login successful:', loginResponse.data.body);
    const token = loginResponse.data.body.token;
    
    console.log('\n=== Testing Events API with valid token ===');
    
    // Now test events API with valid token
    const eventsResponse = await api.get('/admin/v1/event-post/incident/list', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: { page: 1, limit: 10 }
    });
    
    console.log('Events API Response:', {
      status: eventsResponse.status,
      data: eventsResponse.data,
      totalItems: eventsResponse.data.data?.totalItems,
      eventsCount: eventsResponse.data.data?.data?.length || 0
    });
    
    if (eventsResponse.data.data?.data?.length > 0) {
      console.log('\n=== Sample Events ===');
      eventsResponse.data.data.data.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} - ${event.status} (${event.postType})`);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testAuthAndEvents();
