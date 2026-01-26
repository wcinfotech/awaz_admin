import http from 'http';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg1MmE3MjNkZjE4ZjI3MmE2MjgyOCIsImVtYWlsIjoic3VwZXJhZG1pbkBnbWFpbC5jb20iLCJyb2xlIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc0OTAzNDE4OSwiZXhwIjoxNzUxNjI2MTg5fQ.0dVOb9E8aKAIe4YweLl8VUHcZv61qXfyBj3fBYB3I1o';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/admin/v1/event-post/filter/incident/all?limit=200',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Response status:', parsed.status);
      console.log('Message:', parsed.message);
      console.log('Total Items:', parsed.data?.totalItems);
      console.log('Data Count:', parsed.data?.data?.length);
      
      if (parsed.data?.data?.length > 0) {
        console.log('\nFirst 3 items:');
        parsed.data.data.slice(0, 3).forEach((item, i) => {
          console.log(`  ${i+1}. ${item._id}: ${item.title} (${item.status})`);
        });
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
