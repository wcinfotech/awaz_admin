import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../../helper/apiResponse.js";
import sosService from "../../services/sos.service.js";

class AdminSosController {
    /**
     * Get list of SOS events
     */
    async getSosList(req, res) {
        try {
            const { 
                status = 'all', 
                date, 
                userId, 
                page = 1, 
                limit = 20 
            } = req.query;

            console.log("🔍 SOS List Query:", { status, date, userId, page, limit });

            try {
                const result = await sosService.getSosList({
                    status,
                    date,
                    userId,
                    page: parseInt(page),
                    limit: parseInt(limit)
                });

                console.log("🔍 SOS List Result:", result);

                // Ensure result has the expected structure
                const safeResult = {
                    events: result?.events || [],
                    pagination: result?.pagination || {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        pages: 0
                    }
                };

                return res.status(200).json({
                    success: true,
                    data: safeResult
                });
            } catch (serviceError) {
                console.error("🔍 SOS List Service Error:", serviceError);
                // Return empty list if service fails
                return res.status(200).json({
                    success: true,
                    data: {
                        events: [],
                        pagination: {
                            page: parseInt(page),
                            limit: parseInt(limit),
                            total: 0,
                            pages: 0
                        }
                    }
                });
            }
        } catch (error) {
            console.error('🔍 Get SOS list error:', error);
            // Always return 200 with empty data, never 500
            return res.status(200).json({
                success: true,
                data: {
                    events: [],
                    pagination: {
                        page: 1,
                        limit: 20,
                        total: 0,
                        pages: 0
                    }
                }
            });
        }
    }

    /**
     * Get SOS event details
     */
    async getSosEventDetails(req, res) {
        try {
            const { sosId } = req.params;

            const result = await sosService.getSosEventDetails(sosId);

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

    /**
     * Mark SOS as resolved
     */
    async resolveSos(req, res) {
        try {
            const adminId = req.admin.id;
            const { sosId } = req.params;

            const result = await sosService.resolveSos(sosId, adminId);

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "SOS event marked as resolved successfully",
                data: result
            });
        } catch (error) {
            console.error('Resolve SOS error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.NOT_FOUND,
                status: false,
                message: error.message || "Failed to resolve SOS event",
            });
        }
    }

    /**
     * Get SOS statistics
     */
    async getSosStatistics(req, res) {
        try {
            const { period = '7d' } = req.query;
            
            console.log("🔍 SOS Stats Period:", period);
            
            // Calculate date range based on period
            const now = new Date();
            let startDate = new Date();
            
            switch (period) {
                case '24h':
                    startDate.setHours(now.getHours() - 24);
                    break;
                case '7d':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(now.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(now.getDate() - 90);
                    break;
                default:
                    startDate.setDate(now.getDate() - 7);
            }

            // Default statistics for empty DB or errors
            const defaultStatistics = {
                total: 0,
                statusBreakdown: {
                    sent: 0,
                    partialFailed: 0,
                    failed: 0,
                    resolved: 0
                },
                averageResponseTime: null,
                recentEvents: []
            };

            try {
                const result = await sosService.getSosList({
                    date: startDate.toISOString().split('T')[0],
                    limit: 1000 // Get all events in the period
                });

                console.log("🔍 SOS Service Result:", result);

                const events = result?.events || [];
                console.log("🔍 SOS Events Count:", events.length);
                
                const statistics = {
                    total: events.length,
                    statusBreakdown: {
                        sent: events.filter(e => e.overallStatus === 'SENT').length,
                        partialFailed: events.filter(e => e.overallStatus === 'PARTIAL_FAILED').length,
                        failed: events.filter(e => e.overallStatus === 'FAILED').length,
                        resolved: events.filter(e => e.overallStatus === 'RESOLVED').length
                    },
                    averageResponseTime: this.calculateAverageResponseTime(events),
                    recentEvents: events.slice(0, 5) // Last 5 events
                };

                console.log("🔍 SOS Statistics Calculated:", statistics);

                return res.status(200).json({
                    success: true,
                    data: statistics
                });
            } catch (serviceError) {
                console.error("🔍 SOS Service Error:", serviceError);
                // Return default statistics if service fails
                return res.status(200).json({
                    success: true,
                    data: defaultStatistics
                });
            }
        } catch (error) {
            console.error('🔍 Get SOS statistics error:', error);
            // Always return 200 with default data, never 500
            return res.status(200).json({
                success: true,
                data: {
                    total: 0,
                    statusBreakdown: {
                        sent: 0,
                        partialFailed: 0,
                        failed: 0,
                        resolved: 0
                    },
                    averageResponseTime: null,
                    recentEvents: []
                }
            });
        }
    }

    /**
     * Calculate average response time (time between trigger and resolution)
     */
    calculateAverageResponseTime(events) {
        const resolvedEvents = events.filter(e => e.resolvedAt && e.triggeredAt);
        
        if (resolvedEvents.length === 0) return null;
        
        const totalResponseTime = resolvedEvents.reduce((total, event) => {
            const responseTime = event.resolvedAt - event.triggeredAt;
            return total + responseTime;
        }, 0);
        
        const averageMs = totalResponseTime / resolvedEvents.length;
        
        // Convert to human readable format
        const hours = Math.floor(averageMs / (1000 * 60 * 60));
        const minutes = Math.floor((averageMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
            milliseconds: averageMs,
            formatted: `${hours}h ${minutes}m`
        };
    }

    /**
     * Get active SOS events (not resolved)
     */
    async getActiveSosEvents(req, res) {
        try {
            const result = await sosService.getSosList({
                status: 'all', // Get all, then filter
                limit: 100
            });

            const activeEvents = result.events.filter(event => 
                event.overallStatus !== 'RESOLVED'
            );

            return apiResponse({
                res,
                statusCode: StatusCodes.OK,
                status: true,
                message: "Active SOS events retrieved successfully",
                data: {
                    events: activeEvents,
                    total: activeEvents.length
                }
            });
        } catch (error) {
            console.error('Get active SOS events error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to retrieve active SOS events",
            });
        }
    }

    /**
     * Export SOS events to CSV
     */
    async exportSosEvents(req, res) {
        try {
            const { status, date, userId } = req.query;
            
            const result = await sosService.getSosList({
                status,
                date,
                userId,
                limit: 10000 // Get all events for export
            });

            const events = result.events;
            
            // Convert to CSV format
            const csvHeaders = [
                'SOS ID',
                'User Name',
                'User Email',
                'Latitude',
                'Longitude',
                'Address',
                'Map Link',
                'Status',
                'Triggered At',
                'Resolved At',
                'Resolved By',
                'Contact 1 Name',
                'Contact 1 Phone',
                'Contact 1 Status',
                'Contact 2 Name',
                'Contact 2 Phone',
                'Contact 2 Status'
            ];

            const csvRows = events.map(event => [
                event._id,
                event.userId?.name || 'N/A',
                event.userId?.email || 'N/A',
                event.latitude,
                event.longitude,
                event.address || 'N/A',
                event.mapLink,
                event.overallStatus,
                event.triggeredAt,
                event.resolvedAt || 'N/A',
                event.resolvedBy?.name || 'N/A',
                event.contacts[0]?.name || 'N/A',
                event.contacts[0]?.phone || 'N/A',
                event.contacts[0]?.status || 'N/A',
                event.contacts[1]?.name || 'N/A',
                event.contacts[1]?.phone || 'N/A',
                event.contacts[1]?.status || 'N/A'
            ]);

            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.map(cell => `"${cell}"`).join(','))
                .join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="sos-events-${new Date().toISOString().split('T')[0]}.csv"`);
            
            return res.send(csvContent);
        } catch (error) {
            console.error('Export SOS events error:', error);
            return apiResponse({
                res,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || "Failed to export SOS events",
            });
        }
    }
}

export default new AdminSosController();
