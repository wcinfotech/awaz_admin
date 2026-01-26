// Test the actual API endpoint
const axios = require('axios');

async function testReportsAPI() {
  try {
    console.log('🔍 Testing actual API endpoint...');
    
    // Test the post reports endpoint
    const response = await axios.get('http://localhost:5000/admin/v1/report/post-list', {
      headers: {
        'Authorization': 'Bearer your-token-here', // You might need to add auth
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Headers:', response.headers);
    console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('❌ Response Status:', error.response.status);
      console.error('❌ Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testReportsAPI();
