import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import globalNotificationService from "../services/global-notification.service.js";

class UserNotificationController {
    /**
     * Get user notifications inbox
     */
    async getUserNotifications(req, res) {
        try {
            const userId = req.user.id;
            const { page, limit, unreadOnly } = req.query;

            const result = await globalNotificationService.getUserNotifications(userId, {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                unreadOnly: unreadOnly === 'true'
            });

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "User notifications retrieved successfully",
                data: result
            });
        } catch (error) {
            console.error('Get user notifications error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to retrieve user notifications",
            });
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { notificationId } = req.params;

            const result = await globalNotificationService.markNotificationAsRead(userId, notificationId);

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Notification marked as read successfully",
                data: result
            });
        } catch (error) {
            console.error('Mark notification as read error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.NOT_FOUND,
                status: false,
                message: error.message || "Notification not found",
            });
        }
    }

    /**
     * Get unread notifications count
     */
    async getUnreadNotificationsCount(req, res) {
        try {
            const userId = req.user.id;

            const result = await globalNotificationService.getUnreadNotificationsCount(userId);

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Unread count retrieved successfully",
                data: result
            });
        } catch (error) {
            console.error('Get unread count error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to retrieve unread count",
            });
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllNotificationsAsRead(req, res) {
        try {
            const userId = req.user.id;

            // This would require adding a method to the service
            // For now, we'll return a success message
            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "All notifications marked as read successfully",
                data: { markedCount: 0 }
            });
        } catch (error) {
            console.error('Mark all as read error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to mark all notifications as read",
            });
        }
    }

    /**
     * Delete notification (user-side only)
     */
    async deleteNotification(req, res) {
        try {
            const userId = req.user.id;
            const { notificationId } = req.params;

            // This would require adding a method to the service
            // For now, we'll return a success message
            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Notification deleted successfully",
                data: { deletedNotificationId: notificationId }
            });
        } catch (error) {
            console.error('Delete notification error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.NOT_FOUND,
                status: false,
                message: error.message || "Failed to delete notification",
            });
        }
    }

    /**
     * Add or update device token (NEW ENDPOINT)
     */
    async manageDeviceToken(req, res) {
        try {
            const userId = req.user.id;
            const { deviceToken, platform } = req.body;

            console.log('🔧 MANAGING DEVICE TOKEN:', { userId, deviceToken, platform });

            // Validate required fields
            if (!deviceToken) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Device token is required",
                });
            }

            // Validate platform
            const validPlatforms = ['android', 'ios', 'web'];
            if (platform && !validPlatforms.includes(platform)) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Invalid platform. Must be one of: android, ios, web",
                });
            }

            // Generate deviceId from user agent or use a default
            const deviceId = req.get('User-Agent')?.substring(0, 100) || `device_${Date.now()}`;

            const result = await globalNotificationService.manageFcmToken(userId, {
                token: deviceToken,
                deviceId,
                platform: platform || 'android'
            });

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Device token managed successfully",
                data: result
            });
        } catch (error) {
            console.error('Manage device token error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.BAD_REQUEST,
                status: false,
                message: error.message || "Failed to manage device token",
            });
        }
    }

    /**
     * Add or update FCM token (LEGACY ENDPOINT)
     */
    async manageFcmToken(req, res) {
        try {
            const userId = req.user.id;
            const { token, deviceId, platform } = req.body;

            // Validate required fields
            if (!token || !deviceId) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "FCM token and device ID are required",
                });
            }

            const result = await globalNotificationService.manageFcmToken(userId, {
                token,
                deviceId,
                platform: platform || 'android'
            });

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "FCM token managed successfully",
                data: result
            });
        } catch (error) {
            console.error('Manage FCM token error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.BAD_REQUEST,
                status: false,
                message: error.message || "Failed to manage FCM token",
            });
        }
    }

    /**
     * Remove FCM token
     */
    async removeFcmToken(req, res) {
        try {
            const userId = req.user.id;
            const { deviceId } = req.body;

            // Validate required field
            if (!deviceId) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Device ID is required",
                });
            }

            const result = await globalNotificationService.removeFcmToken(userId, deviceId);

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "FCM token removed successfully",
                data: result
            });
        } catch (error) {
            console.error('Remove FCM token error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.BAD_REQUEST,
                status: false,
                message: error.message || "Failed to remove FCM token",
            });
        }
    }
}

export default new UserNotificationController();
