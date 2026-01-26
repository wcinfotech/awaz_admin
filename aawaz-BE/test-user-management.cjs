// Test the user management APIs
const axios = require('axios');

async function testUserManagementAPIs() {
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
    
    console.log('🔍 Testing User Management APIs...\n');
    
    // Test 1: Get all app users
    console.log('=== 1. GET /admin/v1/user/app-users/block ===');
    let usersResponse;
    try {
      usersResponse = await axios.get('http://localhost:5000/admin/v1/user/app-users/block', { headers });
      console.log('✅ Success:', usersResponse.status);
      console.log('📊 Total users:', usersResponse.data?.data?.length || usersResponse.data?.body?.length || 0);
      
      const users = usersResponse.data?.data || usersResponse.data?.body || [];
      const blockedUsers = users.filter(user => user.isBlocked);
      const activeUsers = users.filter(user => !user.isBlocked);
      
      console.log(`🟢 Active users: ${activeUsers.length}`);
      console.log(`🔴 Blocked users: ${blockedUsers.length}`);
      
      if (users.length > 0) {
        console.log('\n📋 Sample user data:');
        console.log(JSON.stringify(users[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Error:', error.response?.status, error.response?.data);
      return;
    }
    
    // Test 2: Get user profile (if we have a user)
    const users = usersResponse.data?.data || usersResponse.data?.body || [];
    if (users.length > 0) {
      const userId = users[0]._id;
      console.log(`\n=== 2. GET /admin/v1/user/user-profile/${userId} ===`);
      
      try {
        const profileResponse = await axios.get(`http://localhost:5000/admin/v1/user/user-profile/${userId}`, { headers });
        console.log('✅ Success:', profileResponse.status);
        console.log('👤 User profile:', JSON.stringify(profileResponse.data, null, 2));
      } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.data);
      }
      
      // Test 3: Block/unblock user
      console.log(`\n=== 3. PUT /admin/v1/user/block-app-user/${userId} ===`);
      
      try {
        const blockResponse = await axios.put(`http://localhost:5000/admin/v1/user/block-app-user/${userId}`, {}, { headers });
        console.log('✅ Success:', blockResponse.status);
        console.log('📝 Response:', blockResponse.data);
        
        // Test again to toggle back
        console.log('\n=== 4. PUT /admin/v1/user/block-app-user/${userId} (toggle back) ===');
        const unblockResponse = await axios.put(`http://localhost:5000/admin/v1/user/block-app-user/${userId}`, {}, { headers });
        console.log('✅ Success:', unblockResponse.status);
        console.log('📝 Response:', unblockResponse.data);
      } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.data);
      }
    } else {
      console.log('\n⚠️ No users found to test profile and block/unblock APIs');
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error.message);
  }
}

testUserManagementAPIs();
