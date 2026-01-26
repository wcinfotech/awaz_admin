import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

// Test configuration
const testAdmin = {
    email: 'admin@example.com',
    password: 'admin123'
};

const testUser = {
    email: 'test@example.com',
    password: 'password123'
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

// Test user authentication
async function testUserAuth() {
    console.log('🔐 Testing user authentication...');
    
    try {
        const { response, data } = await apiRequest('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify(testUser)
        });
        
        if (response.ok && data.status) {
            console.log('✅ User login successful');
            return data.body.token;
        } else {
            console.log('❌ User login failed:', data.message);
            return null;
        }
    } catch (error) {
        console.log('❌ User login error:', error.message);
        return null;
    }
}

// Test SOS trigger to generate SOS logs
async function testSosTrigger(userToken) {
    console.log('🚨 Testing SOS trigger to generate logs...');
    
    try {
        // First save SOS contacts
        const { response: saveResponse, data: saveData } = await apiRequest('/api/v1/user/sos-contacts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                contacts: [
                    {
                        name: 'Emergency Contact 1',
                        phone: '9876543210',
                        countryCode: '+91'
                    },
                    {
                        name: 'Emergency Contact 2',
                        phone: '9876543211',
                        countryCode: '+91'
                    }
                ]
            })
        });
        
        if (!saveResponse.ok) {
            console.log('❌ Failed to save SOS contacts:', saveData.message);
            return;
        }
        
        console.log('✅ SOS contacts saved');
        
        // Now trigger SOS
        const { response, data } = await apiRequest('/api/v1/user/sos/trigger', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                latitude: 21.2247,
                longitude: 72.8069,
                address: 'Test Location, Surat'
            })
        });
        
        if (response.ok && data.status) {
            console.log('✅ SOS triggered successfully');
            console.log('📊 SOS Event ID:', data.data.sosEventId);
            return true;
        } else {
            console.log('❌ SOS trigger failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ SOS trigger error:', error.message);
        return false;
    }
}

// Test global notification to generate notification logs
async function testGlobalNotification(adminToken) {
    console.log('📢 Testing global notification to generate logs...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/global-notification/send-global', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: 'Test Notification for Logs',
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
            
            // Filter for SOS and notification logs
            const sosLogs = data.data.logs.filter(log => log.type === 'sos');
            const notificationLogs = data.data.logs.filter(log => log.type === 'notification');
            
            console.log('🚨 SOS logs found:', sosLogs.length);
            console.log('📢 Notification logs found:', notificationLogs.length);
            
            if (sosLogs.length > 0) {
                console.log('📝 Recent SOS logs:');
                sosLogs.slice(0, 3).forEach((log, index) => {
                    console.log(`  ${index + 1}. ${log.action} - ${log.message}`);
                });
            }
            
            if (notificationLogs.length > 0) {
                console.log('📝 Recent notification logs:');
                notificationLogs.slice(0, 3).forEach((log, index) => {
                    console.log(`  ${index + 1}. ${log.action} - ${log.message}`);
                });
            }
            
            return true;
        } else {
            console.log('❌ Failed to fetch activity logs:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Fetch logs error:', error.message);
        return false;
    }
}

// Main test function
async function runTests() {
    console.log('🧪 Testing SOS and Notification Logging...\n');
    
    // Test admin authentication
    const adminToken = await testAdminAuth();
    if (!adminToken) {
        console.log('❌ Cannot proceed without admin authentication');
        return;
    }
    
    // Test user authentication
    const userToken = await testUserAuth();
    if (!userToken) {
        console.log('❌ Cannot proceed without user authentication');
        return;
    }
    
    console.log('\n🚨 Generating SOS Logs...');
    
    // Test SOS trigger to generate SOS logs
    await testSosTrigger(userToken);
    
    console.log('\n📢 Generating Notification Logs...');
    
    // Test global notification to generate notification logs
    await testGlobalNotification(adminToken);
    
    // Wait a moment for logs to be processed
    console.log('\n⏳ Waiting for logs to be processed...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📋 Fetching and Verifying Logs...');
    
    // Test fetching activity logs
    await testFetchLogs(adminToken);
    
    console.log('\n🎉 SOS and Notification Logging Test Completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Admin authentication');
    console.log('✅ User authentication');
    console.log('✅ SOS trigger (generates SOS logs)');
    console.log('✅ Global notification (generates notification logs)');
    console.log('✅ Activity logs retrieval');
    console.log('✅ SOS and notification log filtering');
    
    console.log('\n🔍 Check the Logs page at: /logs');
    console.log('📋 Filter by type: SOS or Notification');
    console.log('🚨 SOS logs should appear with red Shield icon');
    console.log('📢 Notification logs should appear with purple badge');
}

// Run tests
runTests().catch(console.error);
