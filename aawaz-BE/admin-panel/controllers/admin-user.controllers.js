import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../../helper/apiResponse.js";
import AdminUser from "../models/admin-user.model.js";
import enums from "../../config/enum.js";
import config from "../../config/config.js";
import emailServices from "../../services/email.services.js";
import { paginationDetails, paginationFun } from "../../helper/common.js";
import User from "../../models/user.model.js";
import helper from "../../helper/common.js"
import EventPost from "../../models/event-post.model.js";
import AdminEventPost from "../models/admin-event-post.model.js";
import ActivityLogger from "../../utils/activity-logger.js";

const getAdminUserProfile = async (req, res) => {
    const userId = req.user.id;
    const user = await AdminUser.findById(userId);

    if (!user) {
        return apiResponse({
            res,
            status: false,
            message: "User not found.",
            statusCode: StatusCodes.NOT_FOUND,
        });
    }

    try {
        const { password, otp, otpExpiresAt, isVerified, provider, role, createdAt, updatedAt, ...userProfile } = user.toObject();

        return apiResponse({
            res,
            status: true,
            message: "User profile fetched successfully.",
            statusCode: StatusCodes.OK,
            data: userProfile
        });
    } catch (error) {
        return apiResponse({
            res,
            status: false,
            message: "Failed to fetch user profile.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const getAllAdminUsers = async (req, res) => {
    try {
        const { search, page = 1, limit = 10, filterType } = req.query;
        const { id } = req.params;
        const filter = { role: enums.userRoleEnum.ADMIN };

        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (id) filter._id = id;

        if (filterType) {
            filter.ownerApproveStatus = filterType;
        }

        const { skip, limit: parsedLimit } = paginationFun({ page, limit });
        const totalItems = await AdminUser.countDocuments(filter);
        const adminUsers = await AdminUser.find(filter).skip(skip).limit(parsedLimit);

        const pagination = paginationDetails({ page, totalItems, limit: parsedLimit });

        return apiResponse({
            res,
            status: true,
            message: "Admin users fetched successfully.",
            data: {
                page: pagination.page,
                totalPages: pagination.totalPages,
                totalItems: pagination.totalItems,
                limit: pagination.limit,
                data: adminUsers,
            },
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        return apiResponse({
            res,
            status: false,
            message: "Failed to fetch admin users.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const approveAndRejectAdminUser = async (req, res) => {
    const { status, registerAdminId } = req.body;
    try {
        const user = await AdminUser.findById(registerAdminId);
        const isVerified = status === enums.ownerApproveStatusEnum.APPROVED ? true : false;
        user.isVerified = isVerified
        user.ownerApproveStatus = isVerified ? enums.ownerApproveStatusEnum.APPROVED : status === enums.ownerApproveStatusEnum.PENDING ? enums.ownerApproveStatusEnum.PENDING : enums.ownerApproveStatusEnum.REJECTED;
        await user.save();
        let emailWarning = null;
        const smtpDisabled = String(process.env.SMTP_DISABLED || "false").toLowerCase() === "true";
        if (status !== enums.ownerApproveStatusEnum.PENDING && !smtpDisabled) {
          try {
            let emailResult;

            if (isVerified) {
              emailResult = await emailServices.sendApprovalEmail({ email: user.email });
            } else {
              emailResult = await emailServices.sendRejectEmail({ email: user.email });
            }

            if (!emailResult?.success) {
              emailWarning = emailResult?.message || "Email sending skipped.";
            }
          } catch (err) {
            emailWarning = "Email sending skipped.";
          }
        }

        return apiResponse({
            res,
            status: true,
            message: isVerified ? "Admin approved successfully." :  status === enums.ownerApproveStatusEnum.PENDING ? "Admin Pending status updated successfully." : "Admin rejected successfully.",
            data: emailWarning ? { emailWarning } : null,
            statusCode: StatusCodes.OK
        });
    } catch (error) {
        return apiResponse({
            res,
            status: false,
            message: "Failed to approve admin user.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const blockAndUnblockUser = async (req, res) => {
    const { userId } = req.params;
    const adminId = req.user.id;
    try {
        const user = await User.findById({ _id: userId });
        if (!user) {
            return apiResponse({
                res,
                status: false,
                message: "User not found.",
                statusCode: StatusCodes.NOT_FOUND,
            });
        }

        const wasBlocked = user.isBlocked;
        const action = wasBlocked ? 'unblocked' : 'blocked';

        if(user.isBlocked) {
            user.isBlocked = false;
        } else {
            user.isBlocked = true;
        }

        await user.save();

        // Log admin action
        ActivityLogger.logAdmin(
            `USER_${action.toUpperCase()}`, 
            `Admin ${action} user successfully`, 
            adminId, 
            userId, 
            {
                userName: user.name || user.username,
                userEmail: user.email,
                previousStatus: wasBlocked ? 'blocked' : 'active',
                newStatus: user.isBlocked ? 'blocked' : 'active',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        );

        // Log user action
        ActivityLogger.logUser(
            `USER_${action.toUpperCase()}`, 
            `User was ${action} by admin`, 
            userId, 
            {
                adminId,
                action: action,
                ipAddress: req.ip
            }
        );

        return apiResponse({
            res,
            status: true,
            message: user.isBlocked ? "User blocked successfully." : "User unblocked successfully.",
            statusCode: StatusCodes.OK
        });
    } catch (error) {
        // Log system error
        ActivityLogger.logError('USER_BLOCK_UNBLOCK_ERROR', 'Failed to block/unblock user', error, {
            targetUserId: userId,
            adminId: req.user.id,
            ipAddress: req.ip
        });
        
        return apiResponse({
            res,
            status: false,
            message:  "Failed to block/unblocked user.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const getAllAppUsers = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const { id, type } = req.params;
        const filter = { role: enums.userRoleEnum.USER };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        if (id) filter._id = id;

        if (type === 'block') {
            filter.isBlocked = true;
        } else if (type === 'unblock') {
            filter.isBlocked = false;
        }

        const { skip, limit: parsedLimit } = paginationFun({ page, limit });
        const totalItems = await User.countDocuments(filter);
        const users = await User.find(filter).skip(skip).limit(parsedLimit);

        const pagination = paginationDetails({ page, totalItems, limit: parsedLimit });

        const filterUserData = (users || []).map(user => ({
            _id: user._id,
            name: user.name,
            profilePicture: user.profilePicture,
            username: user.username || null,
            isBlocked: user.isBlocked
        }));

        return apiResponse({
            res,
            status: true,
            message: "Users fetched successfully.",
            data: {
                page: pagination.page,
                totalPages: pagination.totalPages,
                totalItems: pagination.totalItems,
                limit: pagination.limit,
                data: filterUserData,
            },
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        return apiResponse({
            res,
            status: false,
            message: "Failed to fetch admin users.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const updateAdminUserProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, mobileNumber, attachment, countryCode } = req.body;
    const profilePicture = req.file;
    const adminUser = await AdminUser.findById(userId);

    if (!adminUser) {
      return apiResponse({
        res,
        status: false,
        message: "User not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    try {
      let profilePictureUrl = null
      if(attachment === undefined && profilePicture === undefined ) {
        profilePictureUrl = null
      } else if(attachment !== undefined && profilePicture === undefined) {
        profilePictureUrl = attachment
      } else if(attachment === undefined && profilePicture !== undefined) {
        const now = new Date();
        const eventTimeFileId = helper.formatDateToString(now);
        profilePictureUrl = await helper.uploadMediaInS3Bucket(profilePicture, config.mediaFolderEnum.PROFILE_PICTURE, eventTimeFileId)
      }
      adminUser.profilePicture = profilePictureUrl;
      if (name !== undefined) adminUser.name = name;
      if (mobileNumber !== undefined) adminUser.mobileNumber = mobileNumber;
      if (countryCode !== undefined) adminUser.countryCode = countryCode;

      await adminUser.save();

      const adminUsers = {
        _id: adminUser?._id,
        email: adminUser?.email,
        name: adminUser?.name,
        profilePicture: adminUser?.profilePicture,
        mobileNumber: adminUser?.mobileNumber,
        countryCode: adminUser?.countryCode
      };

      return apiResponse({
        res,
        status: true,
        message: "User profile updated successfully.",
        statusCode: StatusCodes.OK,
        data: adminUsers,
      });
    } catch (error) {
      return apiResponse({
        res,
        status: false,
        message: "Failed to update user profile.",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
};

const updateAdminUserRadius = async (req, res) => {
    const adminId = req.user._id;
    try {
      const admin = await AdminUser.findById({_id: adminId});
      if (!admin) {
        return apiResponse({
          res,
          status: false,
          message: "Admin not found.",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      if (req.body.radius !== undefined) {
        admin.radius = req.body.radius;
      }
  
      await admin.save();
  
      return apiResponse({
        res,
        status: true,
        message: "Admin radius updated successfully.",
        statusCode: StatusCodes.OK,
        data: { 
          radius: admin.radius,
        }
      });
    } catch (error) {
      return apiResponse({
        res,
        status: false,
        message: "Failed to update admin radius.",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
};

const updateAdminFcmToken = async (req, res) => {
    const adminId = req.user.id;
    const { fcmToken } = req.body;
    try {
      const admin = await AdminUser.findById({ _id: adminId });
  
      if (!admin) {
        return apiResponse({
          res,
          status: false,
          message: "Admin not found.",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
  
      admin.fcmToken = fcmToken;
      await admin.save();

      return apiResponse({
        res,
        status: true,
        message: "Admin fcm token updated successfully.",
        statusCode: StatusCodes.OK,
      });
    } catch (error) {
      return apiResponse({
        res,
        status: false,
        message: "Failed to update admin fcm token.",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
};

const getOtherUserProfile = async(req, res) =>{
  const { otherUserId } = req.params;
  try {

    const user = await User.findById({ _id: otherUserId });
    if (!user) {
      return apiResponse({
        res,
        status: false,
        message: "User not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const eventPosts = await EventPost.find({ userId: otherUserId });

    const filteredEventPosts = (eventPosts || []).map(eventPost => {
      return {
        _id: eventPost._id,
        attachment: eventPost.attachment,
        status: eventPost.status,
        thumbnail: eventPost?.thumbnail,
        adminCreatedPostId: eventPost.adminCreatedPostId || null,
      }
    });

    const verifiedEventPosts = (filteredEventPosts || []).filter(eventPost => eventPost.status === enums.eventPostStatusEnum.APPROVED)

    const verifiedEventPostIds = eventPosts.filter(eventPost => eventPost.status === enums.eventPostStatusEnum.APPROVED).map(eventPost => eventPost.adminCreatedPostId);

    const adminVerifiedEventPosts = await AdminEventPost.find({
      _id: { $in: verifiedEventPostIds },
      "deleted.isDeleted": false
    });

    const adminVerifiedEventPostIds = adminVerifiedEventPosts.map(post => String(post._id));
    const matchedVerifiedEventPosts = verifiedEventPosts.filter(post =>
      post.adminCreatedPostId && adminVerifiedEventPostIds.includes(String(post.adminCreatedPostId))
    );
    
    // console.log("adminVerifiedEventPosts", adminVerifiedEventPosts)
    const totalApprovedEventViews = adminVerifiedEventPosts.reduce((total, post) => total + (post.viewCounts || 0), 0);

    const users = {
      _id: user?._id,
      name: user?.name,
      profilePicture: user?.profilePicture,
      username: user?.username || null,
      isBlocked: user?.isBlocked,
      allBroadcastCounts: helper.formatNumber(filteredEventPosts?.length ? filteredEventPosts?.length :"0"),
      totalApprovedEventViews: helper.formatNumber(totalApprovedEventViews || "0"),
      verifiedEventCounts: helper.formatNumber(matchedVerifiedEventPosts?.length ? matchedVerifiedEventPosts?.length : "0"),
      allBroadcasts: filteredEventPosts,
      verifiedEventPosts: matchedVerifiedEventPosts,
    };

    return apiResponse({
      res,
      status: true,
      message: "User profile fetched successfully.",
      statusCode: StatusCodes.OK,
      data: users,
    });

  } catch (error){
    return apiResponse({
      res,
      status: false,
      message: "Failed to get user profile.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
}

export default {
    getAdminUserProfile,
    getAllAdminUsers,
    approveAndRejectAdminUser,
    blockAndUnblockUser,
    getAllAppUsers,
    updateAdminUserProfile,
    updateAdminUserRadius,
    updateAdminFcmToken,
    getOtherUserProfile
};
