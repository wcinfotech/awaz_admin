import express from "express";
import notificationController from "../controllers/admin-notification.controller.js";
import globalNotificationController from "../controllers/admin-global-notification.controller.js";
import { adminVerifyToken } from "../../middleware/verifyToken.js";

const route = express.Router();

// Apply admin authentication middleware to all routes
route.use(adminVerifyToken);

// Existing geo-notification endpoint
route.post(
  "/send-event-geo-notification",
  notificationController.handleEventGeoNotification
);

// Global notification endpoints
route.post("/send-global", globalNotificationController.sendGlobalNotification);
route.get("/list", globalNotificationController.getAdminNotifications);
route.get("/statistics", globalNotificationController.getNotificationStatistics);
route.get("/:notificationId", globalNotificationController.getAdminNotificationDetails);
route.put("/:notificationId/resend", globalNotificationController.resendFailedNotification);
route.delete("/:notificationId", globalNotificationController.deleteAdminNotification);

export default route;
