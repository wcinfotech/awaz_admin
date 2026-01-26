import { ObjectId } from 'mongodb';
import ActivityLogger from './utils/activity-logger.js';

console.log('🧪 Testing Activity Logger with valid ObjectIds...\n');

// Create valid MongoDB ObjectIds
const validAdminId = new ObjectId();
const validUserId = new ObjectId();

// Test SOS logging
console.log('🚨 Testing SOS logging...');
try {
    ActivityLogger.logSosAdmin('SOS_TRIGGERED', 'Test SOS trigger', validAdminId.toString(), {
        latitude: 21.2247,
        longitude: 72.8069,
        address: 'Test Location',
        sosEventId: new ObjectId().toString()
    });
    console.log('✅ SOS log created successfully');
} catch (error) {
    console.log('❌ SOS logging failed:', error.message);
}

// Test notification logging
console.log('\n📢 Testing notification logging...');
try {
    ActivityLogger.logNotificationAdmin('GLOBAL_NOTIFICATION_SENT', 'Test global notification', validAdminId.toString(), {
        notificationId: new ObjectId().toString(),
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
        userId: validUserId.toString(),
        notificationId: new ObjectId().toString(),
        tokenCount: 2
    });
    console.log('✅ Notification system log created successfully');
} catch (error) {
    console.log('❌ Notification system logging failed:', error.message);
}

console.log('\n🎉 Activity Logger Test Completed!');
console.log('\n📊 Check the database for new log entries with:');
console.log('🚨 Type: "SOS" and Action: "SOS_TRIGGERED"');
console.log('📢 Type: "NOTIFICATION" and Action: "GLOBAL_NOTIFICATION_SENT"');
console.log('📡 Type: "NOTIFICATION" and Action: "PUSH_SENT"');
console.log('\n🔍 Check the Logs page at: /logs');
console.log('📋 Filter by type: SOS or NOTIFICATION');
