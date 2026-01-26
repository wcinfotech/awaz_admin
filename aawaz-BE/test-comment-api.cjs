// Test comment API response structure in detail
const axios = require('axios');

async function testCommentAPI() {
  try {
    console.log('🔍 Testing comment API in detail...');
    
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
    
    // Test comment reports API
    const commentResponse = await axios.get('http://localhost:5000/admin/v1/report/comment-list', { headers });
    console.log('✅ Comment API full response:', JSON.stringify(commentResponse.data, null, 2));
    
    // Check the structure
    console.log('🔍 Response structure:');
    console.log('- Has body:', !!commentResponse.data?.body);
    console.log('- Body type:', typeof commentResponse.data?.body);
    console.log('- Body keys:', commentResponse.data?.body ? Object.keys(commentResponse.data.body) : 'none');
    
    if (commentResponse.data?.body?.data) {
      console.log('- Body.data length:', commentResponse.data.body.data.length);
      console.log('- First comment item:', JSON.stringify(commentResponse.data.body.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('❌ Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCommentAPI();
