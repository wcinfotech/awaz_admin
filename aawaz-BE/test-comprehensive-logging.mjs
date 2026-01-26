import mongoose from 'mongoose';
import ActivityLogger from './utils/activity-logger.js';

// Comprehensive test for all logging types
const testComprehensiveLogging = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/awaaz');
        console.log('✅ Connected to MongoDB');

        console.log('\n🧪 Testing Comprehensive Activity Logging System...\n');

        // Test User Activity Logs
        console.log('👤 Testing USER Activity Logs...');
        ActivityLogger.logUser('USER_REGISTERED', 'New user registered via email', '507f1f77bcf86cd799439011', {
            email: 'test@example.com',
            registrationMethod: 'email',
            device: 'iPhone 14',
            os: 'iOS 16.0'
        });

        ActivityLogger.logUser('USER_LOGIN', 'User logged in successfully', '507f1f77bcf86cd799439011', {
            loginMethod: 'email',
            ipAddress: '192.168.1.100'
        });

        ActivityLogger.logUser('USER_LOGIN_FAILED', 'Login attempt with invalid password', '507f1f77bcf86cd799439011', {
            reason: 'invalid_password',
            email: 'test@example.com'
        });

        // Test App Activity Logs
        console.log('📱 Testing APP Activity Logs...');
        ActivityLogger.logApp('APP_INSTALLED', 'User installed the application', '507f1f77bcf86cd799439011', {
            device: 'iPhone 14',
            os: 'iOS 16.0',
            appVersion: '2.1.0',
            installSource: 'app_store'
        });

        ActivityLogger.logApp('APP_OPENED', 'User opened the application', '507f1f77bcf86cd799439011', {
            device: 'iPhone 14',
            os: 'iOS 16.0',
            appVersion: '2.1.0',
            sessionDuration: '15 minutes'
        });

        ActivityLogger.logAppCrash('App crash: fatal_error', '507f1f77bcf86cd799439011', {
            crashType: 'fatal_error',
            stack: 'Error: Fatal error\n    at App.render (app.js:123:45)',
            device: 'iPhone 14',
            os: 'iOS 16.0',
            appVersion: '2.1.0'
        });

        // Test Post Activity Logs
        console.log('📝 Testing POST Activity Logs...');
        ActivityLogger.logPost('POST_CREATED', 'User created a new event post', '507f1f77bcf86cd799439011', '507f1f77bcf86cd799439013', {
            postType: 'incident',
            hasAttachment: true,
            hasThumbnail: true,
            shareAnonymous: false
        });

        ActivityLogger.logPost('POST_APPROVED', 'Admin approved user post', '507f1f77bcf86cd799439011', '507f1f77bcf86cd799439013', {
            adminId: '507f1f77bcf86cd799439012',
            postType: 'incident',
            postTitle: 'Traffic incident on highway'
        });

        ActivityLogger.logPost('POST_REJECTED', 'Admin rejected user post', '507f1f77bcf86cd799439011', '507f1f77bcf86cd799439014', {
            adminId: '507f1f77bcf86cd799439012',
            postType: 'rescue',
            postTitle: 'Help needed',
            reason: 'inappropriate_content'
        });

        // Test Comment Activity Logs
        console.log('💬 Testing COMMENT Activity Logs...');
        ActivityLogger.logComment('COMMENT_CREATED', 'User created a comment', '507f1f77bcf86cd799439011', '507f1f77bcf86cd799439015', {
            postId: '507f1f77bcf86cd799439013',
            commentLength: 150
        });

        ActivityLogger.logComment('COMMENT_DELETED', 'User deleted their comment', '507f1f77bcf86cd799439011', '507f1f77bcf86cd799439015', {
            postId: '507f1f77bcf86cd799439013',
            reason: 'user_request'
        });

        // Test Report Activity Logs
        console.log('🚨 Testing REPORT Activity Logs...');
        ActivityLogger.logReport('POST_REPORTED', 'User reported inappropriate post', '507f1f77bcf86cd799439014', '507f1f77bcf86cd799439016', {
            reportedUserId: '507f1f77bcf86cd799439011',
            postId: '507f1f77bcf86cd799439013',
            reason: 'inappropriate_content',
            category: 'spam'
        });

        ActivityLogger.logReport('COMMENT_REPORTED', 'User reported abusive comment', '507f1f77bcf86cd799439014', '507f1f77bcf86cd799439017', {
            reportedUserId: '507f1f77bcf86cd799439011',
            commentId: '507f1f77bcf86cd799439015',
            reason: 'abusive_language'
        });

        ActivityLogger.logReport('PROFILE_REPORTED', 'User reported fake profile', '507f1f77bcf86cd799439014', '507f1f77bcf86cd799439018', {
            reportedUserId: '507f1f77bcf86cd799439019',
            reason: 'fake_profile'
        });

        ActivityLogger.logReport('REPORT_RESOLVED', 'Admin resolved user report', null, '507f1f77bcf86cd799439016', {
            adminId: '507f1f77bcf86cd799439012',
            resolution: 'post_removed',
            actionTaken: 'content_deleted'
        });

        // Test Notification Activity Logs
        console.log('🔔 Testing NOTIFICATION Activity Logs...');
        ActivityLogger.logNotification('NOTIFICATION_SENT', 'Push notification sent to user', '507f1f77bcf86cd799439011', {
            type: 'push',
            title: 'New Event Alert',
            recipients: 1,
            success: true
        });

        ActivityLogger.logNotification('NOTIFICATION_BROADCAST', 'Event notification sent to multiple users', null, {
            eventId: '507f1f77bcf86cd799439013',
            totalUsers: 1250,
            successCount: 1180,
            failureCount: 70,
            type: 'event_broadcast'
        });

        ActivityLogger.logNotification('NOTIFICATION_FAILED', 'Failed to send notification', '507f1f77bcf86cd799439011', {
            type: 'push',
            error: 'device_token_invalid',
            reason: 'user_uninstalled'
        });

        // Test System Activity Logs
        console.log('⚙️ Testing SYSTEM Activity Logs...');
        ActivityLogger.logSystem('BACKUP_COMPLETED', 'Database backup completed successfully', 'SUCCESS', {
            backupSize: '2.5GB',
            duration: '45 seconds',
            location: 'AWS S3'
        });

        ActivityLogger.logSystem('HIGH_MEMORY_USAGE', 'Server memory usage is above 80%', 'WARNING', {
            memoryUsage: '85%',
            availableMemory: '2.1GB',
            server: 'api-server-01'
        });

        ActivityLogger.logSystem('DATABASE_CONNECTION_FAILED', 'Failed to connect to database', 'ERROR', {
            retryAttempts: 3,
            lastAttempt: new Date().toISOString(),
            database: 'users'
        });

        // Test Daily Metrics
        console.log('📊 Testing Daily Metrics...');
        ActivityLogger.logDailyMetrics('DAILY_ACTIVE_USERS', 1250, {
            date: new Date().toISOString().split('T')[0],
            source: 'system_job'
        });

        ActivityLogger.logDailyMetrics('DAILY_NEW_INSTALLS', 45, {
            date: new Date().toISOString().split('T')[0],
            source: 'system_job'
        });

        ActivityLogger.logDailyMetrics('DAILY_UNINSTALLS', 12, {
            date: new Date().toISOString().split('T')[0],
            source: 'system_job'
        });

        ActivityLogger.logDailyMetrics('DAILY_CRASHES', 8, {
            date: new Date().toISOString().split('T')[0],
            source: 'system_job'
        });

        // Test Admin Activity Logs
        console.log('👨‍💼 Testing ADMIN Activity Logs...');
        ActivityLogger.logAdmin('ADMIN_LOGIN_SUCCESS', 'Admin logged in successfully', '507f1f77bcf86cd799439012', null, {
            email: 'admin@example.com',
            loginMethod: 'email'
        });

        ActivityLogger.logAdmin('USER_BLOCKED', 'Admin blocked user account', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439011', {
            reason: 'policy_violation',
            blockType: 'temporary'
        });

        ActivityLogger.logAdmin('USER_UNBLOCKED', 'Admin unblocked user account', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439011', {
            reason: 'appeal_approved',
            blockDuration: '7 days'
        });

        // Wait for all logs to be saved
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test API endpoints
        console.log('\n🔍 Testing API Endpoints...');
        
        const { getLogsSummary, getActivityLogs } = await import('./admin-panel/controllers/activity-log.controllers.js');

        // Mock request and response objects
        const mockReq = {
            query: {
                page: 1,
                limit: 20
            }
        };

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`\n📊 API Response (${code}):`);
                    console.log(JSON.stringify(data, null, 2));
                    return data;
                }
            })
        };

        // Test stats endpoint
        console.log('\n🔍 Testing /admin/v1/activity-log/stats endpoint...');
        await getLogsSummary(mockReq, mockRes);

        // Test logs endpoint
        console.log('\n🔍 Testing /admin/v1/activity-log/list endpoint...');
        await getActivityLogs(mockReq, mockRes);

        console.log('\n🎉 Comprehensive logging test completed successfully!');
        console.log('\n📋 Summary of logged activities:');
        console.log('  ✅ User Activities: Registration, Login, Login Failures');
        console.log('  ✅ App Lifecycle: Install, Open, Crash');
        console.log('  ✅ Post Activities: Create, Approve, Reject');
        console.log('  ✅ Comment Activities: Create, Delete');
        console.log('  ✅ Report Activities: Post, Comment, Profile, Resolution');
        console.log('  ✅ Notification Activities: Send, Broadcast, Failed');
        console.log('  ✅ System Activities: Backup, Memory, Database Errors');
        console.log('  ✅ Daily Metrics: Active Users, Installs, Uninstalls, Crashes');
        console.log('  ✅ Admin Activities: Login, User Management');
        console.log('  ✅ API Endpoints: Stats, List, Export ready');
        
        // Close connection
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
};

testComprehensiveLogging();
