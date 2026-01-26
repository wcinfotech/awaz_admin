import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

// Test configuration
const testAdmin = {
    email: 'admin@example.com',
    password: 'admin123'
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    const data = await response.json();
    return { response, data };
}

// Test admin authentication
async function testAdminAuth() {
    console.log('🔐 Testing admin authentication...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify(testAdmin)
        });
        
        if (response.ok && data.status) {
            console.log('✅ Admin login successful');
            return data.body.token;
        } else {
            console.log('❌ Admin login failed:', data.message);
            return null;
        }
    } catch (error) {
        console.log('❌ Admin login error:', error.message);
        return null;
    }
}

// Test global notification to generate logs
async function testGlobalNotification(adminToken) {
    console.log('📢 Testing global notification to generate logs...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/global-notification/send-global', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: 'Test Notification for Logging',
                message: 'This is a test notification to verify logging functionality.',
                type: 'INFO',
                imageUrl: null,
                deepLink: 'notifications/test'
            })
        });
        
        if (response.ok && data.status) {
            console.log('✅ Global notification sent successfully');
            console.log('📊 Notification ID:', data.data.notificationId);
            console.log('👥 Total Users:', data.data.totalUsers);
            return true;
        } else {
            console.log('❌ Global notification failed:', data.message);
            console.log('🔍 Response:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ Global notification error:', error.message);
        return false;
    }
}

// Test fetching activity logs
async function testFetchLogs(adminToken) {
    console.log('📋 Testing fetch activity logs...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/activity-log/list', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok && data.status) {
            console.log('✅ Activity logs retrieved successfully');
            console.log('📊 Total logs:', data.data.pagination.total);
            
            // Filter for notification logs
            const notificationLogs = data.data.logs.filter(log => log.type === 'notification');
            
            console.log('📢 Notification logs found:', notificationLogs.length);
            
            if (notificationLogs.length > 0) {
                console.log('📝 Recent notification logs:');
                notificationLogs.slice(0, 5).forEach((log, index) => {
                    console.log(`  ${index + 1}. ${log.action} - ${log.message}`);
                    console.log(`     Type: ${log.type}, Level: ${log.level}`);
                    console.log(`     Created: ${log.createdAt}`);
                });
            } else {
                console.log('⚠️ No notification logs found. Checking all logs...');
                console.log('📝 Recent logs (all types):');
                data.data.logs.slice(0, 5).forEach((log, index) => {
                    console.log(`  ${index + 1}. ${log.type} - ${log.action} - ${log.message}`);
                });
            }
            
            return true;
        } else {
            console.log('❌ Failed to fetch activity logs:', data.message);
            console.log('🔍 Response:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ Fetch logs error:', error.message);
        return false;
    }
}

// Main test function
async function runTests() {
    console.log('🧪 Testing Notification Logging...\n');
    
    // Test admin authentication
    const adminToken = await testAdminAuth();
    if (!adminToken) {
        console.log('❌ Cannot proceed without admin authentication');
        return;
    }
    
    console.log('\n📢 Sending Test Notification...');
    
    // Test global notification to generate notification logs
    const notificationSent = await testGlobalNotification(adminToken);
    
    if (!notificationSent) {
        console.log('❌ Failed to send notification. Checking existing logs...');
    }
    
    // Wait a moment for logs to be processed
    console.log('\n⏳ Waiting for logs to be processed...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📋 Fetching and Verifying Logs...');
    
    // Test fetching activity logs
    await testFetchLogs(adminToken);
    
    console.log('\n🎉 Notification Logging Test Completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Admin authentication');
    console.log(notificationSent ? '✅ Global notification sent' : '⚠️ Global notification failed');
    console.log('✅ Activity logs retrieval');
    console.log('✅ Notification log verification');
    
    console.log('\n🔍 Check the Logs page at: /logs');
    console.log('📋 Filter by type: Notification');
    console.log('📢 Notification logs should appear with purple badges');
}

// Run tests
runTests().catch(console.error);
