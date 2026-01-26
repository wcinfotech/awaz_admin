import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import ActivityLogger from "../utils/activity-logger.js";

/**
 * Log app installation
 */
export const logAppInstall = async (req, res) => {
    try {
        const userId = req.user.id;
        const { device, os, appVersion, installSource } = req.body;

        // Log app installation
        ActivityLogger.logApp('APP_INSTALLED', 'User installed the application', userId, {
            device,
            os,
            appVersion,
            installSource,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        return apiResponse({
            res,
            statusCode: StatusCodes.OK,
            status: true,
            message: "App installation logged successfully",
        });
    } catch (error) {
        ActivityLogger.logError('APP_INSTALL_ERROR', 'Error logging app installation', error, {
            userId: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });
        return apiResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            status: false,
            message: "Failed to log app installation",
        });
    }
};

/**
 * Log app uninstallation
 */
export const logAppUninstall = async (req, res) => {
    try {
        const userId = req.user.id;
        const { device, os, appVersion, uninstallReason } = req.body;

        // Log app uninstallation
        ActivityLogger.logApp('APP_UNINSTALLED', 'User uninstalled the application', userId, {
            device,
            os,
            appVersion,
            uninstallReason,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        return apiResponse({
            res,
            statusCode: StatusCodes.OK,
            status: true,
            message: "App uninstallation logged successfully",
        });
    } catch (error) {
        ActivityLogger.logError('APP_UNINSTALL_ERROR', 'Error logging app uninstallation', error, {
            userId: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });
        return apiResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            status: false,
            message: "Failed to log app uninstallation",
        });
    }
};

/**
 * Log app opening (daily active user)
 */
export const logAppOpen = async (req, res) => {
    try {
        const userId = req.user.id;
        const { device, os, appVersion, sessionDuration } = req.body;

        // Log app opening
        ActivityLogger.logApp('APP_OPENED', 'User opened the application', userId, {
            device,
            os,
            appVersion,
            sessionDuration,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        return apiResponse({
            res,
            statusCode: StatusCodes.OK,
            status: true,
            message: "App opening logged successfully",
        });
    } catch (error) {
        ActivityLogger.logError('APP_OPEN_ERROR', 'Error logging app opening', error, {
            userId: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });
        return apiResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            status: false,
            message: "Failed to log app opening",
        });
    }
};

/**
 * Log app crash
 */
export const logAppCrash = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            crashType, 
            stackTrace, 
            device, 
            os, 
            appVersion, 
            appState, 
            timestamp 
        } = req.body;

        // Log app crash
        ActivityLogger.logAppCrash(`App crash: ${crashType}`, userId, {
            crashType,
            stack: stackTrace,
            device,
            os,
            appVersion,
            appState,
            crashTimestamp: timestamp,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        return apiResponse({
            res,
            statusCode: StatusCodes.OK,
            status: true,
            message: "App crash logged successfully",
        });
    } catch (error) {
        ActivityLogger.logError('APP_CRASH_ERROR', 'Error logging app crash', error, {
            userId: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });
        return apiResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            status: false,
            message: "Failed to log app crash",
        });
    }
};

/**
 * Log daily metrics (system/internal use)
 */
export const logDailyMetrics = async (req, res) => {
    try {
        const { 
            dailyActiveUsers, 
            newInstalls, 
            uninstalls, 
            crashes, 
            date 
        } = req.body;

        // Log daily active users
        ActivityLogger.logDailyMetrics('DAILY_ACTIVE_USERS', dailyActiveUsers, {
            date,
            source: 'system_job'
        });

        // Log daily new installs
        ActivityLogger.logDailyMetrics('DAILY_NEW_INSTALLS', newInstalls, {
            date,
            source: 'system_job'
        });

        // Log daily uninstalls
        ActivityLogger.logDailyMetrics('DAILY_UNINSTALLS', uninstalls, {
            date,
            source: 'system_job'
        });

        // Log daily crashes
        ActivityLogger.logDailyMetrics('DAILY_CRASHES', crashes, {
            date,
            source: 'system_job'
        });

        return apiResponse({
            res,
            statusCode: StatusCodes.OK,
            status: true,
            message: "Daily metrics logged successfully",
        });
    } catch (error) {
        ActivityLogger.logError('DAILY_METRICS_ERROR', 'Error logging daily metrics', error, {
            date: req.body?.date,
            source: 'system_job'
        });
        return apiResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            status: false,
            message: "Failed to log daily metrics",
        });
    }
};

// Remove the default export since we're using named exports
