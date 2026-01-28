import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../../helper/apiResponse.js";
import globalNotificationService from "../../services/global-notification.service.js";

class AdminNotificationController {
    /**
     * Send global notification - STRICT VALIDATION
     */
    async sendGlobalNotification(req, res) {
        try {
            console.log('🎯 CONTROLLER: Starting sendGlobalNotification');
            
            const adminId = req.admin.id;
            const { title, message, type, imageUrl, deepLink } = req.body;

            console.log('📝 CONTROLLER: Received data:', { title, message, type, imageUrl, deepLink });

            // ✅ STEP 1 – VALIDATE INPUT (MANDATORY)
            if (!title || !message || !type) {
                console.log('❌ CONTROLLER: Validation failed - missing required fields');
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
                console.log('❌ CONTROLLER: Validation failed - invalid type:', type);
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Invalid notification type. Must be one of: INFO, ALERT, WARNING, PROMOTION",
                });
            }

            // Validate title length
            if (title.length > 100) {
                console.log('❌ CONTROLLER: Validation failed - title too long');
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Title must be 100 characters or less",
                });
            }

            // Validate message length
            if (message.length > 500) {
                console.log('❌ CONTROLLER: Validation failed - message too long');
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Message must be 500 characters or less",
                });
            }

            console.log('✅ CONTROLLER: Validation passed');

            // Call service with strict pipeline
            const result = await globalNotificationService.sendGlobalNotification({
                title,
                message,
                type,
                imageUrl: imageUrl || null,
                deepLink: deepLink || null
            }, adminId);

            console.log('✅ CONTROLLER: Service completed successfully');

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Global notification sent successfully",
                data: {
                    notificationId: result._id,
                    title: result.title,
                    message: result.message,
                    type: result.type,
                    status: result.status,
                    totalUsers: result.totalUsers,
                    sentAt: result.sentAt
                }
            });

        } catch (error) {
            console.log('❌ CONTROLLER: Error occurred:', error.message);
            
            // NEVER return success on error
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: "Failed to send global notification",
                error: error.message
            });
        }
    }

    /**
     * Get list of admin notifications
     */
    async getAdminNotifications(req, res) {
        try {
            const { page = 1, limit = 10, status = 'all', type = 'all' } = req.query;

            const result = await globalNotificationService.getAdminNotifications({
                page: parseInt(page),
                limit: parseInt(limit),
                status,
                type
            });

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Notifications retrieved successfully",
                data: result
            });

        } catch (error) {
            console.log('❌ CONTROLLER: Get notifications error:', error.message);
            
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: "Failed to retrieve notifications",
                error: error.message
            });
        }
    }

    /**
     * Get notification statistics
     */
    async getNotificationStatistics(req, res) {
        try {
            const stats = await globalNotificationService.getNotificationStatistics();

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Statistics retrieved successfully",
                data: stats
            });

        } catch (error) {
            console.log('❌ CONTROLLER: Get statistics error:', error.message);
            
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: "Failed to retrieve statistics",
                error: error.message
            });
        }
    }

    /**
     * Get admin notification details
     */
    async getAdminNotificationDetails(req, res) {
        try {
            const { notificationId } = req.params;

            if (!notificationId) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Notification ID is required",
                });
            }

            const notification = await globalNotificationService.getAdminNotificationDetails(notificationId);

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Notification details retrieved successfully",
                data: notification
            });

        } catch (error) {
            console.log('❌ CONTROLLER: Get notification details error:', error.message);
            
            if (error.message === 'Notification not found') {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.NOT_FOUND,
                    status: false,
                    message: "Notification not found",
                });
            }

            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: "Failed to retrieve notification details",
                error: error.message
            });
        }
    }

    /**
     * Resend failed notification
     */
    async resendFailedNotification(req, res) {
        try {
            const { notificationId } = req.params;

            if (!notificationId) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Notification ID is required",
                });
            }

            // For now, return not implemented
            return apiResponse({
                res,
                statusCode: StatusCodes.NOT_IMPLEMENTED,
                status: false,
                message: "Resend functionality not yet implemented",
            });

        } catch (error) {
            console.log('❌ CONTROLLER: Resend notification error:', error.message);
            
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: "Failed to resend notification",
                error: error.message
            });
        }
    }

    /**
     * Delete admin notification
     */
    async deleteAdminNotification(req, res) {
        try {
            const { notificationId } = req.params;
            const adminId = req.admin.id;

            if (!notificationId) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Notification ID is required",
                });
            }

            const notification = await globalNotificationService.deleteAdminNotification(notificationId, adminId);

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Notification deleted successfully",
                data: {
                    notificationId: notification._id,
                    title: notification.title
                }
            });

        } catch (error) {
            console.log('❌ CONTROLLER: Delete notification error:', error.message);
            
            if (error.message === 'Notification not found') {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.NOT_FOUND,
                    status: false,
                    message: "Notification not found",
                });
            }

            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: "Failed to delete notification",
                error: error.message
            });
        }
    }
}

export default new AdminNotificationController();
