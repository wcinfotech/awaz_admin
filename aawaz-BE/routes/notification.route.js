import express from "express";
import notificationController from "../controllers/notification.controllers.js";
import { verifyToken } from "../middleware/verifyToken.js";

const route = express.Router();

route.get(
  "/get-user-notifications",
  verifyToken,
  notificationController.getUserNotifications
);

export default route;
