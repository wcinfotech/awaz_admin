import mongoose from 'mongoose';
import ActivityLogger from './utils/activity-logger.js';
import ActivityLog from './admin-panel/models/activity-log.model.js';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/awaaz')
    .then(() => {
        console.log('✅ Connected to MongoDB');
        
        // Test different types of logs
        console.log('\n🧪 Testing Activity Logger...\n');
        
        // Test 1: User activity
        ActivityLogger.logUser('USER_REGISTERED', 'New user installed application', '507f1f77bcf86cd799439011', {
            device: 'iPhone 14',
            os: 'iOS 16.0',
            appVersion: '2.1.0'
        });
        console.log('✅ User log created');
        
        // Test 2: Admin activity
        ActivityLogger.logAdmin('ADMIN_LOGIN_SUCCESS', 'Admin logged in successfully', '507f1f77bcf86cd799439012', null, {
            email: 'admin@example.com',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
        console.log('✅ Admin log created');
        
        // Test 3: Post activity
        ActivityLogger.logPost('POST_CREATED', 'User created a new post', '507f1f77bcf86cd799439011', '507f1f77bcf86cd799439013', {
            postType: 'event',
            hasMedia: true,
            location: 'New York, USA'
        });
        console.log('✅ Post log created');
        
        // Test 4: Notification activity
        ActivityLogger.logNotification('NOTIFICATION_SENT', 'Push notification sent to user', '507f1f77bcf86cd799439011', {
            type: 'push',
            title: 'New Event Alert',
            recipients: 1250
        });
        console.log('✅ Notification log created');
        
        // Test 5: System success
        ActivityLogger.logSuccess('BACKUP_COMPLETED', 'Database backup completed successfully', {
            backupSize: '2.5GB',
            duration: '45 seconds',
            location: 'AWS S3'
        });
        console.log('✅ Success log created');
        
        // Test 6: System warning
        ActivityLogger.logWarning('HIGH_MEMORY_USAGE', 'Server memory usage is above 80%', {
            memoryUsage: '85%',
            availableMemory: '2.1GB',
            server: 'api-server-01'
        });
        console.log('✅ Warning log created');
        
        // Test 7: System error
        ActivityLogger.logError('DATABASE_CONNECTION_FAILED', 'Failed to connect to database', new Error('Connection timeout'), {
            retryAttempts: 3,
            lastAttempt: new Date().toISOString(),
            database: 'users'
        });
        console.log('✅ Error log created');
        
        // Test 8: Report activity
        ActivityLogger.log({
            level: 'INFO',
            type: 'REPORT',
            action: 'POST_REPORTED',
            message: 'User reported inappropriate content',
            userId: '507f1f77bcf86cd799439014',
            entityId: '507f1f77bcf86cd799439015',
            metadata: {
                reason: 'inappropriate_content',
                reporterId: '507f1f77bcf86cd799439016',
                category: 'spam'
            }
        });
        console.log('✅ Report log created');
        
        console.log('\n⏳ Waiting for logs to be saved...');
        
        // Wait a bit for async operations to complete
        setTimeout(async () => {
            try {
                // Check if logs were saved
                const count = await ActivityLog.countDocuments();
                console.log(`✅ Total logs in database: ${count}`);
                
                // Get recent logs
                const recentLogs = await ActivityLog.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('level type action message createdAt');
                
                console.log('\n📋 Recent logs:');
                recentLogs.forEach(log => {
                    console.log(`  [${log.level}] ${log.type} - ${log.action}: ${log.message}`);
                });
                
                console.log('\n🎉 Activity logging test completed successfully!');
                process.exit(0);
                
            } catch (error) {
                console.error('❌ Error checking logs:', error);
                process.exit(1);
            }
        }, 2000);
        
    })
    .catch(error => {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    });
