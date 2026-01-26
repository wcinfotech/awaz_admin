const express = require('express');
const router = express.Router();
const {
    getActivityLogs,
    getLogsSummary,
    exportLogs,
    getLogFilters,
    cleanupOldLogs
} = require('../controllers/activity-log.controllers');
const { authenticateAdmin } = require('../middlewares/admin-auth.middleware');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /admin/v1/logs
 * Get activity logs with filtering, search, and pagination
 * Query params: page, limit, level, type, search, fromDate, toDate, sortBy, sortOrder
 */
router.get('/', getActivityLogs);

/**
 * GET /admin/v1/logs/summary
 * Get logs summary for dashboard cards
 * Returns: total, info, success, warning, error counts
 */
router.get('/summary', getLogsSummary);

/**
 * GET /admin/v1/logs/export
 * Export logs in CSV or JSON format
 * Query params: format (csv|json), level, type, search, fromDate, toDate
 */
router.get('/export', exportLogs);

/**
 * GET /admin/v1/logs/filters
 * Get available log levels, types, and actions for filter dropdowns
 */
router.get('/filters', getLogFilters);

/**
 * DELETE /admin/v1/logs/cleanup
 * Delete old logs (cleanup utility)
 * Query params: days (default: 90)
 */
router.delete('/cleanup', cleanupOldLogs);

module.exports = router;
