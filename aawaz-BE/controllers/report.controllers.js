import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import Report from "../models/report.model.js";
import ActivityLogger from "../utils/activity-logger.js";

const createReport = async (req, res) => {
    const { reportedUserId, postId, commentId, commentReplyId, reason, reportType } = req.body;
    const userId = req.user.id;

    console.log(" Report creation - Reason from user:", reason);
    console.log(" Report creation - Full body:", req.body);

    try {
      const existingReport = await Report.findOne({
        userId,
        reportType,
        ...(reportedUserId && { reportedUserId }),
        ...(postId && { postId }),
        ...(commentId && { commentId }),
        ...(commentReplyId && { commentReplyId }),
      });

      if (existingReport) {
        return apiResponse({
          res,
          status: false,
          message: "You have already reported this entity.",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      console.log(" Report creation - Creating report with reason:", reason);

      const newReport = await Report.create({
        userId,
        reason,
        reportType,
        reportedUserId: reportedUserId || null,
        postId: postId || null,
        commentId: commentId || null,
        commentReplyId: commentReplyId || null,
      });

      console.log(" Report creation - Saved report reason:", newReport.reason);

      // Log report creation
      let action = 'POST_REPORTED';
      let entityId = postId;
      
      if (reportType === 'comment') {
        action = 'COMMENT_REPORTED';
        entityId = commentId;
      } else if (reportType === 'profile') {
        action = 'PROFILE_REPORTED';
        entityId = reportedUserId;
      }

      ActivityLogger.logReport(action, `User reported ${reportType}`, userId, newReport._id, {
        reportedUserId,
        postId,
        commentId,
        commentReplyId,
        reason,
        reportType,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return apiResponse({
        res,
        status: true,
        message: "Report submitted successfully!",
        statusCode: StatusCodes.OK,
      });
    } catch (error) {
      console.error(" Report creation - Error:", error);
      ActivityLogger.logError('REPORT_CREATE_ERROR', 'Error creating report', error, {
        userId,
        reportType,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return apiResponse({
        res,
        status: false,
        message: "Failed Report Request!",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
};

export default {
    createReport
};