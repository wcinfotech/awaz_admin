import { Router } from "express";
import { adminVerifyToken } from "../../middleware/verifyToken.js";
import adminNotificationController from "../controllers/admin-global-notification.controller.js";

const router = Router();

// Apply admin authentication middleware to all routes
router.use(adminVerifyToken);

/**
 * @route   POST /admin/v1/notification/global
 * @desc    Send global notification to all users
 * @access  Admin
 */
router.post("/global", adminNotificationController.sendGlobalNotification);

/**
 * @route   POST /admin/v1/notification/send-global
 * @desc    Send global notification to all users (legacy)
 * @access  Admin
 */
router.post("/send-global", adminNotificationController.sendGlobalNotification);

/**
 * @route   GET /admin/v1/notification/list
 * @desc    Get list of admin notifications
 * @access  Admin
 */
router.get("/list", adminNotificationController.getAdminNotifications);

/**
 * @route   GET /admin/v1/notification/statistics
 * @desc    Get notification statistics
 * @access  Admin
 */
router.get("/statistics", adminNotificationController.getNotificationStatistics);

/**
 * @route   GET /admin/v1/notification/:notificationId
 * @desc    Get admin notification details
 * @access  Admin
 */
router.get("/:notificationId", adminNotificationController.getAdminNotificationDetails);

/**
 * @route   PUT /admin/v1/notification/:notificationId/resend
 * @desc    Resend failed notification
 * @access  Admin
 */
router.put("/:notificationId/resend", adminNotificationController.resendFailedNotification);

/**
 * @route   DELETE /admin/v1/notification/:notificationId
 * @desc    Delete admin notification
 * @access  Admin
 */
router.delete("/:notificationId", adminNotificationController.deleteAdminNotification);

export default router;
