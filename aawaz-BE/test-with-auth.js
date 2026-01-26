import axios from 'axios';

// Test with authentication
const testWithAuth = async () => {
  try {
    console.log('Testing admin endpoint with auth...');
    
    // First try to login to get a token
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com', // You might need to change this
      password: 'admin123'      // You might need to change this
    });
    
    console.log('Login response:', loginResponse.data);
    
    const token = loginResponse.data?.body?.token || loginResponse.data?.token;
    
    if (!token) {
      console.log('❌ No token found in login response');
      return;
    }
    
    console.log('✅ Got token, testing event endpoint...');
    
    // Test with the event ID we know exists
    const eventId = '69724ddbe73bfb8617fff50d';
    
    // Test the new route with auth
    const response = await axios.get(`http://localhost:5000/admin/v1/event-post/incident/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Event data response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
};

testWithAuth();
