// Test the user profile API to understand the response structure
const axios = require('axios');

async function testUserProfileAPI() {
  try {
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data?.body?.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('🔍 Testing User Profile API...\n');
    
    // First get a user ID from the users list
    const usersResponse = await axios.get('http://localhost:5000/admin/v1/user/app-users/all?limit=1000', { headers });
    const users = usersResponse.data?.body?.data || [];
    
    if (users.length > 0) {
      const userId = users[0]._id;
      console.log(`=== Testing with user ID: ${userId} ===`);
      
      // Test user profile API
      console.log(`\n=== GET /admin/v1/user/user-profile/${userId} ===`);
      try {
        const profileResponse = await axios.get(`http://localhost:5000/admin/v1/user/user-profile/${userId}`, { headers });
        console.log('✅ Success:', profileResponse.status);
        console.log('📊 Full profile response:', JSON.stringify(profileResponse.data, null, 2));
      } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.data);
      }
    } else {
      console.log('❌ No users found to test profile API');
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error.message);
  }
}

testUserProfileAPI();
