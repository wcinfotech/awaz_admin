import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { adminVerifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";
import enums from "../config/enum.js";
import deviceTokenController from "../controllers/deviceToken.controller.js";

const router = Router();

/**
 * @route   POST /api/v1/user/device-token
 * @desc    Register or update device token
 * @access  Private
 */
router.post("/device-token", verifyToken, deviceTokenController.registerDeviceToken);

/**
 * @route   DELETE /api/v1/user/device-token
 * @desc    Deactivate device token
 * @access  Private
 */
router.delete("/device-token", verifyToken, deviceTokenController.deactivateDeviceToken);

/**
 * @route   GET /api/v1/admin/device-tokens
 * @desc    Get all active device tokens
 * @access  Admin
 */
router.get("/device-tokens", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), deviceTokenController.getActiveDeviceTokens);

/**
 * @route   GET /api/v1/admin/device-tokens/statistics
 * @desc    Get device tokens statistics
 * @access  Admin
 */
router.get("/device-tokens/statistics", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), deviceTokenController.getDeviceTokenStatistics);

export default router;
