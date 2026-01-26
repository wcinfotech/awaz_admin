import axios from 'axios';

const testDifferentPostTypes = async () => {
  try {
    console.log('Testing different postTypes...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data?.body?.token;
    
    // Test different postTypes with the test event
    const eventId = '69735f09dbd8506b782e4c5a';
    const postTypes = ['incident', 'rescue', 'general_category'];
    
    for (const postType of postTypes) {
      try {
        console.log(`\n=== Testing ${postType} ===`);
        const response = await axios.get(`http://localhost:5000/admin/v1/event-post/${postType}/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ ${postType}: SUCCESS`);
        console.log(`Title: ${response.data.data?.title}`);
        
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`❌ ${postType}: 404 Not Found (expected for wrong postType)`);
        } else {
          console.log(`❌ ${postType}: ${error.response?.data?.message || error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Login error:', error.response?.data || error.message);
  }
};

testDifferentPostTypes();
