import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../../helper/apiResponse.js";
import globalNotificationService from "../../services/global-notification.service.js";

class AdminNotificationController {
    /**
     * Send global notification to all users
     */
    async sendGlobalNotification(req, res) {
        try {
            const adminId = req.admin.id;
            const { title, message, type, imageUrl, deepLink } = req.body;

            // Validate required fields
            if (!title || !message || !type) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Title, message, and type are required",
                });
            }

            // Validate notification type
            const validTypes = ['INFO', 'ALERT', 'WARNING', 'PROMOTION'];
            if (!validTypes.includes(type)) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Invalid notification type. Must be one of: INFO, ALERT, WARNING, PROMOTION",
                });
            }

            const result = await globalNotificationService.sendGlobalNotification({
                title,
                message,
                type,
                imageUrl: imageUrl || null,
                deepLink: deepLink || null
            }, adminId);

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Global notification sent successfully",
                data: {
                    notificationId: result._id,
                    title: result.title,
                    type: result.type,
                    totalUsers: result.totalUsers,
                    status: result.status,
                    sentAt: result.sentAt
                }
            });
        } catch (error) {
            console.error('Send global notification error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.BAD_REQUEST,
                status: false,
                message: error.message || "Failed to send global notification",
            });
        }
    }

    /**
     * Get admin notifications list
     */
    async getAdminNotifications(req, res) {
        try {
            const { page, limit, status, type } = req.query;

            const result = await globalNotificationService.getAdminNotifications({
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                status: status || 'all',
                type: type || 'all'
            });

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Admin notifications retrieved successfully",
                data: result
            });
        } catch (error) {
            console.error('Get admin notifications error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to retrieve admin notifications",
            });
        }
    }

    /**
     * Get admin notification details
     */
    async getAdminNotificationDetails(req, res) {
        try {
            const { notificationId } = req.params;

            const result = await globalNotificationService.getAdminNotificationDetails(notificationId);

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Notification details retrieved successfully",
                data: result
            });
        } catch (error) {
            console.error('Get notification details error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.NOT_FOUND,
                status: false,
                message: error.message || "Notification not found",
            });
        }
    }

    /**
     * Delete admin notification
     */
    async deleteAdminNotification(req, res) {
        try {
            const adminId = req.admin.id;
            const { notificationId } = req.params;

            const result = await globalNotificationService.deleteAdminNotification(notificationId, adminId);

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Notification deleted successfully",
                data: result
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
     * Get notification statistics
     */
    async getNotificationStatistics(req, res) {
        try {
            const { period = '30d' } = req.query;
            
            // Calculate date range based on period
            const now = new Date();
            let startDate = new Date();
            
            switch (period) {
                case '24h':
                    startDate.setHours(now.getHours() - 24);
                    break;
                case '7d':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(now.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(now.getDate() - 90);
                    break;
                default:
                    startDate.setDate(now.getDate() - 30);
            }

            const result = await globalNotificationService.getAdminNotifications({
                limit: 1000 // Get all notifications in the period
            });

            const notifications = result.notifications;
            
            const statistics = {
                total: notifications.length,
                typeBreakdown: {
                    info: notifications.filter(n => n.type === 'INFO').length,
                    alert: notifications.filter(n => n.type === 'ALERT').length,
                    warning: notifications.filter(n => n.type === 'WARNING').length,
                    promotion: notifications.filter(n => n.type === 'PROMOTION').length
                },
                statusBreakdown: {
                    sent: notifications.filter(n => n.status === 'SENT').length,
                    partialFailed: notifications.filter(n => n.status === 'PARTIAL_FAILED').length,
                    failed: notifications.filter(n => n.status === 'FAILED').length
                },
                deliveryStats: {
                    totalUsers: notifications.reduce((sum, n) => sum + n.totalUsers, 0),
                    deliveredUsers: notifications.reduce((sum, n) => sum + n.deliveredUsers, 0),
                    failedUsers: notifications.reduce((sum, n) => sum + n.failedUsers, 0),
                    averageDeliveryRate: notifications.length > 0 
                        ? (notifications.reduce((sum, n) => sum + (n.totalUsers > 0 ? (n.deliveredUsers / n.totalUsers) * 100 : 0), 0) / notifications.length).toFixed(2)
                        : 0
                },
                recentNotifications: notifications.slice(0, 5)
            };

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Notification statistics retrieved successfully",
                data: statistics
            });
        } catch (error) {
            console.error('Get notification statistics error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to retrieve notification statistics",
            });
        }
    }

    /**
     * Resend failed notification
     */
    async resendFailedNotification(req, res) {
        try {
            const adminId = req.admin.id;
            const { notificationId } = req.params;

            // Get the original notification
            const notification = await globalNotificationService.getAdminNotificationDetails(notificationId);
            
            if (!notification) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.NOT_FOUND,
                    status: false,
                    message: "Notification not found",
                });
            }

            // Create new notification with same content
            const result = await globalNotificationService.sendGlobalNotification({
                title: notification.title,
                message: notification.message,
                type: notification.type,
                imageUrl: notification.imageUrl,
                deepLink: notification.deepLink
            }, adminId);

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Notification resent successfully",
                data: {
                    originalNotificationId: notificationId,
                    newNotificationId: result._id,
                    title: result.title,
                    totalUsers: result.totalUsers,
                    status: result.status
                }
            });
        } catch (error) {
            console.error('Resend notification error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.BAD_REQUEST,
                status: false,
                message: error.message || "Failed to resend notification",
            });
        }
    }
}

export default new AdminNotificationController();
