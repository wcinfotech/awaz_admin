import axios from 'axios';

const testFrontendRequest = async () => {
  try {
    console.log('Testing frontend request format...');
    
    // Login to get token (same as frontend)
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data?.body?.token;
    console.log('✅ Login successful, token:', token ? 'received' : 'missing');
    
    // Test with FormData exactly like frontend
    const formData = new FormData();
    
    // Simulate frontend data
    formData.append("postType", "incident");
    formData.append("isDirectAdminPost", "true");
    formData.append("title", "Test Video Event");
    formData.append("description", "Testing video upload");
    formData.append("latitude", "21.2247194");
    formData.append("longitude", "72.806996");
    formData.append("eventTime", new Date().toISOString());
    formData.append("postCategoryId", "67ac24077ad841f38bb9d5ae");
    formData.append("isSensitiveContent", false);
    formData.append("isShareAnonymously", false);
    
    // Add hashtags like frontend
    const tags = ["test", "video"];
    tags.forEach((tag) => formData.append("hashTags", tag));
    
    console.log('📤 FormData prepared, sending...');
    
    try {
      const response = await axios.post('http://localhost:5000/admin/v1/event-post/add', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ SUCCESS!');
      console.log('Status:', response.status);
      console.log('Response:', response.data);
      
      // Test if we can retrieve the created event
      if (response.data?.body?._id) {
        const eventId = response.data.body._id;
        console.log('🔍 Testing event retrieval...');
        
        const detailResponse = await axios.get(`http://localhost:5000/admin/v1/event-post/incident/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Event details retrieved:');
        console.log('Title:', detailResponse.data?.data?.title);
        console.log('Attachment:', detailResponse.data?.data?.attachment);
        console.log('Attachment Type:', detailResponse.data?.data?.attachmentFileType);
      }
      
    } catch (error) {
      console.log('❌ REQUEST FAILED:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
      console.log('Details:', error.response?.data);
      console.log('Full error:', error);
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
  }
};

testFrontendRequest();
