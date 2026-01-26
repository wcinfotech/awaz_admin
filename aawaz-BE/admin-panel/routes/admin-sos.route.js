import { Router } from "express";
import { adminVerifyToken } from "../../middleware/verifyToken.js";
import adminSosController from "../controllers/admin-sos.controller.js";

const router = Router();

// Apply admin authentication middleware to all routes
router.use(adminVerifyToken);

/**
 * @route   GET /admin/v1/sos/list
 * @desc    Get list of SOS events with filters
 * @access  Admin
 */
router.get("/list", adminSosController.getSosList);

/**
 * @route   GET /admin/v1/sos/active
 * @desc    Get active SOS events (not resolved)
 * @access  Admin
 */
router.get("/active", adminSosController.getActiveSosEvents);

/**
 * @route   GET /admin/v1/sos/statistics
 * @desc    Get SOS statistics
 * @access  Admin
 */
router.get("/statistics", adminSosController.getSosStatistics);

/**
 * @route   GET /admin/v1/sos/export
 * @desc    Export SOS events to CSV
 * @access  Admin
 */
router.get("/export", adminSosController.exportSosEvents);

/**
 * @route   GET /admin/v1/sos/:sosId
 * @desc    Get SOS event details
 * @access  Admin
 */
router.get("/:sosId", adminSosController.getSosEventDetails);

/**
 * @route   PUT /admin/v1/sos/:sosId/resolve
 * @desc    Mark SOS as resolved
 * @access  Admin
 */
router.put("/:sosId/resolve", adminSosController.resolveSos);

export default router;
