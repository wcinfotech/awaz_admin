import AdminNotification from '../models/admin-notification.model.js';
import User from '../models/user.model.js';
import UserNotification from '../models/user-notification.model.js';
import ActivityLogger from '../utils/activity-logger.js';

class GlobalNotificationService {
    /**
     * Send global notification to all users
     */
    async sendGlobalNotification(notificationData, adminId) {
        try {
            const { title, message, type, imageUrl, deepLink } = notificationData;

            // Validate required fields
            if (!title || !message || !type) {
                throw new Error('Title, message, and type are required');
            }

            // Get all active users
            const users = await User.find({ 
                isBlocked: false,
                'fcmTokens.0': { $exists: true } // Users with at least one FCM token
            }).select('_id fcmTokens');

            if (users.length === 0) {
                throw new Error('No active users found with FCM tokens');
            }

            // Create admin notification record
            const adminNotification = new AdminNotification({
                title,
                message,
                type,
                imageUrl: imageUrl || null,
                deepLink: deepLink || null,
                sentBy: adminId,
                totalUsers: users.length
            });

            await adminNotification.save();

            // Log admin action
            ActivityLogger.logNotificationAdmin('GLOBAL_NOTIFICATION_SENT', 'Admin sent global notification', adminId, {
                notificationId: adminNotification._id,
                title,
                type,
                totalUsers: users.length
            });

            // Send notifications asynchronously (non-blocking)
            this.sendNotificationsToUsers(adminNotification, users).catch(error => {
                ActivityLogger.logNotificationSystem('GLOBAL_NOTIFICATION_SEND_ERROR', 'Error sending notifications to users', 'ERROR', {
                    notificationId: adminNotification._id
                });
            });

            return adminNotification;
        } catch (error) {
            ActivityLogger.logError('GLOBAL_NOTIFICATION_CREATE_ERROR', 'Error creating global notification', error, {
                adminId,
                notificationData
            });
            throw error;
        }
    }

    /**
     * Send notifications to all users (async)
     */
    async sendNotificationsToUsers(adminNotification, users) {
        let deliveredCount = 0;
        let failedCount = 0;

        // Create user notification records first
        const userNotifications = users.map(user => ({
            userId: user._id,
            notificationId: adminNotification._id,
            title: adminNotification.title,
            message: adminNotification.message,
            type: adminNotification.type,
            imageUrl: adminNotification.imageUrl,
            deepLink: adminNotification.deepLink
        }));

        // Bulk insert user notifications
        const createdNotifications = await UserNotification.insertMany(userNotifications);

        // Send push notifications
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const userNotification = createdNotifications[i];

            try {
                // Send to all active FCM tokens for this user
                const activeTokens = user.fcmTokens.filter(token => token.isActive);
                
                if (activeTokens.length > 0) {
                    const pushResult = await this.sendPushNotification(
                        activeTokens,
                        adminNotification.title,
                        adminNotification.message,
                        adminNotification.type,
                        adminNotification.imageUrl,
                        adminNotification.deepLink
                    );

                    // Update push status
                    await userNotification.updatePushStatus('SENT', JSON.stringify(pushResult));
                    deliveredCount++;

                    ActivityLogger.logNotificationSystem('PUSH_SENT', 'Push notification sent successfully', 'INFO', {
                        userId: user._id,
                        notificationId: adminNotification._id,
                        tokenCount: activeTokens.length
                    });
                } else {
                    // No active tokens
                    await userNotification.updatePushStatus('FAILED', 'No active FCM tokens');
                    failedCount++;

                    ActivityLogger.logNotificationSystem('PUSH_FAILED', 'No active FCM tokens for user', 'WARNING', {
                        userId: user._id,
                        notificationId: adminNotification._id
                    });
                }
            } catch (error) {
                // Update push status to failed
                await userNotification.updatePushStatus('FAILED', error.message);
                failedCount++;

                ActivityLogger.logNotificationSystem('PUSH_FAILED', 'Push notification failed', 'ERROR', {
                    userId: user._id,
                    notificationId: adminNotification._id,
                    error: error.message
                });
            }
        }

        // Update admin notification with delivery statistics
        await adminNotification.updateDeliveryStats(deliveredCount, failedCount);

        return {
            totalUsers: users.length,
            deliveredCount,
            failedCount,
            status: adminNotification.status
        };
    }

    /**
     * Send push notification via FCM
     */
    async sendPushNotification(fcmTokens, title, message, type, imageUrl, deepLink) {
        // Mock FCM implementation - replace with actual FCM integration
        const fcmPayload = {
            notification: {
                title,
                body: message,
                image: imageUrl || null,
                sound: 'default'
            },
            data: {
                type,
                deepLink: deepLink || '',
                notificationId: Date.now().toString()
            },
            android: {
                priority: 'high',
                notification: {
                    priority: 'high',
                    sound: 'default',
                    channelId: type.toLowerCase()
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                        category: type.toLowerCase()
                    }
                }
            },
            tokens: fcmTokens.map(t => t.token)
        };

        // Simulate FCM API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 95% success rate
                if (Math.random() > 0.05) {
                    resolve({
                        success: true,
                        multicastId: `multicast_${Date.now()}`,
                        results: fcmTokens.map(token => ({
                            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            success: true,
                            token: token.token
                        })),
                        successCount: fcmTokens.length,
                        failureCount: 0
                    });
                } else {
                    reject(new Error('FCM service temporarily unavailable'));
                }
            }, 500); // 500ms delay to simulate network
        });
    }

    /**
     * Get admin notifications list
     */
    async getAdminNotifications(filters = {}) {
        try {
            const { page = 1, limit = 20, status, type } = filters;
            
            const query = {};
            
            if (status && status !== 'all') {
                query.status = status;
            }
            
            if (type && type !== 'all') {
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
        } catch (error) {
            ActivityLogger.logError('ADMIN_NOTIFICATIONS_LIST_ERROR', 'Error fetching admin notifications', error, { filters });
            throw error;
        }
    }

    /**
     * Get admin notification details
     */
    async getAdminNotificationDetails(notificationId) {
        try {
            const notification = await AdminNotification.findById(notificationId)
                .populate('sentBy', 'name email')
                .lean();

            if (!notification) {
                throw new Error('Notification not found');
            }

            // Get user notifications for this admin notification
            const userNotifications = await UserNotification.find({ notificationId })
                .populate('userId', 'name email')
                .sort({ deliveredAt: -1 })
                .limit(10)
                .lean();

            return {
                ...notification,
                recentUserNotifications: userNotifications
            };
        } catch (error) {
            ActivityLogger.logError('ADMIN_NOTIFICATION_DETAILS_ERROR', 'Error fetching notification details', error, { notificationId });
            throw error;
        }
    }

    /**
     * Delete admin notification
     */
    async deleteAdminNotification(notificationId, adminId) {
        try {
            const notification = await AdminNotification.findByIdAndDelete(notificationId);
            
            if (!notification) {
                throw new Error('Notification not found');
            }

            // Delete associated user notifications
            await UserNotification.deleteMany({ notificationId });

            // Log admin action
            ActivityLogger.logNotificationAdmin('GLOBAL_NOTIFICATION_DELETED', 'Admin deleted global notification', adminId, {
                notificationId,
                title: notification.title,
                type: notification.type
            });

            return notification;
        } catch (error) {
            ActivityLogger.logError('ADMIN_NOTIFICATION_DELETE_ERROR', 'Error deleting notification', error, { notificationId, adminId });
            throw error;
        }
    }

    /**
     * Get user notifications inbox
     */
    async getUserNotifications(userId, filters = {}) {
        try {
            const { page = 1, limit = 20, unreadOnly = false } = filters;
            
            const query = { userId };
            
            if (unreadOnly) {
                query.isRead = false;
            }

            const skip = (page - 1) * limit;

            const notifications = await UserNotification.find(query)
                .populate('notificationId', 'sentAt')
                .sort({ deliveredAt: -1 })
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
        } catch (error) {
            ActivityLogger.logError('USER_NOTIFICATIONS_INBOX_ERROR', 'Error fetching user notifications', error, { userId, filters });
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationAsRead(userId, notificationId) {
        try {
            const notification = await UserNotification.findOneAndUpdate(
                { userId, _id: notificationId },
                { isRead: true, readAt: new Date() },
                { new: true }
            );

            if (!notification) {
                throw new Error('Notification not found');
            }

            return notification;
        } catch (error) {
            ActivityLogger.logError('MARK_NOTIFICATION_READ_ERROR', 'Error marking notification as read', error, { userId, notificationId });
            throw error;
        }
    }

    /**
     * Get unread notifications count
     */
    async getUnreadNotificationsCount(userId) {
        try {
            const count = await UserNotification.countDocuments({
                userId,
                isRead: false
            });

            return { unreadCount: count };
        } catch (error) {
            ActivityLogger.logError('UNREAD_COUNT_ERROR', 'Error fetching unread count', error, { userId });
            throw error;
        }
    }

    /**
     * Add or update FCM token for user
     */
    async manageFcmToken(userId, tokenData) {
        try {
            const { token, deviceId, platform = 'android' } = tokenData;

            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Remove existing token for this device
            user.fcmTokens = user.fcmTokens.filter(
                t => t.deviceId !== deviceId || t.token !== token
            );

            // Add new token
            user.fcmTokens.push({
                token,
                deviceId,
                platform,
                isActive: true,
                lastUsedAt: new Date()
            });

            await user.save();

            return { success: true, message: 'FCM token updated successfully' };
        } catch (error) {
            ActivityLogger.logError('FCM_TOKEN_MANAGE_ERROR', 'Error managing FCM token', error, { userId, tokenData });
            throw error;
        }
    }

    /**
     * Remove FCM token for user
     */
    async removeFcmToken(userId, deviceId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.fcmTokens = user.fcmTokens.filter(t => t.deviceId !== deviceId);
            await user.save();

            return { success: true, message: 'FCM token removed successfully' };
        } catch (error) {
            ActivityLogger.logError('FCM_TOKEN_REMOVE_ERROR', 'Error removing FCM token', error, { userId, deviceId });
            throw error;
        }
    }
}

export default new GlobalNotificationService();
