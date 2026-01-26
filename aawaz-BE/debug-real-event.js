import axios from 'axios';

const debugRealEventResponse = async () => {
  try {
    console.log('Debugging real event response...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data?.body?.token;
    
    // Test with real event ID
    const eventId = '67cfcb0e5cd45c3a15344073';
    
    const response = await axios.get(`http://localhost:5000/admin/v1/event-post/incident/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('=== FULL RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
};

debugRealEventResponse();
