import axios from 'axios';

const testRealEventWithVideo = async () => {
  try {
    console.log('Testing real event with video...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data?.body?.token;
    
    // Test with real event ID that has video
    const eventId = '67cfcb0e5cd45c3a15344073'; // "traffic jam gyu" with video
    
    const response = await axios.get(`http://localhost:5000/admin/v1/event-post/incident/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('=== REAL EVENT RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Title:', response.data.data?.title);
    console.log('Attachment:', response.data.data?.attachment);
    console.log('Attachment Type:', response.data.data?.attachmentFileType);
    console.log('Thumbnail:', response.data.data?.thumbnail);
    
    // Test media detection logic
    const attachment = response.data.data?.attachment;
    const attachmentFileType = response.data.data?.attachmentFileType;
    
    console.log('\n=== MEDIA DETECTION LOGIC ===');
    console.log('attachmentFileType?.includes("video"):', attachmentFileType?.includes("video"));
    console.log('attachment?.match(video regex):', attachment?.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i));
    
    const isVideo = (attachmentFileType?.includes("video") || 
                   attachment?.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i));
    
    console.log('Final isVideo result:', isVideo);
    console.log('Should render as:', isVideo ? 'VIDEO' : 'IMAGE');
    
    console.log('\n=== FRONTEND URL TO TEST ===');
    console.log(`http://localhost:5173/event/incident/${eventId}`);
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
};

testRealEventWithVideo();
