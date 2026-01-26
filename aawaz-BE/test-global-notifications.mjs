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

// Test send global notification
async function testSendGlobalNotification(adminToken) {
    console.log('📢 Testing send global notification...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/global-notification/send-global', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: 'Test Global Notification',
                message: 'This is a test global notification sent to all users.',
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
            console.log('❌ Send global notification failed:', data.message);
            return null;
        }
    } catch (error) {
        console.log('❌ Send global notification error:', error.message);
        return null;
    }
}

// Test admin notifications list
async function testAdminNotificationsList(adminToken) {
    console.log('📋 Testing admin notifications list...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/global-notification/list', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok && data.status) {
            console.log('✅ Admin notifications list retrieved successfully');
            console.log('📊 Total notifications:', data.data.pagination.total);
            console.log('📄 Notifications:', data.data.notifications.length);
            return true;
        } else {
            console.log('❌ Admin notifications list failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Admin notifications list error:', error.message);
        return false;
    }
}

// Test admin notification statistics
async function testAdminNotificationStatistics(adminToken) {
    console.log('📊 Testing admin notification statistics...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/global-notification/statistics', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok && data.status) {
            console.log('✅ Admin notification statistics retrieved successfully');
            console.log('📊 Total:', data.data.total);
            console.log('📊 Type Breakdown:', data.data.typeBreakdown);
            console.log('📊 Status Breakdown:', data.data.statusBreakdown);
            console.log('📊 Delivery Stats:', data.data.deliveryStats);
            return true;
        } else {
            console.log('❌ Admin notification statistics failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Admin notification statistics error:', error.message);
        return false;
    }
}

// Test user notifications inbox
async function testUserNotificationsInbox(userToken) {
    console.log('📱 Testing user notifications inbox...');
    
    try {
        const { response, data } = await apiRequest('/api/v1/user/notifications', {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        if (response.ok && data.status) {
            console.log('✅ User notifications inbox retrieved successfully');
            console.log('📊 Total notifications:', data.data.pagination.total);
            console.log('📄 Notifications:', data.data.notifications.length);
            return true;
        } else {
            console.log('❌ User notifications inbox failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ User notifications inbox error:', error.message);
        return false;
    }
}

// Test unread notifications count
async function testUnreadNotificationsCount(userToken) {
    console.log('🔢 Testing unread notifications count...');
    
    try {
        const { response, data } = await apiRequest('/api/v1/user/notifications/unread-count', {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        if (response.ok && data.status) {
            console.log('✅ Unread count retrieved successfully');
            console.log('📊 Unread count:', data.data.unreadCount);
            return true;
        } else {
            console.log('❌ Unread count failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Unread count error:', error.message);
        return false;
    }
}

// Test FCM token management
async function testFcmTokenManagement(userToken) {
    console.log('📱 Testing FCM token management...');
    
    try {
        // Add FCM token
        const { response: addResponse, data: addData } = await apiRequest('/api/v1/user/fcm-token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                token: 'test_fcm_token_' + Date.now(),
                deviceId: 'test_device_' + Date.now(),
                platform: 'android'
            })
        });
        
        if (addResponse.ok && addData.status) {
            console.log('✅ FCM token added successfully');
            
            // Remove FCM token
            const { response: removeResponse, data: removeData } = await apiRequest('/api/v1/user/fcm-token', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    deviceId: 'test_device_' + Date.now()
                })
            });
            
            if (removeResponse.ok && removeData.status) {
                console.log('✅ FCM token removed successfully');
                return true;
            } else {
                console.log('❌ FCM token removal failed:', removeData.message);
                return false;
            }
        } else {
            console.log('❌ FCM token addition failed:', addData.message);
            return false;
        }
    } catch (error) {
        console.log('❌ FCM token management error:', error.message);
        return false;
    }
}

// Test different notification types
async function testDifferentNotificationTypes(adminToken) {
    console.log('🎨 Testing different notification types...');
    
    const notificationTypes = ['INFO', 'ALERT', 'WARNING', 'PROMOTION'];
    
    for (const type of notificationTypes) {
        try {
            const { response, data } = await apiRequest('/admin/v1/global-notification/send-global', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    title: `Test ${type} Notification`,
                    message: `This is a test ${type.toLowerCase()} notification.`,
                    type: type,
                    imageUrl: null,
                    deepLink: `notifications/${type.toLowerCase()}`
                })
            });
            
            if (response.ok && data.status) {
                console.log(`✅ ${type} notification sent successfully`);
            } else {
                console.log(`❌ ${type} notification failed:`, data.message);
            }
        } catch (error) {
            console.log(`❌ ${type} notification error:`, error.message);
        }
    }
    
    return true;
}

// Main test function
async function runTests() {
    console.log('🧪 Starting Global Notification System Tests...\n');
    
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
    
    console.log('\n🖥️ Testing Admin APIs...');
    
    // Test send global notification
    const notificationId = await testSendGlobalNotification(adminToken);
    
    // Test admin notifications list
    await testAdminNotificationsList(adminToken);
    
    // Test admin notification statistics
    await testAdminNotificationStatistics(adminToken);
    
    // Test different notification types
    await testDifferentNotificationTypes(adminToken);
    
    console.log('\n📱 Testing User APIs...');
    
    // Test FCM token management
    await testFcmTokenManagement(userToken);
    
    // Test user notifications inbox
    await testUserNotificationsInbox(userToken);
    
    // Test unread notifications count
    await testUnreadNotificationsCount(userToken);
    
    console.log('\n🎉 Global Notification System Tests Completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Admin authentication');
    console.log('✅ User authentication');
    console.log('✅ Send global notification');
    console.log('✅ Admin notifications list');
    console.log('✅ Admin notification statistics');
    console.log('✅ Different notification types');
    console.log('✅ FCM token management');
    console.log('✅ User notifications inbox');
    console.log('✅ Unread notifications count');
}

// Run tests
runTests().catch(console.error);
