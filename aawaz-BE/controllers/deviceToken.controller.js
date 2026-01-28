import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import DeviceToken from "../models/deviceToken.model.js";
import User from "../models/user.model.js";
import ActivityLogger from "../utils/activity-logger.js";

class DeviceTokenController {
    /**
     * Register or update device token
     * POST /api/v1/user/device-token
     */
    async registerDeviceToken(req, res) {
        try {
            const userId = req.user.id;
            const { deviceToken, platform } = req.body;

            console.log('🔧 REGISTERING DEVICE TOKEN:', { userId, deviceToken, platform });

            // Validate required fields
            if (!deviceToken) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Device token is required",
                });
            }

            // Validate platform
            const validPlatforms = ['android', 'ios', 'web'];
            if (platform && !validPlatforms.includes(platform)) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Invalid platform. Must be one of: android, ios, web",
                });
            }

            // Generate deviceId from user agent or use a default
            const deviceId = req.get('User-Agent')?.substring(0, 100) || `device_${Date.now()}`;

            // Save to dedicated DeviceToken collection
            const deviceTokenDoc = await DeviceToken.findOneAndUpdate(
                { userId, deviceId },
                { 
                    deviceToken, 
                    platform: platform || 'android', 
                    isActive: true, 
                    lastActiveAt: new Date() 
                },
                { upsert: true, new: true }
            );

            // Also update user.pushToken for backward compatibility
            await User.findByIdAndUpdate(userId, { 
                pushToken: deviceToken,
                deviceId: deviceId
            });

            console.log('✅ DEVICE TOKEN REGISTERED SUCCESSFULLY');

            // Log token registration
            ActivityLogger.logNotificationUser('DEVICE_TOKEN_REGISTERED', 'User device token registered', userId, {
                deviceId,
                platform,
                deviceTokenId: deviceTokenDoc._id
            });

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Device token registered successfully",
                data: {
                    deviceId,
                    platform,
                    tokenRegistered: true
                }
            });

        } catch (error) {
            console.error('Register device token error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to register device token",
            });
        }
    }

    /**
     * Get all active device tokens for admin
     * GET /api/v1/admin/device-tokens
     */
    async getActiveDeviceTokens(req, res) {
        try {
            const { page = 1, limit = 50 } = req.query;
            const skip = (page - 1) * limit;

            const deviceTokens = await DeviceToken.find({ isActive: true })
                .populate('userId', 'name email')
                .sort({ lastActiveAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean();

            const total = await DeviceToken.countDocuments({ isActive: true });

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Active device tokens retrieved successfully",
                data: {
                    deviceTokens,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get active device tokens error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to retrieve device tokens",
            });
        }
    }

    /**
     * Deactivate device token
     * DELETE /api/v1/user/device-token
     */
    async deactivateDeviceToken(req, res) {
        try {
            const userId = req.user.id;
            const { deviceToken } = req.body;

            if (!deviceToken) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Device token is required",
                });
            }

            await DeviceToken.updateOne(
                { userId, deviceToken },
                { isActive: false, lastActiveAt: new Date() }
            );

            // Also clear user.pushToken if it matches
            await User.updateOne(
                { _id: userId, pushToken: deviceToken },
                { pushToken: null, deviceId: null }
            );

            console.log('✅ DEVICE TOKEN DEACTIVATED');

            ActivityLogger.logNotificationUser('DEVICE_TOKEN_DEACTIVATED', 'User device token deactivated', userId, {
                deviceToken
            });

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Device token deactivated successfully",
            });

        } catch (error) {
            console.error('Deactivate device token error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to deactivate device token",
            });
        }
    }

    /**
     * Get device tokens statistics
     * GET /api/v1/admin/device-tokens/statistics
     */
    async getDeviceTokenStatistics(req, res) {
        try {
            const stats = await DeviceToken.aggregate([
                {
                    $group: {
                        _id: null,
                        totalTokens: { $sum: 1 },
                        activeTokens: { $sum: { $cond: ['$isActive', 1, 0] } },
                        inactiveTokens: { $sum: { $cond: ['$isActive', 0, 1] } },
                        androidTokens: { $sum: { $cond: [{ $eq: ['$platform', 'android'] }, 1, 0] } },
                        iosTokens: { $sum: { $cond: [{ $eq: ['$platform', 'ios'] }, 1, 0] } },
                        webTokens: { $sum: { $cond: [{ $eq: ['$platform', 'web'] }, 1, 0] } }
                    }
                }
            ]);

            const result = stats[0] || {
                totalTokens: 0,
                activeTokens: 0,
                inactiveTokens: 0,
                androidTokens: 0,
                iosTokens: 0,
                webTokens: 0
            };

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Device token statistics retrieved successfully",
                data: result
            });

        } catch (error) {
            console.error('Get device token statistics error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to retrieve device token statistics",
            });
        }
    }
}

export default new DeviceTokenController();
