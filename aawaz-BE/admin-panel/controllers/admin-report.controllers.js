import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../../helper/apiResponse.js";
import Report from "../../models/report.model.js";
import AdminEventPost from "../models/admin-event-post.model.js";
import enums from '../../config/enum.js';
import User from "../../models/user.model.js";

const updateReportStatus = async (req, res) => {
    const { reportId, status } = req.params;
    try {

        if(status !== enums.reportStatusEnum.APPROVED && status !== enums.reportStatusEnum.REJECTED) {
            return apiResponse({
                res,
                status: true,
                message: "Invalid status",
                statusCode: StatusCodes.BAD_REQUEST,
            });
        }
        await Report.findByIdAndUpdate(reportId, { status });

        return apiResponse({
            res,
            status: true,
            message: "Report status updated successfully!",
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        return apiResponse({
            res,
            status: false,
            message: "Failed Report Request!",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const getAllPostReports = async (req, res) => {
    try {
        console.log("🔍 Admin Post Reports - Fetching reports...");
        const reports = await Report.find({ reportType: enums.reportTypeEnum.POST }).lean();
        
        console.log("🔍 Admin Post Reports - Raw reports from DB:", reports.map(r => ({ id: r._id, reason: r.reason, postId: r.postId })));

        const groupedReports = reports.reduce((acc, report) => {
            const { postId, userId, reason } = report;
            if (!acc[postId]) {
                acc[postId] = {
                    postId,
                    reports: [],
                };
            }
            acc[postId].reports.push({ userId, reason });
            return acc;
        }, {});

        const postIds = Object.keys(groupedReports);
        const userIds = [...new Set(reports.map((report) => report.userId))];

        // Fetch complete post data with all media fields
        const eventPosts = await AdminEventPost.find({ _id: { $in: postIds }})
            .select('title attachments attachmentFileType additionalDetails createdAt deleted')
            .lean();

        const users = await User.find({ _id: { $in: userIds } }).lean();

        const userMap = users.reduce((acc, user) => {
            acc[user._id] = {
                name: user.name,
                profilePicture: user.profilePicture || null,
            };
            return acc;
        }, {});

        const result = postIds.map((postId) => {
            const postDetails = eventPosts.find((post) => post?._id?.toString() === postId?.toString());
            const reportsWithUserData = groupedReports[postId].reports.map((report) => {
                const user = userMap[report.userId];
                return {
                    userId: report.userId,
                    name: user?.name || "Unknown",
                    profilePicture: user?.profilePicture || null,
                    reason: report.reason,
                };
            });

            // Create entity object with complete post data
            const entity = postDetails ? {
                _id: postDetails._id,
                title: postDetails.title || 'Untitled Post',
                attachment: postDetails.attachments?.[0]?.attachment || null,
                thumbnail: postDetails.attachments?.[0]?.thumbnail || null,
                attachmentFileType: postDetails.attachments?.[0]?.attachmentFileType || null,
                additionalDetails: postDetails.additionalDetails || '',
                createdAt: postDetails.createdAt,
                isDeleted: postDetails.deleted?.isDeleted || false
            } : null;

            return {
                _id: reports.find(r => r.postId === postId)?._id, // Use first report ID
                type: "POST",
                reason: reportsWithUserData && reportsWithUserData[0] && reportsWithUserData[0]?.reason,
                status: "OPEN",
                createdAt: reports.find(r => r.postId === postId)?.createdAt,
                postId,
                postImage: postDetails?.attachments?.[0]?.attachment || null,
                thumbnail: postDetails?.attachments?.[0]?.thumbnail || null,
                attachmentFileType: postDetails?.attachments?.[0]?.attachmentFileType || null,
                title: postDetails?.title || 'Untitled Post',
                reportedCounts: reportsWithUserData?.length || 0,
                latestReportedReason: reportsWithUserData && reportsWithUserData[0] && reportsWithUserData[0]?.reason,
                isDeleted: postDetails?.deleted?.isDeleted,
                reports: reportsWithUserData,
                entity // Complete entity data for frontend
            };
        });

        console.log("🔍 Admin Post Reports - Processed result with entities:", result.map(r => ({ 
            postId: r.postId, 
            hasEntity: !!r.entity,
            hasAttachment: !!r.entity?.attachment,
            attachmentType: r.entity?.attachmentFileType 
        })));

        const filteredResponse = result?.filter((v)=> v?.isDeleted === false)

        return apiResponse({
            res,
            data: filteredResponse,
            status: true,
            message: "Reports fetched successfully!",
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        console.error("🔍 Admin Post Reports - Error:", error);
        return apiResponse({
            res,
            status: false,
            message: "Failed to fetch reports!",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const getAllUserReports = async (req, res) => {
    try {
        const reports = await Report.find({ reportType: enums.reportTypeEnum.USER }).lean();

        const groupedReports = reports.reduce((acc, report) => {
            const { reportedUserId, userId, reason } = report;
            if (!acc[reportedUserId]) {
                acc[reportedUserId] = {
                    reportedUserId,
                    reports: [],
                };
            }
            acc[reportedUserId].reports.push({ userId, reason });
            return acc;
        }, {});

        const reportedUserIds = Object.keys(groupedReports);

        const reportedUsers = await User.find({ _id: { $in: reportedUserIds } }).lean();

        const userIds = [...new Set(reports.map((report) => report.userId))];
        const reportingUsers = await User.find({ _id: { $in: userIds } }).lean();

        const reportedUserMap = reportedUsers.reduce((acc, user) => {
            acc[user._id] = {
                name: user.name,
                profilePicture: user.profilePicture || null,
                isBlocked: user?.isBlocked
            };
            return acc;
        }, {});

        const reportingUserMap = reportingUsers.reduce((acc, user) => {
            acc[user._id] = {
                name: user.name,
                profilePicture: user.profilePicture || null,
                isBlocked: user.isBlocked
            };
            return acc;
        }, {});

        const result = reportedUserIds.map((reportedUserId) => {
            const reportsWithUserData = groupedReports[reportedUserId].reports.map((report) => {
                const reportingUser = reportingUserMap[report.userId];
                return {
                    userId: report.userId,
                    name: reportingUser?.name || "Unknown",
                    profilePicture: reportingUser?.profilePicture || null,
                    reason: report.reason,
                };
            });

            const reportedUser = reportedUserMap[reportedUserId];
            return {
                reportedUserId,
                reportedUserName: reportedUser?.name || "Unknown",
                isBlocked: reportedUser?.isBlocked,
                reportedUserProfilePicture: reportedUser?.profilePicture || null,
                reportedCounts: reportsWithUserData?.length || 0,
                reports: reportsWithUserData,
            };
        });

        return apiResponse({
            res,
            data: result,
            status: true,
            message: "User reports fetched successfully!",
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        return apiResponse({
            res,
            status: false,
            message: "Failed to fetch user reports!",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const getAllCommentReports = async (req, res) => {
    try {
        const reports = await Report.find({
            reportType: { $in: [enums.reportTypeEnum.COMMENT, enums.reportTypeEnum.COMMENT_REPLY] } 
        }).sort({ createdAt: -1 }).lean();

        const groupedReports = reports.reduce((acc, report) => {
            const { postId, commentId, commentReplyId, reason, reportType, _id, userId } = report;

            if (!acc[postId]) {
                acc[postId] = {
                    postId,
                    reports: [],
                    firstReportedUserId: userId,
                    firstReportedReason: reason
                };
            }

            acc[postId].reports.push({
                commentId,
                commentReplyId,
                reason,
                reportType,
                reportId: _id,
                reportedUserId: userId
            });

            return acc;
        }, {});

        const postIds = Object.keys(groupedReports);
        const eventPosts = await AdminEventPost.find({ _id: { $in: postIds } }).lean();

        const allUserIds = new Set();

        // Collect all first reporter user IDs for batch fetching
        Object.values(groupedReports).forEach(report => {
            allUserIds.add(report.firstReportedUserId?.toString());
        });

        const result = postIds.map(postId => {
            const postDetails = eventPosts.find(post => post?._id.toString() === postId);
            const commentMap = new Map();

            groupedReports[postId].reports.forEach(report => {
                const { commentId, commentReplyId, reason, reportType, reportId, reportedUserId } = report;
                const key = commentId + (commentReplyId || "");

                if (!commentMap.has(key)) {
                    const commentData = postDetails?.userComments?.find(comment => comment._id.toString() === commentId) || {};
                    const replyData = commentData?.replies?.find(reply => reply._id.toString() === commentReplyId) || {};

                    const commentedUserId = reportType === enums.reportTypeEnum.COMMENT ? commentData?.userId : replyData?.userId;
                    allUserIds.add(commentedUserId?.toString());
                    allUserIds.add(reportedUserId?.toString());

                    commentMap.set(key, {
                        commentId,
                        commentReplyId,
                        comment: reportType === enums.reportTypeEnum.COMMENT ? commentData?.comment || "" : replyData?.comment || "",
                        timestamp: reportType === enums.reportTypeEnum.COMMENT ? commentData?.timestamp || null : replyData?.timestamp || null,
                        totalLikes: reportType === enums.reportTypeEnum.COMMENT ? commentData?.likes?.length || 0 : replyData?.likes?.length || 0,
                        commentedUserId,
                        commentedUserName: null,
                        commentedUserImage: null,
                        commentType: reportType,
                        reportId,
                        reason,
                        reportCount: 1,
                        reportedUserIds: [reportedUserId],
                        reportedUserReasons: [{ userId: reportedUserId, reason: reason }]
                    });
                } else {
                    const existingReport = commentMap.get(key);
                    existingReport.reportCount++;
                    existingReport.reportedUserIds.push(reportedUserId);
                    existingReport.reportedUserReasons.push({ userId: reportedUserId, reason: reason });
                    allUserIds.add(reportedUserId?.toString());
                }
            });

            const reportsArray = Array.from(commentMap.values());

            const totalReportedCount = reportsArray.reduce((sum, report) => sum + report.reportCount, 0);

            return {
                postId,
                postImage: postDetails?.attachments?.[0]?.attachment || null,
                thumbnail: postDetails?.attachments?.[0]?.thumbnail || null,
                totalReportedCount,
                firstReportedUserId: groupedReports[postId].firstReportedUserId,
                firstReportedUserName: null,
                firstReportedUserImage: null,
                firstReportedReason: groupedReports[postId].firstReportedReason,
                reports: reportsArray
            };
        });

        // Fetch user details for all users (including reporting users)
        const users = await User.find({ _id: { $in: Array.from(allUserIds) } }).lean();

        const userMap = users.reduce((acc, user) => {
            acc[user._id.toString()] = {
                name: user.name,
                profilePicture: user.profilePicture || null
            };
            return acc;
        }, {});

        // Map user details to reports
        result.forEach(post => {
            post.reports.forEach(report => {
                if (userMap[report.commentedUserId]) {
                    report.commentedUserName = userMap[report.commentedUserId].name;
                    report.commentedUserImage = userMap[report.commentedUserId].profilePicture;
                }

                // Add reportedUsers array with details of all users who reported
                report.reportedUsers = report.reportedUserIds.map(userId => {
                    const user = userMap[userId];
                    // Find the reason for this specific user's report
                    const userReport = report.reportedUserReasons.find(r => r.userId === userId);
                    return {
                        userId,
                        name: user?.name || "Unknown",
                        profilePicture: user?.profilePicture || null,
                        reason: userReport?.reason || "Unknown reason"
                    };
                });

                // Remove the temporary arrays as we don't need them in the response
                delete report.reportedUserIds;
                delete report.reportedUserReasons;
            });

            // Assign first reported user's details from the stored firstReportedUserId
            if (post.firstReportedUserId && userMap[post.firstReportedUserId]) {
                post.firstReportedUserName = userMap[post.firstReportedUserId].name;
                post.firstReportedUserImage = userMap[post.firstReportedUserId].profilePicture;
            }
        });

        return apiResponse({
            res,
            data: {
                totalPostCounts: result.length || 0,
                data: result,
            },
            status: true,
            message: "Comment reports fetched successfully!",
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        console.error("Error fetching comment reports:", error);
        return apiResponse({
            res,
            status: false,
            message: "Failed to fetch comment reports!",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const deletePostCommentAndCommentReply = async (req, res) => {
    try {
        const { postId, commentId, commentReplyId, reportType, reportId } = req.body;

        const postDetails = await AdminEventPost.findOne({ _id: postId });
        if (!postDetails) {
            return apiResponse({
                res,
                status: false,
                message: "Post not found!",
                statusCode: StatusCodes.NOT_FOUND,
            });
        }

        if (reportType === enums.reportTypeEnum.COMMENT) {
            postDetails.userComments = postDetails.userComments.filter((comment) => comment._id.toString() !== commentId.toString());
        } else if (reportType === enums.reportTypeEnum.COMMENT_REPLY) {
            const comment = postDetails.userComments.find((comment) => comment._id.toString() === commentId.toString());
            if (comment) {
                comment.replies = comment.replies.filter((reply) => reply._id.toString() !== commentReplyId.toString());
            }
        } else {
            return apiResponse({
                res,
                status: false,
                message: "Invalid report type!",
                statusCode: StatusCodes.BAD_REQUEST,
            });
        }

        await postDetails.save();

        // Delete the corresponding report
        const deletedReport = await Report.findOneAndDelete({ _id: reportId });
        if (!deletedReport) {
            return apiResponse({
                res,
                status: false,
                message: "Report not found!",
                statusCode: StatusCodes.NOT_FOUND,
            });
        }

        return apiResponse({
            res,
            status: true,
            message: "Comment deleted successfully!",
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        return apiResponse({
            res,
            status: false,
            message: "Failed to delete comment!",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const getReportById = async (req, res) => {
    try {
        const { reportId } = req.params;
        
        console.log("🔍 Admin Report Details - Fetching report:", reportId);
        
        const report = await Report.findById(reportId).lean();
        
        if (!report) {
            return apiResponse({
                res,
                status: false,
                message: "Report not found",
                statusCode: StatusCodes.NOT_FOUND,
            });
        }
        
        console.log("🔍 Admin Report Details - Found report:", { 
            id: report._id, 
            type: report.reportType, 
            postId: report.postId,
            reason: report.reason 
        });
        
        let entity = null;
        
        // Fetch entity based on report type
        if (report.reportType === enums.reportTypeEnum.POST && report.postId) {
            const post = await AdminEventPost.findById(report.postId)
                .select('title attachments attachmentFileType additionalDetails createdAt deleted')
                .lean();
                
            if (post) {
                entity = {
                    _id: post._id,
                    title: post.title || 'Untitled Post',
                    attachment: post.attachments?.[0]?.attachment || null,
                    thumbnail: post.attachments?.[0]?.thumbnail || null,
                    attachmentFileType: post.attachments?.[0]?.attachmentFileType || null,
                    additionalDetails: post.additionalDetails || '',
                    createdAt: post.createdAt,
                    isDeleted: post.deleted?.isDeleted || false
                };
            }
        }
        
        // Fetch user details
        const reportingUser = await User.findById(report.userId).lean();
        
        const response = {
            _id: report._id,
            type: report.reportType,
            reason: report.reason,
            status: report.status,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            reportedUserId: report.reportedUserId,
            postId: report.postId,
            commentId: report.commentId,
            commentReplyId: report.commentReplyId,
            reportingUser: reportingUser ? {
                _id: reportingUser._id,
                name: reportingUser.name,
                email: reportingUser.email,
                profilePicture: reportingUser.profilePicture
            } : null,
            entity
        };
        
        console.log("🔍 Admin Report Details - Response:", {
            hasEntity: !!entity,
            hasAttachment: !!entity?.attachment,
            attachmentType: entity?.attachmentFileType
        });
        
        return apiResponse({
            res,
            data: response,
            status: true,
            message: "Report details fetched successfully!",
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        console.error("🔍 Admin Report Details - Error:", error);
        return apiResponse({
            res,
            status: false,
            message: "Failed to fetch report details!",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

export default {
    getAllPostReports,
    getAllUserReports,
    getAllCommentReports,
    getReportById,
    updateReportStatus,
    deletePostCommentAndCommentReply
};