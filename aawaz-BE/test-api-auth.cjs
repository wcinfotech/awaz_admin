// Test API with proper authentication
const axios = require('axios');

async function testAPIWithAuth() {
  try {
    console.log('🔍 Testing API endpoints...');
    
    // First, try to login to get a token
    console.log('🔐 Attempting login...');
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    if (loginResponse.data?.body?.token) {
      const token = loginResponse.data.body.token;
      console.log('✅ Login successful, got token');
      
      // Now test the reports API with the token
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('🔍 Testing post reports API...');
      const postResponse = await axios.get('http://localhost:5000/admin/v1/report/post-list', { headers });
      console.log('✅ Post reports API response:', postResponse.data);
      console.log('📊 Post reports count:', postResponse.data?.data?.length || 0);
      
      console.log('🔍 Testing comment reports API...');
      const commentResponse = await axios.get('http://localhost:5000/admin/v1/report/comment-list', { headers });
      console.log('✅ Comment reports API response:', commentResponse.data);
      console.log('📊 Comment reports count:', commentResponse.data?.data?.length || 0);
      
      console.log('🔍 Testing user reports API...');
      const userResponse = await axios.get('http://localhost:5000/admin/v1/report/user-list', { headers });
      console.log('✅ User reports API response:', userResponse.data);
      console.log('📊 User reports count:', userResponse.data?.data?.length || 0);
      
    } else {
      console.log('❌ Login failed - no token in response');
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    if (error.response) {
      console.error('❌ Response Status:', error.response.status);
      console.error('❌ Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAPIWithAuth();
