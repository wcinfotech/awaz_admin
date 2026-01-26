import axios from 'axios';

const testNewEvents = async () => {
  try {
    console.log('Testing new events with correct postTypes...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data?.body?.token;
    
    // Test the new events
    const testEvents = [
      { id: '69736686e97931c2f23f0997', postType: 'incident' },
      { id: '69736686e97931c2f23f0998', postType: 'rescue' },
      { id: '69736686e97931c2f23f0999', postType: 'general_category' }
    ];
    
    for (const { id, postType } of testEvents) {
      try {
        console.log(`\n=== Testing ${postType} (ID: ${id}) ===`);
        const response = await axios.get(`http://localhost:5000/admin/v1/event-post/${postType}/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ ${postType}: SUCCESS`);
        console.log(`Title: ${response.data.data?.title}`);
        console.log(`Description: ${response.data.data?.additionalDetails}`);
        console.log(`Attachment: ${response.data.data?.attachment}`);
        console.log(`File Type: ${response.data.data?.attachmentFileType}`);
        console.log(`PostType: ${response.data.data?.postType}`);
        
      } catch (error) {
        console.log(`❌ ${postType}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('\n=== FRONTEND URLS TO TEST ===');
    console.log('Incident: http://localhost:5173/event/incident/69736686e97931c2f23f0997');
    console.log('Rescue: http://localhost:5173/event/rescue/69736686e97931c2f23f0998');
    console.log('General: http://localhost:5173/event/general_category/69736686e97931c2f23f0999');
    
  } catch (error) {
    console.log('❌ Login error:', error.response?.data || error.message);
  }
};

testNewEvents();
