import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../../helper/apiResponse.js";
import AdminActivityLog from "../models/admin-activity-log.model.js";

// Get activity logs with pagination and filters
const getActivityLogs = async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const {
      page = 1,
      limit = 50,
      level,
      type,
      action,
      search,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    // Filter by level
    if (level && level !== "all") {
      query.level = level;
    }

    // Filter by type
    if (type && type !== "all") {
      query.type = type;
    }

    // Filter by action
    if (action) {
      query.action = action;
    }

    // Search in details
    if (search) {
      query.details = { $regex: search, $options: "i" };
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, totalCount] = await Promise.all([
      AdminActivityLog.find(query)
        .populate("adminId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AdminActivityLog.countDocuments(query),
    ]);

    // Format logs for frontend
    const formattedLogs = logs.map((log) => ({
      id: log._id,
      timestamp: log.createdAt,
      level: log.level,
      type: log.type,
      action: log.action,
      user: log.adminId?.email || "system",
      userName: log.adminId?.name || "System",
      details: log.details,
      ip: log.ipAddress || "N/A",
      metadata: log.metadata,
    }));

    return apiResponse({
      res,
      status: true,
      message: "Activity logs fetched successfully.",
      statusCode: StatusCodes.OK,
      data: {
        logs: formattedLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch activity logs.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// Create a new activity log entry
const createActivityLog = async (req, res) => {
  try {
    const { action, level, type, details, metadata } = req.body;
    const adminId = req.user.id;
    const ipAddress = req.ip || req.connection?.remoteAddress || "";

    const newLog = new AdminActivityLog({
      adminId,
      action,
      level: level || "info",
      type: type || "system",
      details: details || "",
      metadata: metadata || {},
      ipAddress,
    });

    await newLog.save();

    return apiResponse({
      res,
      status: true,
      message: "Activity log created successfully.",
      statusCode: StatusCodes.CREATED,
      data: newLog,
    });
  } catch (error) {
    console.error("Error creating activity log:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to create activity log.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// Helper function to log activities (for use in other controllers)
const logActivity = async ({
  adminId,
  action,
  level = "info",
  type = "system",
  details = "",
  metadata = {},
  ipAddress = "",
}) => {
  try {
    const newLog = new AdminActivityLog({
      adminId,
      action,
      level,
      type,
      details,
      metadata,
      ipAddress,
    });
    await newLog.save();
    return newLog;
  } catch (error) {
    console.error("Error logging activity:", error);
    return null;
  }
};

// Get activity log statistics
const getActivityStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalLogs,
      todayLogs,
      errorLogs,
      warningLogs,
      levelStats,
      typeStats,
    ] = await Promise.all([
      AdminActivityLog.countDocuments(),
      AdminActivityLog.countDocuments({ createdAt: { $gte: today } }),
      AdminActivityLog.countDocuments({ level: "error" }),
      AdminActivityLog.countDocuments({ level: "warning" }),
      AdminActivityLog.aggregate([
        { $group: { _id: "$level", count: { $sum: 1 } } },
      ]),
      AdminActivityLog.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    return apiResponse({
      res,
      status: true,
      message: "Activity stats fetched successfully.",
      statusCode: StatusCodes.OK,
      data: {
        totalLogs,
        todayLogs,
        errorLogs,
        warningLogs,
        levelStats: levelStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        typeStats: typeStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch activity stats.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// Clear old logs (admin only)
const clearOldLogs = async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

    const result = await AdminActivityLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    // Log this action
    await logActivity({
      adminId: req.user.id,
      action: "OTHER",
      level: "warning",
      type: "system",
      details: `Cleared ${result.deletedCount} logs older than ${daysOld} days`,
      ipAddress: req.ip || "",
    });

    return apiResponse({
      res,
      status: true,
      message: `Cleared ${result.deletedCount} old logs.`,
      statusCode: StatusCodes.OK,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error("Error clearing old logs:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to clear old logs.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// Export logs as JSON
const exportLogs = async (req, res) => {
  try {
    const { startDate, endDate, level, type } = req.query;
    
    const query = {};
    if (level && level !== "all") query.level = level;
    if (type && type !== "all") query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AdminActivityLog.find(query)
      .populate("adminId", "name email")
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    const exportData = logs.map((log) => ({
      timestamp: log.createdAt,
      level: log.level,
      type: log.type,
      action: log.action,
      user: log.adminId?.email || "system",
      details: log.details,
      ip: log.ipAddress || "N/A",
    }));

    return apiResponse({
      res,
      status: true,
      message: "Logs exported successfully.",
      statusCode: StatusCodes.OK,
      data: exportData,
    });
  } catch (error) {
    console.error("Error exporting logs:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to export logs.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export default {
  getActivityLogs,
  createActivityLog,
  logActivity,
  getActivityStats,
  clearOldLogs,
  exportLogs,
};

export { logActivity };
