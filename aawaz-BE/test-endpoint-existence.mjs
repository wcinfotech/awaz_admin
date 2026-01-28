// Simple test to check if endpoints exist
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testEndpointExists(endpoint, method = 'GET') {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log(`📡 ${method} ${endpoint}`);
        console.log(`   Status: ${response.status}`);
        
        if (response.status === 401) {
            console.log('   ✅ Endpoint exists (requires auth)');
            return true;
        } else if (response.status === 404) {
            console.log('   ❌ Endpoint not found');
            return false;
        } else {
            console.log('   ✅ Endpoint exists');
            const data = await response.text();
            console.log(`   Response: ${data.substring(0, 100)}...`);
            return true;
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🧪 TESTING DELETE ENDPOINT EXISTENCE');
    console.log('====================================\n');
    
    // Test if server is running
    console.log('1. Testing server connection...');
    await testEndpointExists('/');
    
    // Test new delete endpoints
    console.log('\n2. Testing new delete endpoints...');
    
    // Test draft delete endpoint
    console.log('\n📋 Draft delete endpoints:');
    await testEndpointExists('/admin/v1/event-post-draft/123/simple-delete', 'DELETE');
    await testEndpointExists('/admin/v1/event-post-draft/delete/123', 'DELETE');
    
    // Test post delete endpoints  
    console.log('\n📋 Post delete endpoints:');
    await testEndpointExists('/admin/v1/event-post/123/simple-delete', 'DELETE');
    await testEndpointExists('/admin/v1/event-post/123', 'DELETE');
    await testEndpointExists('/admin/v1/event-post/123/permanent-delete', 'DELETE');
    
    // Test list endpoints to see if we can get data
    console.log('\n3. Testing list endpoints...');
    await testEndpointExists('/admin/v1/event-post/incident/list');
    await testEndpointExists('/admin/v1/event-post-draft/admin-drafts');
    
    console.log('\n🎉 ENDPOINT TEST COMPLETED!');
    console.log('============================');
}

main().catch(console.error);
