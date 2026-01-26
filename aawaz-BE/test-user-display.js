import axios from 'axios';

const testUserDisplay = async () => {
  try {
    console.log('Testing user display issue...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data?.body?.token;
    
    // Test with a real user-submitted event (not admin-created)
    const eventId = '67cfcb0e5cd45c3a15344073'; // "traffic jam gyu" user event
    
    console.log(`🔍 Testing user event: ${eventId}`);
    
    const response = await axios.get(`http://localhost:5000/admin/v1/event-post/incident/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('=== USER DATA STRUCTURE ===');
    const eventData = response.data.body;
    
    console.log('Event userId:', eventData.userId);
    console.log('Event name:', eventData.name);
    console.log('Event userId type:', typeof eventData.userId);
    console.log('Event userId.name:', eventData.userId?.name);
    console.log('Event userId.username:', eventData.userId?.username);
    
    // Test what the frontend would show
    const frontendDisplay = eventData?.userId?.name || eventData?.userId?.username || eventData?.name || "Unknown User";
    console.log('Frontend would display:', frontendDisplay);
    
    // Test admin-created event for comparison
    console.log('\n=== ADMIN EVENT COMPARISON ===');
    const adminEventId = '6974423b9a71f218ff10f0cc'; // admin-created event
    
    const adminResponse = await axios.get(`http://localhost:5000/admin/v1/event-post/incident/${adminEventId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const adminEventData = adminResponse.data.body;
    console.log('Admin event userId:', adminEventData.userId);
    console.log('Admin event name:', adminEventData.name);
    
    const adminFrontendDisplay = adminEventData?.userId?.name || adminEventData?.userId?.username || adminEventData?.name || "Unknown User";
    console.log('Admin frontend would display:', adminFrontendDisplay);
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
};

testUserDisplay();
