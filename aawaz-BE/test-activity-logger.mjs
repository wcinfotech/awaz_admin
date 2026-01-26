import ActivityLogger from './utils/activity-logger.js';

console.log('🧪 Testing Activity Logger directly...\n');

// Test SOS logging
console.log('🚨 Testing SOS logging...');
try {
    ActivityLogger.logSosAdmin('SOS_TRIGGERED', 'Test SOS trigger', 'admin_123', {
        latitude: 21.2247,
        longitude: 72.8069,
        address: 'Test Location',
        sosEventId: 'test_sos_123'
    });
    console.log('✅ SOS log created successfully');
} catch (error) {
    console.log('❌ SOS logging failed:', error.message);
}

// Test notification logging
console.log('\n📢 Testing notification logging...');
try {
    ActivityLogger.logNotificationAdmin('GLOBAL_NOTIFICATION_SENT', 'Test global notification', 'admin_123', {
        notificationId: 'test_notif_123',
        title: 'Test Notification',
        type: 'INFO',
        totalUsers: 100
    });
    console.log('✅ Notification log created successfully');
} catch (error) {
    console.log('❌ Notification logging failed:', error.message);
}

// Test notification system logging
console.log('\n📡 Testing notification system logging...');
try {
    ActivityLogger.logNotificationSystem('PUSH_SENT', 'Push notification sent successfully', 'INFO', {
        userId: 'user_123',
        notificationId: 'test_notif_123',
        tokenCount: 2
    });
    console.log('✅ Notification system log created successfully');
} catch (error) {
    console.log('❌ Notification system logging failed:', error.message);
}

console.log('\n🎉 Activity Logger Test Completed!');
console.log('\n📊 Check the database for new log entries with:');
console.log('🚨 Type: "sos" and Action: "SOS_TRIGGERED"');
console.log('📢 Type: "notification" and Action: "GLOBAL_NOTIFICATION_SENT"');
console.log('📡 Type: "notification" and Action: "PUSH_SENT"');
