// Check the actual comment report data structure
const axios = require('axios');

async function checkCommentData() {
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
    
    // Get comment reports
    const commentResponse = await axios.get('http://localhost:5000/admin/v1/report/comment-list', { headers });
    
    console.log('🔍 Checking comment data structure...');
    const posts = commentResponse.data.body.data;
    
    posts.forEach((post, index) => {
      console.log(`\n=== Post ${index + 1} ===`);
      console.log('Post ID:', post.postId);
      
      post.reports.forEach((report, reportIndex) => {
        console.log(`\n--- Report ${reportIndex + 1} ---`);
        console.log('Comment ID:', report.commentId);
        console.log('Comment Reply ID:', report.commentReplyId);
        console.log('Report ID:', report.reportId);
        console.log('Comment:', report.comment);
        console.log('Can Delete:', !!report.commentReplyId);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCommentData();
