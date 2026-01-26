// Test post reports data structure and check post IDs
const axios = require('axios');

async function testPostData() {
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
    
    // Get post reports
    const postResponse = await axios.get('http://localhost:5000/admin/v1/report/post-list', { headers });
    
    console.log('🔍 Checking post reports data structure...');
    const posts = postResponse.data.body;
    
    posts.forEach((post, index) => {
      console.log(`\n=== Post ${index + 1} ===`);
      console.log('Post ID (postId):', post.postId);
      console.log('Post ID type:', typeof post.postId);
      console.log('Post ID length:', post.postId ? post.postId.length : 'N/A');
      console.log('Is valid ObjectId:', /^[0-9a-fA-F]{24}$/.test(post.postId));
      console.log('Reported counts:', post.reportedCounts);
      console.log('Latest reason:', post.latestReportedReason);
    });
    
    // Test if we can access one of these posts
    if (posts.length > 0) {
      const testPostId = posts[0].postId;
      console.log(`\n🔍 Testing post access with ID: ${testPostId}`);
      
      try {
        const postDetailResponse = await axios.get(`http://localhost:5000/admin/v1/admin-event-post/${testPostId}`, { headers });
        console.log('✅ Post accessible:', postDetailResponse.data.status);
      } catch (error) {
        console.error('❌ Post access error:', error.response?.status, error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPostData();
