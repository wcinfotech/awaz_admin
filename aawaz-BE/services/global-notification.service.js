import AdminNotification from '../models/admin-notification.model.js';
import UserNotification from '../models/user-notification.model.js';
import User from '../models/user.model.js';
import DeviceToken from '../models/deviceToken.model.js';
import ActivityLogger from '../utils/activity-logger.js';
import mongoose from 'mongoose';
import axios from 'axios';
import config from '../config/config.js';

class GlobalNotificationService {
    /**
     * Manage FCM token - Add or update (Updated for OneSignal compatibility)
     */
    async manageFcmToken(userId, tokenData) {
        console.log('🔧 MANAGING DEVICE TOKEN:', { userId, tokenData });
        
        const { token, deviceId, platform } = tokenData;
        
        try {
            // Remove existing token for same device from fcmTokens array
            await User.updateOne(
                { _id: userId },
                { $pull: { fcmTokens: { deviceId } } }
            );
            
            // Add new token to fcmTokens array (for compatibility)
            await User.updateOne(
                { _id: userId },
                { 
                    $push: { 
                        fcmTokens: {
                            token,
                            deviceId,
                            platform: platform || 'android',
                            isActive: true,
                            lastUsedAt: new Date(),
                            createdAt: new Date()
                        }
                    }
                }
            );
            
            // Also update pushToken field for OneSignal compatibility
            await User.updateOne(
                { _id: userId },
                { 
                    pushToken: token,
                    deviceId: deviceId
                }
            );
            
            console.log('✅ DEVICE TOKEN MANAGED SUCCESSFULLY (FCM + OneSignal)');
            
            // Log token management
            ActivityLogger.logNotificationUser('FCM_TOKEN_MANAGED', 'User device token managed (FCM + OneSignal)', userId, {
                deviceId,
                platform,
                action: 'add_update',
                provider: 'OneSignal'
            });
            
            return {
                success: true,
                message: 'Device token managed successfully',
                deviceId,
                platform,
                provider: 'OneSignal'
            };
            
        } catch (error) {
            console.error('❌ DEVICE TOKEN MANAGEMENT FAILED:', error.message);
            throw new Error(`Failed to manage device token: ${error.message}`);
        }
    }
    
    /**
     * Remove FCM token
     */
    async removeFcmToken(userId, deviceId) {
        console.log('🗑️ REMOVING FCM TOKEN:', { userId, deviceId });
        
        try {
            const result = await User.updateOne(
                { _id: userId },
                { $pull: { fcmTokens: { deviceId } } }
            );
            
            if (result.modifiedCount === 0) {
                throw new Error('FCM token not found for this device');
            }
            
            console.log('✅ FCM TOKEN REMOVED SUCCESSFULLY');
            
            // Log token removal
            ActivityLogger.logNotificationUser('FCM_TOKEN_REMOVED', 'User FCM token removed', userId, {
                deviceId,
                action: 'remove'
            });
            
            return {
                success: true,
                message: 'FCM token removed successfully',
                deviceId
            };
            
        } catch (error) {
            console.error('❌ FCM TOKEN REMOVAL FAILED:', error.message);
            throw new Error(`Failed to remove FCM token: ${error.message}`);
        }
    }
    
    /**
     * Get user notifications
     */
    async getUserNotifications(userId, options = {}) {
        const { page = 1, limit = 20, unreadOnly = false } = options;
        
        const query = { userId };
        if (unreadOnly) {
            query.isRead = false;
        }
        
        const skip = (page - 1) * limit;
        
        const notifications = await UserNotification.find(query)
            .populate('notificationId', 'title message type sentAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
            
        const total = await UserNotification.countDocuments(query);
        
        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    
    /**
     * Mark notification as read
     */
    async markNotificationAsRead(userId, notificationId) {
        const result = await UserNotification.updateOne(
            { userId, _id: notificationId },
            { isRead: true, readAt: new Date() }
        );
        
        if (result.modifiedCount === 0) {
            throw new Error('Notification not found');
        }
        
        return { success: true, message: 'Notification marked as read' };
    }
    
    /**
     * Get unread notifications count
     */
    async getUnreadNotificationsCount(userId) {
        const count = await UserNotification.countDocuments({
            userId,
            isRead: false
        });
        
        return { unreadCount: count };
    }

    /**
     * Send global notification - STRICT ENFORCED FLOW
     */
    async sendGlobalNotification(notificationData, adminId) {
        console.log('🚀 STARTING NOTIFICATION PIPELINE');
        
        // ✅ STEP 1 – VALIDATE INPUT
        console.log('📝 STEP 1: Validating input...');
        const { title, message, type, imageUrl, deepLink } = notificationData;
        
        if (!title || !message || !type) {
            console.log('❌ STEP 1 FAILED: Missing required fields');
            throw new Error('Title, message, and type are required');
        }
        
        const validTypes = ['INFO', 'ALERT', 'WARNING', 'PROMOTION'];
        if (!validTypes.includes(type)) {
            console.log('❌ STEP 1 FAILED: Invalid notification type');
            throw new Error('Invalid notification type. Must be one of: INFO, ALERT, WARNING, PROMOTION');
        }
        
        console.log('✅ STEP 1 PASSED: Input validation successful');

        // ✅ STEP 2 – SAVE NOTIFICATION (MANDATORY)
        console.log('💾 STEP 2: Saving notification to database...');
        let adminNotification;
        try {
            adminNotification = new AdminNotification({
                title,
                message,
                type,
                imageUrl: imageUrl || null,
                deepLink: deepLink || null,
                sentBy: adminId,
                sentAt: new Date(),
                status: 'PENDING',
                totalUsers: 0,
                deliveredUsers: 0,
                failedUsers: 0
            });
            
            await adminNotification.save();
            console.log('✅ STEP 2 COMPLETED: Notification saved with ID:', adminNotification._id);
        } catch (error) {
            console.log('❌ STEP 2 FAILED: Database save failed:', error.message);
            throw new Error(`Failed to save notification: ${error.message}`);
        }

        // ✅ STEP 3 – LOG ADMIN ACTION (MANDATORY)
        console.log('📋 STEP 3: Logging admin action...');
        try {
            ActivityLogger.logNotificationAdmin('GLOBAL_NOTIFICATION_CREATED', 'Admin created global notification', adminId, {
                notificationId: adminNotification._id,
                title,
                type,
                message: message.substring(0, 100) // Truncate for log
            });
            console.log('✅ STEP 3 COMPLETED: Admin action logged');
        } catch (logError) {
            console.log('⚠️ STEP 3 WARNING: Log creation failed:', logError.message);
            // Continue even if logging fails
        }

        // ✅ STEP 4 – FETCH ALL ACTIVE DEVICE TOKENS
        console.log('👥 STEP 4: Fetching all active device tokens...');
        let deviceTokens;
        let totalTokens = 0;
        
        try {
            // Fetch from dedicated DeviceToken collection
            deviceTokens = await DeviceToken.find({ isActive: true })
                .select('deviceToken userId platform deviceId lastActiveAt')
                .lean();
                
            totalTokens = deviceTokens.length;
            
            console.log('✅ STEP 4 COMPLETED: Found', totalTokens, 'active device tokens');
            console.log('📱 STEP 4 INFO: Platform distribution:', 
                deviceTokens.reduce((acc, token) => {
                    acc[token.platform] = (acc[token.platform] || 0) + 1;
                    return acc;
                }, {})
            );
            
        } catch (error) {
            console.log('❌ STEP 4 FAILED: Device token fetch failed:', error.message);
            throw new Error(`Failed to fetch device tokens: ${error.message}`);
        }

        if (totalTokens === 0) {
            console.log('⚠️ STEP 4 CRITICAL: No active device tokens found');
            
            // Update notification status to FAILED
            await AdminNotification.findByIdAndUpdate(adminNotification._id, {
                status: 'FAILED',
                totalUsers: 0,
                deliveredUsers: 0,
                failedUsers: 0
            });
            
            // Log critical issue
            ActivityLogger.logNotificationSystem('NO_DEVICE_TOKENS', 'No active device tokens found for global notification', 'ERROR', {
                notificationId: adminNotification._id,
                message: 'No active device tokens found - users have not registered their devices'
            });
            
            // Throw clear error for frontend
            throw new Error('No active user device tokens found');
        }

        // ✅ STEP 5 – CREATE USER NOTIFICATIONS (MANDATORY)
        console.log('📬 STEP 5: Creating user notifications...');
        let userNotificationsCreated = 0;
        try {
            // Get unique user IDs from device tokens
            const uniqueUserIds = [...new Set(deviceTokens.map(token => token.userId))];
            
            const userNotifications = uniqueUserIds.map(userId => ({
                userId,
                notificationId: adminNotification._id,
                title,
                message,
                type,
                isRead: false,
                deliveredAt: null,
                pushStatus: 'PENDING'
            }));

            if (userNotifications.length > 0) {
                await UserNotification.insertMany(userNotifications);
                userNotificationsCreated = userNotifications.length;
                console.log('✅ STEP 5 COMPLETED: Created', userNotificationsCreated, 'user notifications');
            }

            // Log user notification creation
            ActivityLogger.logNotificationSystem('USER_NOTIFICATIONS_CREATED', 'User notifications created', 'INFO', {
                notificationId: adminNotification._id,
                userCount: userNotificationsCreated,
                deviceTokenCount: totalTokens
            });
        } catch (error) {
            console.log('❌ STEP 5 FAILED: User notification creation failed:', error.message);
            throw new Error(`Failed to create user notifications: ${error.message}`);
        }

        // Update admin notification with user count
        adminNotification.totalUsers = userNotificationsCreated;
        await adminNotification.save();

        // ✅ STEP 6 – SEND PUSH VIA ONE-SIGNAL (ASYNC, NON-BLOCKING)
        console.log('📡 STEP 6: Starting OneSignal push notification delivery (async)...');
        
        // Start async push delivery without blocking
        this.sendPushNotificationsOneSignal(adminNotification, deviceTokens).catch(error => {
            console.log('❌ ASYNC ONE-SIGNAL PUSH FAILED:', error.message);
            ActivityLogger.logNotificationSystem('PUSH_NOTIFICATION_ASYNC_FAILED', 'Async OneSignal push notification delivery failed', 'ERROR', {
                notificationId: adminNotification._id,
                error: error.message,
                provider: 'OneSignal'
            });
        });

        console.log('🎯 NOTIFICATION PIPELINE COMPLETED SUCCESSFULLY');
        console.log('📊 SUMMARY:');
        console.log('  - Notification ID:', adminNotification._id);
        console.log('  - Title:', title);
        console.log('  - Total Users:', userNotificationsCreated);
        console.log('  - Status:', adminNotification.status);
        console.log('  - Push delivery: Started in background');

        return adminNotification;
    }

    /**
     * Send push notifications via OneSignal
     */
    async sendPushNotificationsOneSignal(adminNotification, deviceTokens) {
        console.log('📡 ONE-SIGNAL PUSH: Starting delivery for notification', adminNotification._id);
        
        let deliveredCount = 0;
        let failedCount = 0;
        let totalTokens = 0;
        const playerIds = [];

        try {
            // Collect all player IDs from deviceTokens
            for (const deviceToken of deviceTokens) {
                if (deviceToken.deviceToken && deviceToken.deviceToken.trim() !== '') {
                    playerIds.push(deviceToken.deviceToken);
                    totalTokens++;
                }
            }

            if (totalTokens === 0) {
                console.log('⚠️ ONE-SIGNAL: No player IDs found for push notification');
                throw new Error('No active device tokens found for push delivery');
            }

            console.log(`📱 ONE-SIGNAL: Sending to ${totalTokens} player IDs`);

            // Prepare OneSignal message
            const message = {
                app_id: config.oneSignal.appId,
                include_player_ids: playerIds,
                contents: {
                    en: adminNotification.message
                },
                headings: {
                    en: adminNotification.title
                },
                data: {
                    type: 'global_notification',
                    notificationId: adminNotification._id.toString(),
                    deepLink: adminNotification.deepLink || null
                },
                ...(adminNotification.imageUrl && {
                    large_icon: adminNotification.imageUrl,
                    big_picture: adminNotification.imageUrl,
                    ios_attachments: {
                        id1: adminNotification.imageUrl
                    }
                }),
                android_group: "global_notifications",
                android_group_message: { en: "You have $[notif_count] new notifications" },
                ios_badgeType: "Increase",
                ios_badgeCount: 1,
                priority: 10
            };

            // Send to OneSignal
            const response = await axios.post('https://onesignal.com/api/v1/notifications', message, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${config.oneSignal.apiKey}`
                }
            });

            if (response.data.errors) {
                console.log('❌ ONE-SIGNAL API ERRORS:', response.data.errors);
                throw new Error(`OneSignal API error: ${JSON.stringify(response.data.errors)}`);
            }

            // Process results
            if (response.data.recipients) {
                deliveredCount = response.data.recipients;
                failedCount = totalTokens - deliveredCount;
            } else {
                // If no recipients count, assume all delivered
                deliveredCount = totalTokens;
                failedCount = 0;
            }

            console.log(`✅ ONE-SIGNAL: Delivered ${deliveredCount}/${totalTokens}, Failed ${failedCount}`);

            // Update user notifications delivery status
            const updatePromises = deviceTokens.map(async (deviceToken) => {
                const userDelivered = playerIds.includes(deviceToken.deviceToken);

                return UserNotification.updateOne(
                    { userId: deviceToken.userId, notificationId: adminNotification._id },
                    { 
                        deliveredAt: userDelivered ? new Date() : null,
                        pushStatus: userDelivered ? 'DELIVERED' : 'FAILED',
                        failureReason: userDelivered ? null : 'Not delivered via OneSignal'
                    }
                );
            });

            await Promise.all(updatePromises);

            // ✅ UPDATE FINAL STATUS
            console.log('📊 ONE-SIGNAL: Updating final notification status...');
            let finalStatus;
            if (deliveredCount === totalTokens && totalTokens > 0) {
                finalStatus = 'SENT';
            } else if (deliveredCount > 0) {
                finalStatus = 'PARTIAL_FAILED';
            } else {
                finalStatus = 'FAILED';
            }

            await AdminNotification.findByIdAndUpdate(adminNotification._id, {
                status: finalStatus,
                deliveredUsers: deliveredCount,
                failedUsers: failedCount
            });

            console.log('✅ ONE-SIGNAL: Final status updated to', finalStatus);

            // ✅ SYSTEM LOGS
            console.log('📋 ONE-SIGNAL: Creating system logs...');
            
            if (deliveredCount > 0) {
                ActivityLogger.logNotificationSystem('PUSH_NOTIFICATION_SENT', 'OneSignal push notifications sent successfully', 'INFO', {
                    notificationId: adminNotification._id,
                    deliveredCount,
                    failedCount,
                    totalTokens,
                    status: finalStatus,
                    provider: 'OneSignal'
                });
            }

            if (failedCount > 0) {
                ActivityLogger.logNotificationSystem('PUSH_NOTIFICATION_FAILED', 'Some OneSignal push notifications failed', 'WARNING', {
                    notificationId: adminNotification._id,
                    failedCount,
                    deliveredCount,
                    totalTokens,
                    provider: 'OneSignal'
                });
            }

            console.log('✅ ONE-SIGNAL: System logs created');
            console.log('🎉 ONE-SIGNAL PUSH DELIVERY COMPLETED');
            console.log('📊 FINAL RESULTS:');
            console.log('  - Total Player IDs:', totalTokens);
            console.log('  - Delivered:', deliveredCount);
            console.log('  - Failed:', failedCount);
            console.log('  - Final Status:', finalStatus);

        } catch (error) {
            console.log('❌ ONE-SIGNAL PUSH ERROR:', error.message);
            
            // Update status to failed
            await AdminNotification.findByIdAndUpdate(adminNotification._id, {
                status: 'FAILED',
                deliveredUsers: 0,
                failedUsers: totalTokens
            });

            ActivityLogger.logNotificationSystem('PUSH_NOTIFICATION_ERROR', 'OneSignal push notification delivery error', 'ERROR', {
                notificationId: adminNotification._id,
                error: error.message,
                provider: 'OneSignal'
            });
            
            throw error;
        }
    }

    /**
     * Send FCM notification (mock implementation)
     */
    async sendFCMNotification(token, notification) {
        // Mock FCM implementation - replace with actual Firebase Admin SDK
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 90% success rate
                if (Math.random() > 0.1) {
                    resolve({
                        success: true,
                        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    });
                } else {
                    reject(new Error('FCM service temporarily unavailable'));
                }
            }, 100); // 100ms delay to simulate network
        });
    }

    /**
     * Get admin notifications list
     */
    async getAdminNotifications(filters = {}) {
        const { page = 1, limit = 10, status = 'all', type = 'all' } = filters;
        
        const query = {};
        if (status !== 'all') {
            query.status = status;
        }
        if (type !== 'all') {
            query.type = type;
        }

        const skip = (page - 1) * limit;

        const notifications = await AdminNotification.find(query)
            .populate('sentBy', 'name email')
            .sort({ sentAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await AdminNotification.countDocuments(query);

        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get notification statistics
     */
    async getNotificationStatistics() {
        const stats = await AdminNotification.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    sent: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
                    partialFailed: { $sum: { $cond: [{ $eq: ['$status', 'PARTIAL_FAILED'] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
                    totalUsers: { $sum: '$totalUsers' },
                    totalDelivered: { $sum: '$deliveredUsers' }
                }
            }
        ]);

        return stats[0] || {
            total: 0,
            sent: 0,
            partialFailed: 0,
            failed: 0,
            pending: 0,
            totalUsers: 0,
            totalDelivered: 0
        };
    }

    /**
     * Get admin notification details
     */
    async getAdminNotificationDetails(notificationId) {
        const notification = await AdminNotification.findById(notificationId)
            .populate('sentBy', 'name email')
            .lean();

        if (!notification) {
            throw new Error('Notification not found');
        }

        // Get user notification stats
        const userStats = await UserNotification.aggregate([
            { $match: { notificationId: new mongoose.Types.ObjectId(notificationId) } },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    readUsers: { $sum: { $cond: ['$isRead', 1, 0] } },
                    deliveredUsers: { $sum: { $cond: [{ $ne: ['$deliveredAt', null] }, 1, 0] } }
                }
            }
        ]);

        notification.userStats = userStats[0] || {
            totalUsers: 0,
            readUsers: 0,
            deliveredUsers: 0
        };

        return notification;
    }

    /**
     * Delete admin notification
     */
    async deleteAdminNotification(notificationId, adminId) {
        const notification = await AdminNotification.findByIdAndDelete(notificationId);
        
        if (!notification) {
            throw new Error('Notification not found');
        }

        // Delete associated user notifications
        await UserNotification.deleteMany({ notificationId });

        // Log deletion
        ActivityLogger.logNotificationAdmin('GLOBAL_NOTIFICATION_DELETED', 'Admin deleted global notification', adminId, {
            notificationId,
            title: notification.title,
            type: notification.type
        });

        return notification;
    }
}

export default new GlobalNotificationService();
