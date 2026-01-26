import { Router } from "express";
import { adminVerifyToken } from "../../middleware/verifyToken.js";
import { verifyRole } from "../../middleware/verifyRole.js";
import {
    getActivityLogs,
    getLogsSummary,
    exportLogs,
    getLogFilters,
    cleanupOldLogs
} from "../controllers/activity-log.controllers.js";

const router = Router();

// Apply admin authentication and role verification to all routes
router.use(adminVerifyToken);
router.use(verifyRole(["admin", "owner"]));

/**
 * GET /admin/v1/activity-log/list
 * Get activity logs with filtering, search, and pagination
 * Query params: page, limit, level, type, search, fromDate, toDate, sortBy, sortOrder
 */
router.get("/list", getActivityLogs);

/**
 * GET /admin/v1/activity-log/stats
 * Get logs summary for dashboard cards (alias for summary)
 * Returns: total, info, success, warning, error counts
 */
router.get("/stats", getLogsSummary);

/**
 * GET /admin/v1/activity-log/summary
 * Get logs summary for dashboard cards
 * Returns: total, info, success, warning, error counts
 */
router.get("/summary", getLogsSummary);

/**
 * GET /admin/v1/activity-log/export
 * Export logs in CSV or JSON format
 * Query params: format (csv|json), level, type, search, fromDate, toDate
 */
router.get("/export", exportLogs);

/**
 * GET /admin/v1/activity-log/filters
 * Get available log levels, types, and actions for filter dropdowns
 */
router.get("/filters", getLogFilters);

/**
 * DELETE /admin/v1/activity-log/clear
 * Delete old logs (cleanup utility) - OWNER ONLY
 * Query params: days (default: 90)
 */
router.delete("/clear", verifyRole(["owner"]), cleanupOldLogs);

export default router;
