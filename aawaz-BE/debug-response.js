import axios from 'axios';

const debugResponse = async () => {
  try {
    console.log('Debugging response structure...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data?.body?.token;
    
    // Test one event
    const response = await axios.get(`http://localhost:5000/admin/v1/event-post/incident/69736686e97931c2f23f0997`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('=== FULL RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data) {
      console.log('=== RESPONSE.DATA.DATA ===');
      console.log('Title:', response.data.data.title);
      console.log('Keys:', Object.keys(response.data.data));
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
};

debugResponse();
