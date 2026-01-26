import axios from 'axios';

const testCreateEventFixed = async () => {
  try {
    console.log('Testing create event with fixed boolean...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data?.body?.token;
    
    // Test with corrected boolean values
    const formData = new FormData();
    formData.append("postType", "incident");
    formData.append("isDirectAdminPost", "true");
    formData.append("title", "Test Event Fixed");
    formData.append("latitude", "21.2247194");
    formData.append("longitude", "72.806996");
    formData.append("eventTime", new Date().toISOString());
    formData.append("postCategoryId", "67ac24077ad841f38bb9d5ae"); // Valid category ID
    formData.append("isSensitiveContent", false); // Boolean instead of string
    formData.append("isShareAnonymously", false); // Boolean instead of string
    
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
      
    } catch (error) {
      console.log('❌ ERROR:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
      console.log('Details:', error.response?.data?.details || error.response?.data);
    }
    
  } catch (error) {
    console.log('❌ Login error:', error.response?.data || error.message);
  }
};

testCreateEventFixed();
