import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import sosService from "../services/sos.service.js";
import jwt from "jsonwebtoken";

class UserSosController {
    /**
     * Save SOS contacts
     */
    async saveSosContacts(req, res) {
        try {
            const userId = req.user.id;
            const { contacts } = req.body;

            const result = await sosService.saveSosContacts(userId, contacts);

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "SOS contacts saved successfully",
                data: result
            });
        } catch (error) {
            console.error('Save SOS contacts error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.BAD_REQUEST,
                status: false,
                message: error.message || "Failed to save SOS contacts",
            });
        }
    }

    /**
     * Get SOS contacts
     */
    async getSosContacts(req, res) {
        try {
            const userId = req.user.id;

            const result = await sosService.getSosContacts(userId);

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "SOS contacts retrieved successfully",
                data: result
            });
        } catch (error) {
            console.error('Get SOS contacts error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to retrieve SOS contacts",
            });
        }
    }

    /**
     * Trigger SOS emergency alert
     */
    async triggerSos(req, res) {
        try {
            const userId = req.user.id;
            const { latitude, longitude, address } = req.body;

            // Validate required fields
            if (!latitude || !longitude) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.BAD_REQUEST,
                    status: false,
                    message: "Latitude and longitude are required",
                });
            }

            const result = await sosService.triggerSos(userId, {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address
            });

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "SOS alert triggered successfully",
                data: {
                    sosEventId: result._id,
                    triggeredAt: result.triggeredAt,
                    location: {
                        latitude: result.latitude,
                        longitude: result.longitude,
                        address: result.address,
                        mapLink: result.mapLink
                    },
                    contactsNotified: result.contacts.length,
                    overallStatus: result.overallStatus,
                    messageSent: "Emergency contacts have been notified with your location"
                }
            });
        } catch (error) {
            console.error('Trigger SOS error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.BAD_REQUEST,
                status: false,
                message: error.message || "Failed to trigger SOS alert",
            });
        }
    }

    /**
     * Get user's SOS history
     */
    async getSosHistory(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10 } = req.query;

            const result = await sosService.getSosList({
                userId,
                page: parseInt(page),
                limit: parseInt(limit)
            });

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "SOS history retrieved successfully",
                data: result
            });
        } catch (error) {
            console.error('Get SOS history error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to retrieve SOS history",
            });
        }
    }

    /**
     * Get specific SOS event details (user's own events only)
     */
    async getSosEventDetails(req, res) {
        try {
            const userId = req.user.id;
            const { sosId } = req.params;

            const result = await sosService.getSosEventDetails(sosId);

            // Ensure user can only access their own SOS events
            if (result.userId._id.toString() !== userId) {
                return apiResponse({
                    res,
                    statusCode: StatusCodes.FORBIDDEN,
                    status: false,
                    message: "Access denied",
                });
            }

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "SOS event details retrieved successfully",
                data: result
            });
        } catch (error) {
            console.error('Get SOS event details error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.NOT_FOUND,
                status: false,
                message: error.message || "SOS event not found",
            });
        }
    }
}

export default new UserSosController();
