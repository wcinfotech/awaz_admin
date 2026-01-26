import axios from 'axios';

const testNewEvent = async () => {
  try {
    console.log('Testing new event endpoint...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data?.body?.token;
    
    // Test the new route with the new event ID
    const eventId = '69735f09dbd8506b782e4c5a';
    
    const response = await axios.get(`http://localhost:5000/admin/v1/event-post/incident/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SUCCESS! Event data response:');
    console.log('Title:', response.data.data?.title);
    console.log('Description:', response.data.data?.additionalDetails);
    console.log('Attachment:', response.data.data?.attachment);
    console.log('File Type:', response.data.data?.attachmentFileType);
    console.log('Full Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
};

testNewEvent();
