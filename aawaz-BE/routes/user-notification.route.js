import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import userNotificationController from "../controllers/user-notification.controller.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

/**
 * @route   POST /api/v1/user/device-token
 * @desc    Add or update device token
 * @access  Private
 */
router.post("/device-token", userNotificationController.manageDeviceToken);

/**
 * @route   POST /api/v1/user/fcm-token
 * @desc    Add or update FCM token (legacy)
 * @access  Private
 */
router.post("/fcm-token", userNotificationController.manageFcmToken);

/**
 * @route   GET /api/v1/user/notifications
 * @desc    Get user notifications inbox
 * @access  Private
 */
router.get("/notifications", userNotificationController.getUserNotifications);

/**
 * @route   GET /api/v1/user/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get("/notifications/unread-count", userNotificationController.getUnreadNotificationsCount);

/**
 * @route   PUT /api/v1/user/notification/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put("/notification/:notificationId/read", userNotificationController.markNotificationAsRead);

/**
 * @route   PUT /api/v1/user/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put("/notifications/mark-all-read", userNotificationController.markAllNotificationsAsRead);

/**
 * @route   DELETE /api/v1/user/notification/:notificationId
 * @desc    Delete notification (user-side)
 * @access  Private
 */
router.delete("/notification/:notificationId", userNotificationController.deleteNotification);

/**
 * @route   DELETE /api/v1/user/fcm-token
 * @desc    Remove FCM token
 * @access  Private
 */
router.delete("/fcm-token", userNotificationController.removeFcmToken);

export default router;
