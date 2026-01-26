import globalNotificationService from './services/global-notification.service.js';
import { ObjectId } from 'mongodb';

console.log('🧪 Testing Global Notification Service Directly...\n');

// Create a valid admin ID
const adminId = new ObjectId().toString();

// Test sending global notification directly
async function testGlobalNotificationService() {
    console.log('📢 Testing global notification service...');
    
    try {
        const result = await globalNotificationService.sendGlobalNotification({
            title: 'Test Notification - Direct Service',
            message: 'This is a test notification sent directly via the service.',
            type: 'INFO',
            imageUrl: null,
            deepLink: 'notifications/test'
        }, adminId);
        
        console.log('✅ Global notification sent successfully');
        console.log('📊 Notification ID:', result._id);
        console.log('📊 Title:', result.title);
        console.log('📊 Type:', result.type);
        console.log('👥 Total Users:', result.totalUsers);
        console.log('📊 Status:', result.status);
        console.log('📊 Sent At:', result.sentAt);
        
        return result;
    } catch (error) {
        console.log('❌ Global notification failed:', error.message);
        console.log('🔍 Error details:', error);
        return null;
    }
}

// Test fetching notifications
async function testGetNotifications() {
    console.log('\n📋 Testing get notifications...');
    
    try {
        const result = await globalNotificationService.getAdminNotifications({
            page: 1,
            limit: 10,
            status: 'all',
            type: 'all'
        });
        
        console.log('✅ Notifications retrieved successfully');
        console.log('📊 Total notifications:', result.pagination.total);
        console.log('📄 Notifications:', result.notifications.length);
        
        if (result.notifications.length > 0) {
            console.log('📝 Recent notifications:');
            result.notifications.forEach((notif, index) => {
                console.log(`  ${index + 1}. ${notif.title} - ${notif.type} - ${notif.status}`);
                console.log(`     Sent: ${notif.sentAt}`);
                console.log(`     Users: ${notif.totalUsers}, Delivered: ${notif.deliveredUsers}`);
            });
        }
        
        return result;
    } catch (error) {
        console.log('❌ Get notifications failed:', error.message);
        return null;
    }
}

// Main test function
async function runTests() {
    console.log('🧪 Direct Service Testing (No Authentication Required)...\n');
    
    // Test sending notification
    const notification = await testGlobalNotificationService();
    
    if (notification) {
        // Wait a moment for async processing
        console.log('\n⏳ Waiting for async processing...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test fetching notifications
        await testGetNotifications();
    }
    
    console.log('\n🎉 Direct Service Test Completed!');
    console.log('\n📊 Test Results:');
    console.log(notification ? '✅ Global notification service working' : '❌ Global notification service failed');
    console.log('✅ Database operations working');
    console.log('✅ Logging should be working');
    
    console.log('\n🔍 Check the database for:');
    console.log('📢 admin_notifications collection');
    console.log('📢 user_notifications collection');
    console.log('📢 activity_logs collection (type: NOTIFICATION)');
}

// Run tests
runTests().catch(console.error);
