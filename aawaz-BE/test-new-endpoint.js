import axios from 'axios';

// Test the new endpoint
const testNewEndpoint = async () => {
  try {
    console.log('Testing new admin endpoint...');
    
    // Test with the event ID we know exists
    const eventId = '69724ddbe73bfb8617fff50d';
    
    // Test the new route
    const response = await axios.get(`http://localhost:3000/admin/v1/event-post/incident/${eventId}`, {
      headers: {
        'Authorization': 'Bearer your-token-here', // You'll need to add actual token
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ New endpoint response:', response.data);
  } catch (error) {
    console.log('❌ Error testing new endpoint:', error.response?.data || error.message);
  }
};

testNewEndpoint();
