// Test the correct user management APIs
const axios = require('axios');

async function testCorrectUserAPIs() {
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
    
    console.log('🔍 Testing Correct User Management APIs...\n');
    
    // Test 1: Get all app users
    console.log('=== 1. GET /admin/v1/user/app-users/all ===');
    try {
      const usersResponse = await axios.get('http://localhost:5000/admin/v1/user/app-users/all', { headers });
      console.log('✅ Success:', usersResponse.status);
      console.log('📊 Full response structure:', JSON.stringify(usersResponse.data, null, 2));
      
      const usersData = usersResponse.data?.data?.data || [];
      console.log('📊 Total users:', usersData.length);
      
      if (usersData.length > 0) {
        console.log('\n📋 Sample user data:');
        console.log(JSON.stringify(usersData[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Error:', error.response?.status, error.response?.data);
    }
    
    // Test 2: Get blocked users only
    console.log('\n=== 2. GET /admin/v1/user/app-users/block ===');
    try {
      const blockedResponse = await axios.get('http://localhost:5000/admin/v1/user/app-users/block', { headers });
      console.log('✅ Success:', blockedResponse.status);
      console.log('📊 Full response structure:', JSON.stringify(blockedResponse.data, null, 2));
      
      const blockedData = blockedResponse.data?.data?.data || [];
      console.log('📊 Blocked users:', blockedData.length);
    } catch (error) {
      console.error('❌ Error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error.message);
  }
}

testCorrectUserAPIs();
