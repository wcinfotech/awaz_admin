import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 8000,
});

async function testFrontendFix() {
  try {
    // Login first
    const loginResponse = await api.post('/admin/v1/auth/login/email', {
      email: 'admin@awaaz.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.body.token;
    
    // Test events API with frontend-style call
    const eventsResponse = await api.get('/admin/v1/event-post/incident/list', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: { search: '', page: 1, limit: 50 }
    });
    
    console.log('=== Frontend-Style API Test ===');
    console.log('Response status:', eventsResponse.status);
    console.log('Full response:', JSON.stringify(eventsResponse.data, null, 2));
    
    console.log('\n=== Data Access Tests ===');
    console.log('res.data?.data?.data (OLD WRONG):', eventsResponse.data?.data?.data);
    console.log('res.data?.body?.data (NEW CORRECT):', eventsResponse.data?.body?.data);
    
    console.log('\n=== Frontend Data Processing ===');
    const rows = eventsResponse.data?.body?.data || [];
    console.log('Rows count:', rows.length);
    
    if (rows.length > 0) {
      console.log('=== Sample Event Data ===');
      const processedRow = {
        id: rows[0]._id || rows[0].id,
        title: rows[0].title || "Untitled",
        status: ((rows[0].status || "PENDING")).toUpperCase(),
        category: rows[0].postCategory || "",
        distanceKm: 0,
        type: rows[0].postType || "",
        createdAt: rows[0].createdAt || "",
        timeline: [],
      };
      console.log('Processed event:', processedRow);
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testFrontendFix();
