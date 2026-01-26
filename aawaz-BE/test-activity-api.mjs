import mongoose from 'mongoose';
import express from 'express';
import ActivityLogger from './utils/activity-logger.js';

// Simple API test
const testAPI = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/awaaz');
        console.log('✅ Connected to MongoDB');

        // Create some test logs
        console.log('\n🧪 Creating test logs...');
        
        ActivityLogger.logAdmin('ADMIN_LOGIN_SUCCESS', 'Test admin login', '507f1f77bcf86cd799439012', null, {
            test: true,
            timestamp: new Date()
        });
        
        ActivityLogger.logUser('USER_REGISTERED', 'Test user registration', '507f1f77bcf86cd799439011', {
            test: true,
            device: 'Test Device'
        });
        
        ActivityLogger.logError('TEST_ERROR', 'Test error message', new Error('Test error'), {
            test: true
        });

        // Wait for logs to be saved
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Import and test the controller functions
        const { getLogsSummary, getActivityLogs } = await import('./admin-panel/controllers/activity-log.controllers.js');

        // Mock request and response objects
        const mockReq = {
            query: {}
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

        console.log('\n🎉 API tests completed successfully!');
        
        // Close connection
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
};

testAPI();
