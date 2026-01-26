import ActivityLog from "../admin-panel/models/activity-log.model.js";

/**
 * Central Activity Logger Utility
 * 
 * This utility provides a unified way to log all system activities.
 * It follows fire-and-forget pattern to ensure logging never blocks main flow.
 */
class ActivityLogger {
    /**
     * Log an activity
     * @param {Object} logData - Log data
     * @param {string} logData.level - Log level: INFO, SUCCESS, WARNING, ERROR
     * @param {string} logData.type - Log type: USER, APP, POST, COMMENT, NOTIFICATION, SYSTEM, ADMIN, REPORT
     * @param {string} logData.action - Action identifier (e.g., USER_BLOCKED, POST_APPROVED, APP_CRASHED)
     * @param {string} logData.message - Human readable message
     * @param {string} [logData.userId] - Affected user ID
     * @param {string} [logData.adminId] - Admin who performed action
     * @param {string} [logData.entityId] - Related entity ID (post, comment, report, etc.)
     * @param {Object} [logData.metadata] - Additional details
     * @param {string} [logData.ipAddress] - Client IP address
     * @param {string} [logData.userAgent] - Client user agent
     */
    static async log(logData) {
        try {
            // Validate required fields
            if (!logData.level || !logData.type || !logData.action || !logData.message) {
                console.error('ActivityLogger: Missing required fields', logData);
                return;
            }

            // Create log document
            const logEntry = new ActivityLog({
                level: logData.level.toUpperCase(),
                type: logData.type.toUpperCase(),
                action: logData.action,
                message: logData.message,
                userId: logData.userId || null,
                adminId: logData.adminId || null,
                entityId: logData.entityId || null,
                metadata: logData.metadata || {},
                ipAddress: logData.ipAddress || null,
                userAgent: logData.userAgent || null
            });

            // Fire-and-forget: Save asynchronously without waiting
            logEntry.save().catch(err => {
                // Silently ignore logging errors to prevent breaking main flow
                console.error('ActivityLogger: Failed to save log entry', err);
            });

        } catch (error) {
            // Silently ignore any errors to ensure logging never breaks main flow
            console.error('ActivityLogger: Unexpected error', error);
        }
    }

    // Convenience methods for common log types
    
    /**
     * Log user-related activity
     */
    static logUser(action, message, userId, metadata = {}) {
        this.log({
            level: 'INFO',
            type: 'USER',
            action,
            message,
            userId,
            metadata
        });
    }

    /**
     * Log admin-related activity
     */
    static logAdmin(action, message, adminId, userId = null, metadata = {}) {
        this.log({
            level: 'INFO',
            type: 'ADMIN',
            action,
            message,
            adminId,
            userId,
            metadata
        });
    }

    /**
     * Log post-related activity
     */
    static logPost(action, message, userId, postId = null, metadata = {}) {
        this.log({
            level: 'INFO',
            type: 'POST',
            action,
            message,
            userId,
            entityId: postId,
            metadata
        });
    }

    /**
     * Log comment-related activity
     */
    static logComment(action, message, userId, commentId = null, metadata = {}) {
        this.log({
            level: 'INFO',
            type: 'COMMENT',
            action,
            message,
            userId,
            entityId: commentId,
            metadata
        });
    }

    /**
     * Log report-related activity
     */
    static logReport(action, message, userId = null, reportId = null, metadata = {}) {
        this.log({
            level: 'INFO',
            type: 'REPORT',
            action,
            message,
            userId,
            entityId: reportId,
            metadata
        });
    }

    /**
     * Log app lifecycle activity
     */
    static logApp(action, message, userId = null, metadata = {}) {
        this.log({
            level: 'INFO',
            type: 'APP',
            action,
            message,
            userId,
            metadata
        });
    }

    /**
     * Log app crash (error level by default)
     */
    static logAppCrash(message, userId = null, crashData = {}) {
        this.log({
            level: 'ERROR',
            type: 'APP',
            action: 'APP_CRASHED',
            message,
            userId,
            metadata: {
                crashStack: crashData.stack,
                device: crashData.device,
                os: crashData.os,
                appVersion: crashData.appVersion,
                ...crashData
            }
        });
    }

    /**
     * Log daily metrics (system level)
     */
    static logDailyMetrics(action, count, metadata = {}) {
        this.log({
            level: 'INFO',
            type: 'SYSTEM',
            action,
            message: `${action.replace(/_/g, ' ').toLowerCase()}: ${count}`,
            metadata: {
                count,
                ...metadata
            }
        });
    }

    /**
     * Log notification activity
     */
    static logNotification(action, message, userId = null, metadata = {}) {
        this.log({
            level: 'INFO',
            type: 'NOTIFICATION',
            action,
            message,
            userId,
            metadata
        });
    }

    /**
     * Log system activity
     */
    static logSystem(action, message, level = 'INFO', metadata = {}) {
        this.log({
            level,
            type: 'SYSTEM',
            action,
            message,
            metadata
        });
    }

    /**
     * Log SOS-related user activity
     */
    static logSosUser(action, message, userId, metadata = {}) {
        this.log({
            level: 'INFO',
            type: 'USER',
            action,
            message,
            userId,
            metadata
        });
    }

    /**
     * Log SOS-related system activity
     */
    static logSosSystem(action, message, level = 'INFO', metadata = {}) {
        this.log({
            level,
            type: 'SYSTEM',
            action,
            message,
            metadata
        });
    }

    /**
     * Log SOS-related admin activity
     */
    static logSosAdmin(action, message, adminId, metadata = {}) {
        this.log({
            level: 'INFO',
            type: 'sos',
            action,
            message,
            adminId,
            metadata
        });
    }

    /**
     * Log notification-related admin activity
     */
    static logNotificationAdmin(action, message, adminId, metadata = {}) {
        this.log({
            level: 'INFO',
            type: 'notification',
            action,
            message,
            adminId,
            metadata
        });
    }

    /**
     * Log notification-related system activity
     */
    static logNotificationSystem(action, message, level = 'INFO', metadata = {}) {
        this.log({
            level,
            type: 'notification',
            action,
            message,
            metadata
        });
    }

    /**
     * Log error
     */
    static logError(action, message, error = null, metadata = {}) {
        this.log({
            level: 'ERROR',
            type: 'SYSTEM',
            action,
            message,
            metadata: {
                ...metadata,
                error: error ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                } : null
            }
        });
    }

    /**
     * Log success
     */
    static logSuccess(action, message, metadata = {}) {
        this.log({
            level: 'SUCCESS',
            type: 'SYSTEM',
            action,
            message,
            metadata
        });
    }

    /**
     * Log warning
     */
    static logWarning(action, message, metadata = {}) {
        this.log({
            level: 'WARNING',
            type: 'SYSTEM',
            action,
            message,
            metadata
        });
    }
}

export default ActivityLogger;
