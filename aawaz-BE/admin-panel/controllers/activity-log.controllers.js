import ActivityLog from "../models/activity-log.model.js";
import { Parser } from 'json2csv';

/**
 * Get activity logs with filtering and pagination
 */
const getActivityLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            level,
            type,
            search,
            fromDate,
            toDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        // Filter by log level
        if (level) {
            query.level = level.toUpperCase();
        }

        // Filter by log type
        if (type) {
            query.type = type.toUpperCase();
        }

        // Date range filter
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) {
                query.createdAt.$gte = new Date(fromDate);
            }
            if (toDate) {
                query.createdAt.$lte = new Date(toDate);
            }
        }

        // Search filter (text search)
        if (search) {
            query.$text = { $search: search };
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const [logs, total] = await Promise.all([
            ActivityLog.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name username email')
                .populate('adminId', 'name email')
                .lean()
                .catch(err => {
                    // If populate fails due to missing models, fetch without populate
                    console.warn('Population failed, fetching without populate:', err.message);
                    return ActivityLog.find(query)
                        .sort(sortOptions)
                        .skip(skip)
                        .limit(parseInt(limit))
                        .lean();
                }),
            ActivityLog.countDocuments(query)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(total / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        // Transform logs to match frontend interface
        const transformedLogs = logs.map(log => ({
            _id: log._id,
            level: log.level.toLowerCase(),
            type: log.type.toLowerCase(),
            action: log.action,
            message: log.message,
            userId: (typeof log.userId === 'object' && log.userId) ? log.userId._id : log.userId,
            adminId: (typeof log.adminId === 'object' && log.adminId) ? log.adminId._id : log.adminId,
            entityId: log.entityId,
            metadata: log.metadata || {},
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
            // Add populated user/admin info for display (if available)
            user: (typeof log.userId === 'object' && log.userId) ? log.userId : null,
            admin: (typeof log.adminId === 'object' && log.adminId) ? log.adminId : null
        }));

        res.status(200).json({
            success: true,
            data: {
                logs: transformedLogs,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage,
                    hasPrevPage
                }
            }
        });

    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity logs',
            error: error.message
        });
    }
};

/**
 * Get logs summary for dashboard cards
 */
const getLogsSummary = async (req, res) => {
    try {
        const summary = await ActivityLog.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    info: {
                        $sum: {
                            $cond: [{ $eq: ['$level', 'INFO'] }, 1, 0]
                        }
                    },
                    success: {
                        $sum: {
                            $cond: [{ $eq: ['$level', 'SUCCESS'] }, 1, 0]
                        }
                    },
                    warning: {
                        $sum: {
                            $cond: [{ $eq: ['$level', 'WARNING'] }, 1, 0]
                        }
                    },
                    error: {
                        $sum: {
                            $cond: [{ $eq: ['$level', 'ERROR'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const result = summary[0] || {
            total: 0,
            info: 0,
            success: 0,
            warning: 0,
            error: 0
        };

        // Format response to match frontend expectations
        res.status(200).json({
            success: true,
            data: {
                totalLogs: result.total,
                levelStats: {
                    info: result.info,
                    success: result.success,
                    warning: result.warning,
                    error: result.error
                }
            }
        });

    } catch (error) {
        console.error('Error fetching logs summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch logs summary',
            error: error.message
        });
    }
};

/**
 * Export logs in CSV or JSON format
 */
const exportLogs = async (req, res) => {
    try {
        const {
            format = 'csv',
            level,
            type,
            search,
            fromDate,
            toDate
        } = req.query;

        // Build same query as getActivityLogs
        const query = {};

        if (level) {
            query.level = level.toUpperCase();
        }

        if (type) {
            query.type = type.toUpperCase();
        }

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) {
                query.createdAt.$gte = new Date(fromDate);
            }
            if (toDate) {
                query.createdAt.$lte = new Date(toDate);
            }
        }

        if (search) {
            query.$text = { $search: search };
        }

        // Fetch all matching logs (no pagination for export)
        const logs = await ActivityLog.find(query)
            .populate('userId', 'name username email')
            .populate('adminId', 'name email')
            .sort({ createdAt: -1 })
            .lean()
            .catch(err => {
                // If populate fails due to missing models, fetch without populate
                console.warn('Export population failed, fetching without populate:', err.message);
                return ActivityLog.find(query)
                    .sort({ createdAt: -1 })
                    .lean();
            });

        // Transform logs for export
        const exportData = logs.map(log => ({
            'Date': log.createdAt,
            'Level': log.level,
            'Type': log.type,
            'Action': log.action,
            'Message': log.message,
            'User': typeof log.userId === 'object' && log.userId ? 
                `${log.userId.name || ''} (${log.userId.username || log.userId.email || ''})` : 
                'N/A',
            'Admin': typeof log.adminId === 'object' && log.adminId ? 
                `${log.adminId.name} (${log.adminId.email})` : 
                'N/A',
            'IP Address': log.ipAddress || 'N/A',
            'User Agent': log.userAgent || 'N/A',
            'Metadata': JSON.stringify(log.metadata || {})
        }));

        if (format === 'json') {
            // Export as JSON
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.json"`);
            res.status(200).json({
                success: true,
                data: exportData,
                exportedAt: new Date(),
                totalRecords: exportData.length
            });
        } else {
            // Export as CSV
            const fields = [
                'Date', 'Level', 'Type', 'Action', 'Message', 
                'User', 'Admin', 'IP Address', 'User Agent', 'Metadata'
            ];
            
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(exportData);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`);
            res.status(200).send(csv);
        }

    } catch (error) {
        console.error('Error exporting logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export logs',
            error: error.message
        });
    }
};

/**
 * Get log types and levels for filters
 */
const getLogFilters = async (req, res) => {
    try {
        const [levels, types, actions] = await Promise.all([
            ActivityLog.distinct('level'),
            ActivityLog.distinct('type'),
            ActivityLog.distinct('action')
        ]);

        res.status(200).json({
            success: true,
            data: {
                levels: levels.sort(),
                types: types.sort(),
                actions: actions.sort()
            }
        });

    } catch (error) {
        console.error('Error fetching log filters:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch log filters',
            error: error.message
        });
    }
};

/**
 * Delete old logs (cleanup utility)
 */
const cleanupOldLogs = async (req, res) => {
    try {
        const { days = 90 } = req.query;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        const result = await ActivityLog.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} logs older than ${days} days`,
            deletedCount: result.deletedCount,
            cutoffDate
        });

    } catch (error) {
        console.error('Error cleaning up old logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup old logs',
            error: error.message
        });
    }
};

export {
    getActivityLogs,
    getLogsSummary,
    exportLogs,
    getLogFilters,
    cleanupOldLogs
};
