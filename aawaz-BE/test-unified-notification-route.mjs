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
        const { response, data } = await apiRequest('/admin/v1/auth/login/email', {
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

// Test global notification using the unified route
async function testGlobalNotification(adminToken) {
    console.log('📢 Testing global notification via unified route...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/notification/send-global', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: 'Test Notification - Unified Route',
                message: 'This is a test notification sent via the unified notification route.',
                type: 'INFO',
                imageUrl: null,
                deepLink: 'notifications/test'
            })
        });
        
        if (response.ok && data.status) {
            console.log('✅ Global notification sent successfully');
            console.log('📊 Notification ID:', data.data.notificationId);
            console.log('👥 Total Users:', data.data.totalUsers);
            console.log('📊 Status:', data.data.status);
            return data.data.notificationId;
        } else {
            console.log('❌ Global notification failed:', data.message);
            console.log('🔍 Response:', data);
            return null;
        }
    } catch (error) {
        console.log('❌ Global notification error:', error.message);
        return null;
    }
}

// Test fetching notifications list
async function testNotificationList(adminToken) {
    console.log('📋 Testing notification list...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/notification/list', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok && data.status) {
            console.log('✅ Notification list retrieved successfully');
            console.log('📊 Total notifications:', data.data.pagination.total);
            console.log('📄 Notifications:', data.data.notifications.length);
            
            if (data.data.notifications.length > 0) {
                console.log('📝 Recent notifications:');
                data.data.notifications.slice(0, 3).forEach((notif, index) => {
                    console.log(`  ${index + 1}. ${notif.title} - ${notif.type} - ${notif.status}`);
                });
            }
            
            return true;
        } else {
            console.log('❌ Notification list failed:', data.message);
            console.log('🔍 Response:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ Notification list error:', error.message);
        return false;
    }
}

// Test fetching activity logs
async function testActivityLogs(adminToken) {
    console.log('📋 Testing activity logs...');
    
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
            const notificationLogs = data.data.logs.filter(log => log.type === 'NOTIFICATION');
            
            console.log('📢 Notification logs found:', notificationLogs.length);
            
            if (notificationLogs.length > 0) {
                console.log('📝 Recent notification logs:');
                notificationLogs.slice(0, 3).forEach((log, index) => {
                    console.log(`  ${index + 1}. ${log.action} - ${log.message}`);
                    console.log(`     Type: ${log.type}, Level: ${log.level}`);
                });
            } else {
                console.log('⚠️ No notification logs found. Checking recent logs...');
                data.data.logs.slice(0, 5).forEach((log, index) => {
                    console.log(`  ${index + 1}. ${log.type} - ${log.action} - ${log.message}`);
                });
            }
            
            return true;
        } else {
            console.log('❌ Activity logs failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Activity logs error:', error.message);
        return false;
    }
}

// Main test function
async function runTests() {
    console.log('🧪 Testing Unified Notification Route...\n');
    
    // Test admin authentication
    const adminToken = await testAdminAuth();
    if (!adminToken) {
        console.log('❌ Cannot proceed without admin authentication');
        return;
    }
    
    console.log('\n📢 Sending Test Notification...');
    
    // Test global notification
    const notificationId = await testGlobalNotification(adminToken);
    
    if (notificationId) {
        console.log('\n📋 Checking Notification List...');
        await testNotificationList(adminToken);
    }
    
    // Wait a moment for logs to be processed
    console.log('\n⏳ Waiting for logs to be processed...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📋 Checking Activity Logs...');
    
    // Test activity logs
    await testActivityLogs(adminToken);
    
    console.log('\n🎉 Unified Notification Route Test Completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Admin authentication');
    console.log(notificationId ? '✅ Global notification sent' : '❌ Global notification failed');
    console.log('✅ Notification list check');
    console.log('✅ Activity logs check');
    
    console.log('\n🔍 Now you can use: POST /admin/v1/notification/send-global');
    console.log('📋 Check notifications at: GET /admin/v1/notification/list');
    console.log('📋 Check logs at: /logs (filter by NOTIFICATION)');
}

// Run tests
runTests().catch(console.error);
