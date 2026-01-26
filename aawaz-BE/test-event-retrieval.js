import axios from 'axios';

const testEventRetrieval = async () => {
  try {
    console.log('Testing event retrieval in detail...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data?.body?.token;
    
    // Use the event ID we created earlier
    const eventId = '6974423b9a71f218ff10f0cc';
    
    console.log(`🔍 Testing retrieval of event: ${eventId}`);
    
    const response = await axios.get(`http://localhost:5000/admin/v1/event-post/incident/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('=== FULL RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response structure:', JSON.stringify(response.data, null, 2));
    
    console.log('\n=== DATA EXTRACTION TEST ===');
    console.log('response.data.body:', response.data.body);
    console.log('response.data.data:', response.data.data);
    
    // Test what the frontend would extract
    const frontendData = response.data.status === true && response.data.body ? response.data.body : null;
    console.log('Frontend would extract:', frontendData);
    console.log('Frontend attachment:', frontendData?.attachment);
    console.log('Frontend title:', frontendData?.title);
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
};

testEventRetrieval();
