import axios from 'axios';

// Test the new endpoint without auth first to see if route exists
const testNewEndpoint = async () => {
  try {
    console.log('Testing new admin endpoint without auth...');
    
    // Test with the event ID we know exists
    const eventId = '69724ddbe73bfb8617fff50d';
    
    // Test the new route
    const response = await axios.get(`http://localhost:5000/admin/v1/event-post/incident/${eventId}`, {
      timeout: 5000
    });
    
    console.log('✅ New endpoint response:', response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Route exists but requires auth (401)');
    } else if (error.response?.status === 404) {
      console.log('❌ Route not found (404) - Server needs restart');
    } else {
      console.log('❌ Error:', error.response?.data || error.message);
    }
  }
};

testNewEndpoint();
