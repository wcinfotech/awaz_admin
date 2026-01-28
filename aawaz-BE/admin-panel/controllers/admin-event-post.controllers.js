import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../../helper/apiResponse.js";
import AdminEventPost from "../models/admin-event-post.model.js";
import helper, { paginationDetails, paginationFun } from "../../helper/common.js";
import enums from "../../config/enum.js";
import config from "../../config/config.js";
import EventPost from "../../models/event-post.model.js"; 
import AdminEventReaction from "../models/admin-event-reaction.model.js";
import AdminEventType from "../models/admin-event-type.model.js";
import User from "../../models/user.model.js";
import { filterEventPostData, getDistanceFromLatLonInKm } from "../../helper/filter-response.js";
import { sendEventNotifications, sendPostApproveAndRejectNotification } from "../services/notification.services.js";
import mongoose from "mongoose";
import DraftAdminEventPost from "../models/admin-event-post-draft.model.js";
import Report from "../../models/report.model.js";
import Notification from "../../models/notification.model.js";
import ActivityLogger from "../../utils/activity-logger.js";

// Helper function to extract ObjectId from potentially populated fields
const extractObjectId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === 'object' && value._id) {
    // Handle nested _id (e.g., { _id: { _id: ... } })
    if (typeof value._id === 'object' && value._id._id) {
      return value._id._id;
    }
    return value._id;
  }
  return value;
};

const createAdminEventPost = async (req, res) => {
  const {
    isDirectAdminPost,
    longitude,
    latitude,
    title,
    description,
    lostItemName,
    address,
    hashTags,
    mobileNumber,
    reactionId,
    eventTime,
    countryCode,
    postCategoryId,
    postType,
    isSensitiveContent,
    isShareAnonymously,
    attachment,
    userId,
    userRequestedEventId,
    thumbnail,
    adminPostDraftId
  } = req.body;
  const adminId = req.user.id;
  const { gallaryAttachment, gallaryThumbnail } = req.files;

  if (helper.toBoolean(isDirectAdminPost) === false) {
    const validation = helper.validateObjectIds({ userRequestedEventId });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const entitiesToValidate = [
      { model: EventPost, id: userRequestedEventId, name: "userRequestedEventId" },
      { model: AdminEventType, id: postCategoryId, name: "Post category" }
    ];

    for (const entity of entitiesToValidate) {
      if (!mongoose.Types.ObjectId.isValid(entity.id)) {
        return apiResponse({
          res,
          status: false,
          message: `${entity.name} ID is not a valid ObjectId`,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
    }

    const validationErrors = await helper.validateEntitiesExistence(entitiesToValidate);
    if (validationErrors.length > 0) {
      return apiResponse({
        res,
        status: true,
        message: validationErrors.join(", "),
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
  }

  try {
    let user = null;
    let userEventPost = null;

    if (helper.toBoolean(isDirectAdminPost) === false) {
      user = await User.findById({ _id: userId });
      userEventPost = await EventPost.findById({ _id: userRequestedEventId });
    }
    
    // Sanitize ObjectIds - extract plain ObjectId from potentially populated objects
    const sanitizedPostCategoryId = extractObjectId(postCategoryId);
    const sanitizedReactionId = extractObjectId(reactionId);
    
    let reactionDetails = null
    if(sanitizedReactionId) {
      reactionDetails = await AdminEventReaction.findById({_id: sanitizedReactionId})
    }

    const postCategoryDetails = sanitizedPostCategoryId ? await AdminEventType.findById({_id: sanitizedPostCategoryId}) : null;

    let gallaryAttachmentFileUrl = null;
    if (gallaryAttachment && gallaryAttachment[0]) {
      gallaryAttachmentFileUrl = await helper.uploadMediaInS3Bucket(gallaryAttachment[0], config.mediaFolderEnum.EVENT_POST);
    } else {
      gallaryAttachmentFileUrl = attachment;
    }
    
    let gallaryThumbnailFileUrl = null;
    if(gallaryThumbnail && gallaryThumbnail[0]){
      gallaryThumbnailFileUrl = await helper.uploadMediaInS3Bucket(gallaryThumbnail[0], config.mediaFolderEnum.EVENT_POST);
    } else {
      gallaryThumbnailFileUrl = thumbnail;
    }

    const now = new Date();
    const eventTimeFileId = helper.formatDateToString(now);

    const attachmentObject = {
      userId: helper.toBoolean(isDirectAdminPost) === true ? null : userId,
      title,
      eventTime,
      description: description ? description : null,
      attachment: gallaryAttachmentFileUrl,
      attachmentId: eventTimeFileId,
      name: helper.toBoolean(isDirectAdminPost) === true ? "Awaaz" : (helper.toBoolean(isShareAnonymously) === true ? null : user?.name),
      type: enums.eventPostTimelineTypeEnum.DEFAULT,
      profilePicture: helper.toBoolean(isDirectAdminPost) === true ? null : (helper.toBoolean(isShareAnonymously) === true ? null : user?.profilePicture),
      isShareAnonymously: helper.toBoolean(isShareAnonymously),
      isSensitiveContent: helper.toBoolean(isSensitiveContent),
      thumbnail: gallaryThumbnailFileUrl ? gallaryThumbnailFileUrl : null
    };

    const newEventPost = new AdminEventPost({
      adminId,
      longitude,
      latitude,
      title,
      description: description ? description : null,
      eventTime,
      attachments: [attachmentObject],
      hashTags: hashTags && hashTags?.length ? hashTags : [],
      lostItemName: lostItemName ? lostItemName : null,
      countryCode: countryCode ? countryCode : null,
      mobileNumber: mobileNumber ? mobileNumber : null,
      address: address ? address : null,
      userReactions: {
        reactionIcon: sanitizedReactionId ? reactionDetails?.reactionIcon : sanitizedPostCategoryId ? postCategoryDetails?.eventIcon : null,
        reactionId: sanitizedReactionId ? sanitizedReactionId : null,
      },
      postCategory: postCategoryDetails?.eventIcon ? postCategoryDetails?.eventIcon : null,
      postCategoryId: sanitizedPostCategoryId ? sanitizedPostCategoryId : null,
      postType,
    });

    await newEventPost.save();

    if (helper.toBoolean(isDirectAdminPost) === false && userEventPost) {
      userEventPost.adminCreatedPostId = newEventPost?._id;
      userEventPost.status = enums?.eventPostStatusEnum?.APPROVED;
      userEventPost.attachmentId = eventTimeFileId
      await userEventPost.save();
      // sendPostApproveAndRejectNotification(userEventPost.userId, enums.eventPostStatusEnum.APPROVED);
    }

    // const notificationResults = await sendEventNotifications({
    //   _id: newEventPost._id,
    //   latitude: newEventPost.latitude,
    //   longitude: newEventPost.longitude,
    //   title: newEventPost.title,
    //   description: newEventPost.description ? newEventPost?.description : newEventPost.title,
    //   eventTypeId: newEventPost.postCategoryId,
    //   attachment: gallaryThumbnailFileUrl ? gallaryThumbnailFileUrl : null,
      // attachments: [{ attachment: gallaryAttachmentFileUrl }]
    // }, "eventPost");

    // const sendSuccessNotificationList = notificationResults?.filter((notification)=> notification.status === "success")

    // newEventPost.notifiedUserCount = sendSuccessNotificationList?.length || 0;
    await newEventPost.save();

    
    if (adminPostDraftId) {
      await DraftAdminEventPost.findByIdAndDelete(adminPostDraftId);
    }

    const filteredData = filterEventPostData([newEventPost]);

    return apiResponse({
      res,
      status: true,
      message: "Event post created successfully.",
      statusCode: StatusCodes.CREATED,
      data: filteredData[0],
    });
  } catch (error) {
    console.log(error);
    
    return apiResponse({
      res,
      status: false,
      message: "Failed to create event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const updateAdminEventPostText = async (req, res) => {
  const {
    eventPostId,
    title,
    additionalDetails,
    hashTags,
    address
  } = req.body;

  // Validate event ID
  if (!mongoose.Types.ObjectId.isValid(eventPostId)) {
    return apiResponse({
      res,
      status: false,
      message: "Invalid Event ID",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    // Find and update the event post
    const updatedEventPost = await AdminEventPost.findByIdAndUpdate(
      eventPostId,
      {
        title,
        additionalDetails,
        hashTags: Array.isArray(hashTags) ? hashTags : hashTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        address
      },
      { new: true, runValidators: true }
    );

    if (!updatedEventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Log the activity
    await ActivityLogger.log({
      level: 'INFO',
      type: 'ADMIN',
      action: 'EVENT_UPDATED',
      message: `Admin updated event: ${title}`,
      adminId: req.user.id,
      entityId: eventPostId,
      metadata: {
        updatedFields: ['title', 'additionalDetails', 'hashTags', 'address']
      }
    });

    return apiResponse({
      res,
      status: true,
      message: "Event updated successfully",
      statusCode: StatusCodes.OK,
      data: updatedEventPost,
    });
  } catch (error) {
    console.log("Error updating event post:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to update event post",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const updateAdminEventPost = async (req, res) => {
  const {
    eventPostId,
    latitude,
    longitude,
    title,
    description,
    address,
    eventTime,
    hashTags,
    commentCounts,
    reactionCounts,
    sharedCount,
    viewCounts,
    reactionId,
    postCategoryId,
    lostItemName,
    countryCode,
    mobileNumber,
  } = req.body;

  let timeLineAttachments = req.body.timeLineAttachments; 

  if (typeof timeLineAttachments === 'string') {
      timeLineAttachments = JSON.parse(timeLineAttachments);
  }

  const { gallaryAttachment, gallaryThumbnail } = req.files;

  // Validate event ID
  if (!mongoose.Types.ObjectId.isValid(eventPostId)) {
    return apiResponse({
      res,
      status: false,
      message: "Invalid Event ID",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    // Fetch existing event post
    const existingEventPost = await AdminEventPost.findById({_id: eventPostId});
    if (!existingEventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    let gallaryAttachmentFileUrl = null;
    let gallaryThumbnailFileUrl = null

    if (gallaryAttachment) {
      const isDefaultAttachment = (existingEventPost.attachments || []).find(att => att.type === enums.eventPostTimelineTypeEnum.DEFAULT);
      if(isDefaultAttachment?.attachment){
        await helper.deleteMediaFromS3Bucket(isDefaultAttachment?.attachment)
      }
      if(isDefaultAttachment?.thumbnail){
        await helper.deleteMediaFromS3Bucket(isDefaultAttachment?.thumbnail)
      }
      gallaryAttachmentFileUrl = await helper.uploadMediaInS3Bucket(gallaryAttachment[0], config.mediaFolderEnum.EVENT_POST);
      gallaryThumbnailFileUrl = await helper.uploadMediaInS3Bucket(gallaryThumbnail[0], config.mediaFolderEnum.EVENT_POST);
    }

    // Update the fields
    existingEventPost.latitude = latitude || existingEventPost.latitude;
    existingEventPost.longitude = longitude || existingEventPost.longitude;
    existingEventPost.title = title || existingEventPost.title;
    existingEventPost.description = description || existingEventPost.description;
    existingEventPost.address = address || existingEventPost.address;
    existingEventPost.eventTime = eventTime || existingEventPost.eventTime;
    existingEventPost.hashTags = hashTags || existingEventPost.hashTags;
    existingEventPost.commentCounts = commentCounts || existingEventPost.commentCounts;
    existingEventPost.reactionCounts = reactionCounts || existingEventPost.reactionCounts;
    existingEventPost.sharedCount = sharedCount || existingEventPost.sharedCount;
    existingEventPost.viewCounts = viewCounts || existingEventPost.viewCounts;
    existingEventPost.lostItemName = lostItemName || existingEventPost.lostItemName;
    existingEventPost.countryCode = countryCode || existingEventPost.countryCode;
    existingEventPost.mobileNumber = mobileNumber || existingEventPost.mobileNumber;

    if (title || description || eventTime || gallaryAttachmentFileUrl) {
      const defaultAttachment = existingEventPost.attachments.find(att => att.type === enums.eventPostTimelineTypeEnum.DEFAULT);
      if (defaultAttachment) {
        if (title) defaultAttachment.title = title;
        if (description) defaultAttachment.description = description;
        if (eventTime) defaultAttachment.eventTime = eventTime;
        if (gallaryAttachmentFileUrl) {
           defaultAttachment.attachment = gallaryAttachmentFileUrl;
           defaultAttachment.thumbnail = gallaryThumbnailFileUrl;
        }
      }
    }

    if(postCategoryId) {
      const sanitizedPostCategoryId = extractObjectId(postCategoryId);
      const postCategoryDetails = await AdminEventType.findById({_id: sanitizedPostCategoryId});
      existingEventPost.postCategory = postCategoryDetails?.eventIcon ? postCategoryDetails?.eventIcon : null;
      existingEventPost.postCategoryId = sanitizedPostCategoryId;

      if(reactionId === null || reactionId === undefined){
        existingEventPost.userReactions = {
          reactionIcon: postCategoryDetails?.eventIcon  ? postCategoryDetails?.eventIcon : null,
        };
      }
    }

    if(reactionId) {
      const sanitizedReactionId = extractObjectId(reactionId);
      const reactionDetails = await AdminEventReaction.findById({_id: sanitizedReactionId});
      existingEventPost.userReactions = {
        reactionIcon: reactionDetails?.reactionIcon,
        reactionId: sanitizedReactionId,
      };
    }

    if (timeLineAttachments && timeLineAttachments?.length > 0) {
      (timeLineAttachments || []).forEach(item => {
        const { attachmentId, description, eventTime, address, countryCode, mobileNumber } = item;

        // Check in attachments array
        const attachment = existingEventPost.attachments.find(att => att.attachmentId === attachmentId);
        if (attachment) {
          if (description) attachment.description = description;
          if (eventTime) attachment.eventTime = eventTime;
        }

        // Check in timeLines array
        const timeLine = existingEventPost.timeLines.find(tl => tl.attachmentId === attachmentId);
        if (timeLine) {
          if (description) timeLine.description = description;
          if (eventTime) timeLine.eventTime = eventTime;
          if (address) timeLine.address = address;
          if (countryCode) timeLine.countryCode = countryCode;
          if (mobileNumber) timeLine.mobileNumber = mobileNumber;
        }
      });
    }

    // Save the updated post
    await existingEventPost.save();

    const filteredData = filterEventPostData([existingEventPost]);

    return apiResponse({
      res,
      status: true,
      message: "Event post updated successfully.",
      statusCode: StatusCodes.OK,
      data: filteredData[0],
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to update event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const deleteAdminEventPost = async (req, res) => {
  try {
    const { eventPostId } = req.params;
    const eventPost = await AdminEventPost.findById({_id: eventPostId});

    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    eventPost.deleted.isDeleted = true;
    eventPost.deleted.deletedAt = new Date();
    eventPost.deleted.deletedBy = req.user.id;

    await eventPost.save();

    return apiResponse({
      res,
      status: true,
      message: "Event post deleted successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to delete event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const addFileAndTimelineToAdminEventPost = async (req, res) => {
  const {
    eventPostId,
    userId,
    eventTime,
    description,
    isShareAnonymously,
    isSensitiveContent,
    userRequestedEventId,
    attachment,
    thumbnail,
    address,
    countryCode,
    mobileNumber,
    hashTags,
    rescueUpdateId
  } = req.body;
  const { gallaryAttachment, thumbnailAttachment } = req.files;

  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });
    const user = await User.findById({ _id: userId });

    const entitiesToValidate = [  
      { model: AdminEventPost, id: eventPostId, name: "eventPostId" },
      { model: User, id: userId, name: "userId" }
    ];
    
    if (userRequestedEventId) {
      entitiesToValidate.push({ model: EventPost, id: userRequestedEventId, name: "userRequestedEventId" });
    }

    for (const entity of entitiesToValidate) {
      if (!mongoose.Types.ObjectId.isValid(entity.id)) {
        return apiResponse({
          res,
          status: false,
          message: `${entity.name} ID is not a valid ObjectId`,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
    }

    const validationErrors = await helper.validateEntitiesExistence(entitiesToValidate);
    if (validationErrors.length > 0) {
      return apiResponse({
        res,
        status: true,
        message: validationErrors.join(", "),
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    let fileUrl = null;
    let thumbnailUrl = null;
    if (attachment === undefined) {
      fileUrl = await helper.uploadMediaInS3Bucket(gallaryAttachment[0], config.mediaFolderEnum.EVENT_POST);
      thumbnailUrl = thumbnail ? null : await helper.uploadMediaInS3Bucket(thumbnailAttachment[0], config.mediaFolderEnum.EVENT_POST);
    } else {
      fileUrl = attachment;
      thumbnailUrl = thumbnail;
    }

    const now = new Date();
    const eventTimeFileId = helper.formatDateToString(now);

    const attachmentObject = {
      userId,
      title: eventPost.title,
      eventTime,
      description,
      attachment: fileUrl,
      attachmentId: eventTimeFileId,
      ...(helper.toBoolean(isShareAnonymously) === false && { name: user.name }),
      ...(helper.toBoolean(isShareAnonymously) === false && {
        profilePicture: user.profilePicture,
      }),
      type: enums.eventPostTimelineTypeEnum.TIMELINE_WITH_UPLOAD,
      isShareAnonymously,
      isSensitiveContent,
      thumbnail: thumbnailUrl ? thumbnailUrl : null,
    };

    const timelineAttachObj = {
      eventTime,
      description,
      attachmentId: eventTimeFileId,
      address: address ? address : null,
      countryCode: countryCode ? countryCode : null,
      mobileNumber: mobileNumber ? mobileNumber : null,
    };

    eventPost.attachments.push(attachmentObject);
    eventPost.timeLines.push(timelineAttachObj);

    if (hashTags && Array.isArray(hashTags)) {
      const existingHashTags = eventPost.hashTags || [];
      eventPost.hashTags = [...new Set([...existingHashTags, ...hashTags])];
    }

    if(rescueUpdateId) {
      const rescueUpdate = eventPost.rescueUpdates?.find(update => update._id.toString() === rescueUpdateId);
  
      if (!rescueUpdate) {
        return apiResponse({
          res,
          status: false,
          message: "Rescue update not found.",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
  
      rescueUpdate.status = enums.eventPostStatusEnum.APPROVED;
    }

    await eventPost.save();

    await sendEventNotifications({
      _id: eventPost._id,
      latitude: eventPost.latitude,
      longitude: eventPost.longitude,
      title: eventPost.title,
      description: description,
      eventTypeId: eventPost.postCategoryId,
      attachment: thumbnailUrl ? thumbnailUrl : null,
      // attachments: [{ attachment: gallaryAttachmentFileUrl }]
    }, "eventPostTimeline");

    if(userRequestedEventId){
      let userEventPost = await EventPost.findById({ _id: userRequestedEventId });
      userEventPost.adminCreatedPostId = userRequestedEventId;
      userEventPost.attachmentId = eventTimeFileId;
      userEventPost.status = enums.eventPostStatusEnum.APPROVED;
      await userEventPost.save();
    }


    const filteredData = filterEventPostData([eventPost]);

    return apiResponse({
      res,
      status: true,
      message: "Timeline added to event post successfully.",
      statusCode: StatusCodes.OK,
      data: filteredData[0],
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to add timeline to event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const uploadFileToAdminEventPost = async (req, res) => {
  const { eventPostId, isSensitiveContent } = req.body;
  const { gallaryAttachment, thumbnailAttachment } = req.files;

  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });
    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    const fileUrl = await helper.uploadMediaInS3Bucket(gallaryAttachment[0], config.mediaFolderEnum.EVENT_POST);
    const thumbnailUrl = await helper.uploadMediaInS3Bucket(thumbnailAttachment[0], config.mediaFolderEnum.EVENT_POST);

    const now = new Date();
    const eventTimeFileId = helper.formatDateToString(now);

    const attachmentObject = {
      userId: null,
      title: eventPost.title,
      eventTime: null,
      description: null,
      attachment: fileUrl,
      attachmentId: eventTimeFileId,
      name: "Awaaz",
      type: enums.eventPostTimelineTypeEnum.UPLOAD,
      profilePicture: null,
      isShareAnonymously: false,
      isSensitiveContent,
      thumbnail: thumbnailUrl ? thumbnailUrl : null,
    };

    eventPost.attachments.push(attachmentObject);

    await eventPost.save();

    const filteredData = filterEventPostData([eventPost]);

    return apiResponse({
      res,
      status: true,
      message: "File added to event post successfully.",
      statusCode: StatusCodes.OK,
      data: filteredData[0],
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to add file to event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const updateTimelineToAdminEventPost = async (req, res) => {
  const {
    eventPostId,
    attachmentId,
    description,
    eventTime,
    address,
    hashTags,
  } = req.body;

  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });
    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    let newGenerateAttachmentId = null
    if(!attachmentId) {
      newGenerateAttachmentId = helper.formatDateToString(new Date());
    }

    const timelineAttachObj = {
      eventTime,
      description,
      attachmentId: attachmentId ? attachmentId : newGenerateAttachmentId,
      address: address ? address : null,
      countryCode: null,
      mobileNumber: null,
    };


    if(attachmentId){
      eventPost.attachments.find((attachment) => attachment.attachmentId === attachmentId).description = description;
      eventPost.attachments.find((attachment) => attachment.attachmentId === attachmentId).type = enums.eventPostTimelineTypeEnum.TIMELINE;
    }

    eventPost.timeLines.push(timelineAttachObj);

    if (hashTags && Array.isArray(hashTags)) {
      const existingHashTags = eventPost.hashTags || [];
      eventPost.hashTags = [...new Set([...existingHashTags, ...hashTags])];
    }

    await eventPost.save();

    await sendEventNotifications({
      _id: eventPost._id,
      latitude: eventPost.latitude,
      longitude: eventPost.longitude,
      title: eventPost.title,
      description: description,
      eventTypeId: eventPost.postCategoryId,
      attachment: eventPost?.attachments[0]?.thumbnail || null,
      // attachments: [{ attachment: gallaryAttachmentFileUrl }]
    }, "eventPostTimeline");

    const filteredData = filterEventPostData([eventPost]);

    return apiResponse({
      res,
      status: true,
      message: "Timeline updated successfully.",
      statusCode: StatusCodes.OK,
      data: filteredData[0],
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to update timeline.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getOnlyUploadedFilesToAdminPost = async (req, res) => {
  const { eventPostId } = req.params;
  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });
    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const uploadedFiles = eventPost.attachments.filter(
      (attachment) => attachment.type === enums.eventPostTimelineTypeEnum.UPLOAD
    );

    const filterUploadedFiles = uploadedFiles.map((file) => {
      return {
        attachment: file.attachment,
        thumbnail: file.thumbnail,
        attachmentId: file.attachmentId
      };
    });

    return apiResponse({
      res,
      status: true,
      message: "Uploaded files fetched successfully.",
      statusCode: StatusCodes.OK,
      data: filterUploadedFiles,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to get uploaded files.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const updateUserRequestedEventPostStatus = async (req, res) => {
  const { eventPostId, status, isSendNotification = true } = req.body;
  const adminId = req.user.id; // Get admin ID from authenticated user

  try {
    const eventPost = await EventPost.findById({ _id: eventPostId });

    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // If approving, create AdminEventPost and set required fields
    if (status === enums.eventPostStatusEnum.APPROVED) {
      // Get user details for the post
      const user = await User.findById(eventPost.userId);
      
      // Get post category details if exists
      let postCategoryDetails = null;
      if (eventPost.postCategoryId) {
        postCategoryDetails = await AdminEventType.findById(eventPost.postCategoryId);
      }

      // Generate attachmentId using current timestamp
      const now = new Date();
      const eventTimeFileId = helper.formatDateToString(now);

      // Create attachment object for AdminEventPost
      const attachmentObject = {
        userId: eventPost.userId,
        title: eventPost.title,
        eventTime: eventPost.eventTime,
        description: eventPost.additionalDetails || null,
        attachment: eventPost.attachment,
        attachmentId: eventTimeFileId,
        name: eventPost.shareAnonymous ? null : (user?.name || null),
        type: enums.eventPostTimelineTypeEnum.DEFAULT,
        profilePicture: eventPost.shareAnonymous ? null : (user?.profilePicture || null),
        isShareAnonymously: eventPost.shareAnonymous || false,
        isSensitiveContent: false,
        thumbnail: eventPost.thumbnail || null
      };

      // Create the AdminEventPost
      const newAdminEventPost = new AdminEventPost({
        adminId: adminId, // Use the approving admin's ID
        longitude: eventPost.longitude,
        latitude: eventPost.latitude,
        title: eventPost.title,
        description: eventPost.additionalDetails || null,
        eventTime: eventPost.eventTime,
        attachments: [attachmentObject],
        hashTags: eventPost.hashTags || [],
        lostItemName: eventPost.lostItemName || null,
        countryCode: eventPost.countryCode || null,
        mobileNumber: eventPost.additionMobileNumber || null,
        address: eventPost.address || null,
        userReactions: {
          reactionIcon: postCategoryDetails?.eventIcon || null,
          reactionId: null,
        },
        postCategory: postCategoryDetails?.eventIcon || null,
        postCategoryId: eventPost.postCategoryId || null,
        postType: eventPost.postType,
      });

      await newAdminEventPost.save();

      // Update EventPost with adminCreatedPostId and attachmentId
      eventPost.adminCreatedPostId = newAdminEventPost._id;
      eventPost.attachmentId = eventTimeFileId;
      eventPost.status = status;
      await eventPost.save();

      // Log post approval
      ActivityLogger.logPost('POST_APPROVED', 'Admin approved user post', eventPost.userId, eventPostId, {
        adminId,
        postType: eventPost.postType,
        postTitle: eventPost.title,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      console.log(`Created AdminEventPost ${newAdminEventPost._id} for EventPost ${eventPostId} by admin ${adminId}`);
    } else {
      // For Pending or Rejected status, just update the status
      eventPost.status = status;
      await eventPost.save();

      // Log post rejection/pending
      const action = status === enums.eventPostStatusEnum.REJECTED ? 'POST_REJECTED' : 'POST_PENDING';
      ActivityLogger.logPost(action, `Admin ${action.replace(/_/g, ' ').toLowerCase()} user post`, eventPost.userId, eventPostId, {
        adminId,
        postType: eventPost.postType,
        postTitle: eventPost.title,
        status,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    if (helper.toBoolean(isSendNotification) === true) {
      const notificationResult = await sendPostApproveAndRejectNotification(eventPost.userId, status === enums.eventPostStatusEnum.APPROVED);
      
      // Still return success even if notification fails
      return apiResponse({
        res,
        status: true,
        message: "Event post status updated successfully.",
        statusCode: StatusCodes.OK,
        notificationStatus: notificationResult.success
      });
    }

    return apiResponse({
      res,
      status: true,
      message: "Event post status updated successfully.",
      statusCode: StatusCodes.OK,
    });

  } catch (error) {
    console.log("Error in updateUserRequestedEventPostStatus:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to update event post status.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getAdminEventPosts = async (req, res) => {  
  const { postType } = req.params;
  const { search, page = 1, limit = 10, status } = req.query;
  try {
    let filter = {};
    
    // Filter by postType if provided
    if (postType) filter.postType = postType;
    
    // Optional status filter
    if (status) filter.status = status;
    
    // Apply search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Log final MongoDB query for debugging
    console.log('Final MongoDB filter:', JSON.stringify(filter, null, 2));

    const { skip, limit: parsedLimit } = paginationFun({ page, limit });
    const totalItems = await EventPost.countDocuments(filter);
    const eventPost = await EventPost.find(filter)
      .skip(skip)
      .limit(parsedLimit)
      .sort({ createdAt: -1 });

    console.log(`Found ${totalItems} events matching filter`);

    const pagination = paginationDetails({
      page,
      totalItems,
      limit: parsedLimit,
    });

    const filterEventPost = await Promise.all(
      eventPost.map(async (event) => {
        const user = await User.findById(event.userId);
        
        // Get category name if postCategoryId exists
        let postCategory = null;
        if (event.postCategoryId) {
          const AdminEventType = (await import('../models/admin-event-type.model.js')).default;
          const category = await AdminEventType.findById(event.postCategoryId);
          postCategory = category?.eventName || null;
        }
        
        return {
          _id: event._id,
          status: event.status,
          postType: event.postType,
          createdAt: event.createdAt,
          postCategoryId: event.postCategoryId,
          postCategory: postCategory, // Add category name
          reactionCounts: event.reactionCounts || 0,
          commentCounts: event.commentCounts || 0,
          viewCounts: event.viewCounts || 0,
          attachment: event.attachment,
          thumbnail: event.thumbnail,
          title: event.title,
          description: event.description || event.additionalDetails, // Use additionalDetails as fallback
          address: event.address,
          name: user?.name || null,
          profilePicture: user?.profilePicture || null,
          username: user?.username || null,
          eventTime: event.eventTime,
          hashTags: event.hashTags || [],
          lostItemName: event.lostItemName,
          additionMobileNumber: event.additionMobileNumber,
          countryCode: event.countryCode,
          shareAnonymous: event.shareAnonymous,
          additionalDetails: event.additionalDetails,
          adminCreatedPostId: event.adminCreatedPostId,
          attachmentId: event.attachmentId,
        };
      })
    );

    return apiResponse({
      res,
      status: true,
      message: "Event posts fetched successfully.",
      data: {
        page: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        limit: pagination.limit,
        data: filterEventPost,
      },
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log("Error in getAdminEventPosts:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to get event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getSingleUserEventPost = async (req, res) => {
  const { eventPostId } = req.params;
  try {
    const eventPost = await EventPost.findById(eventPostId)
      .populate('postCategoryId', 'eventName eventIcon')
      .populate('userId', 'name username profilePicture');

    if (!eventPost) {
      return apiResponse({
        res,
        status: true,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
        data: null,
      });
    }

    return apiResponse({
      res,
      status: true,
      message: "Event post fetched successfully.",
      statusCode: StatusCodes.OK,
      data: eventPost,
    });
  } catch (error) {
    console.error('Error in getSingleUserEventPost:', error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to get event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getSingleAdminEventPost = async (req, res) => {
  const { postType, eventPostId } = req.params;
  try {
    let eventPost = null;
    
    // First try to find in EventPost (user submitted posts)
    eventPost = await EventPost.findById(eventPostId)
      .populate('postCategoryId', 'eventName eventIcon')
      .populate('userId', 'name username profilePicture');
    
    // If not found in EventPost, try AdminEventPost (admin created posts)
    if (!eventPost) {
      const adminPosts = await AdminEventPost.find({ _id: eventPostId, postType })
        .populate('postCategoryId', 'eventName eventIcon')
        .populate('mainCategoryId', 'eventName eventIcon')
        .populate('subCategoryId', 'eventName eventIcon')
        .populate('attachments.userId', 'name username profilePicture');
      
      if (adminPosts.length > 0) {
        eventPost = adminPosts[0];
      }
    }

    if (!eventPost) {
      return apiResponse({
        res,
        status: true,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
        data: null,
      });
    }

    // For admin posts, use the filter function
    if (eventPost.attachments) {
      const filteredData = filterEventPostData([eventPost]);
      eventPost = filteredData[0];
    }

    return apiResponse({
      res,
      status: true,
      message: "Event post fetched successfully.",
      statusCode: StatusCodes.OK,
      data: eventPost,
    });
  } catch (error) {
    console.error('Error in getSingleAdminEventPost:', error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to get event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const rejectAndPendingUserRequestedRescueUpdate = async (req, res) => {
  const { eventPostId, rescueUpdateId, rescueUpdateStatus } = req.body;

  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId});

    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const rescueUpdate = eventPost.rescueUpdates?.find(update => update._id.toString() === rescueUpdateId);

    if (!rescueUpdate) {
      return apiResponse({
        res,
        status: false,
        message: "Rescue update not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    rescueUpdate.status = rescueUpdateStatus;

    await eventPost.save();

    return apiResponse({
      res,
      status: true,
      message: "Rescue update status updated to rejected.",
      statusCode: StatusCodes.OK,
      data: null,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to update rescue update status.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getRescueUpdateListToAdminEventPost = async (req, res) => {
  const { status, eventPostId} = req.params;

  if (!eventPostId) {
    return apiResponse({
      res,
      status: false,
      message: "Event post ID is required.",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  if (!Object.values(enums.eventPostStatusEnum).includes(status)) {
    return apiResponse({
      res,
      status: false,
      message: `Invalid status. Allowed values are: ${Object.values(enums.eventPostStatusEnum).join(", ")}.`,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    const adminEventPost = await AdminEventPost.findById({_id: eventPostId});
    if (!adminEventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const filterEventPostData = await Promise.all(adminEventPost.rescueUpdates?.filter((event) => event?.status === status)
      .map(async (v) => {
        const user = await User.findById(v?.userId);
        const attachmentFileType = helper.getFileType(v?.attachment);

        return {
          _id: v?._id,
          latitude: v?.latitude,
          longitude: v?.longitude,
          attachment: v?.attachment,
          thumbnail: v?.thumbnail,
          description: v?.description,
          address: v?.address,
          countryCode: v?.countryCode,
          eventTime: v?.eventTime,
          mobileNumber: v?.mobileNumber,
          name: user?.name,
          profilePicture: user?.profilePicture,
          username: user?.username,
          userId: user?._id,
          attachmentFileType
          };
      })
    );

    return apiResponse({
      res,
      status: true,
      message: "Rescue update fetched successfully.",
      statusCode: StatusCodes.OK,
      data: filterEventPostData,
    });
  } catch(error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to get rescue update.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const filterEventsByDistance = (events, lat, lon, distance) => {
  if (distance && (!lat || !lon)) {
    return apiResponse({
      res,
      status: false,
      message: "Latitude and longitude are required when using distance filter",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  const userLat = parseFloat(lat);
  const userLon = parseFloat(lon);
  const maxDistanceKm = parseFloat(distance);
  return events.filter(event => {
      if (!event.latitude || !event.longitude) return false;
      const eventDistance = getDistanceFromLatLonInKm(userLat, userLon, event.latitude, event.longitude);
      return eventDistance <= maxDistanceKm;
  });
};

const getFilteredAdminEventPosts = async (req, res) => {
  const { filterType } = req.params;
  const { page = 1, limit = 10, search, date, distance, lat, lon, status, category } = req.query;
  const postType = req.params.postType || req.query.postType;

  console.log("[getFilteredAdminEventPosts] params:", { postType, filterType });
  console.log("[getFilteredAdminEventPosts] query:", { page, limit, search, date, distance, lat, lon, status, category });

  try {
    const allowedPostTypes = [...Object.values(enums.eventPostTypeEnum), "EVENT", "event"];
    const normalizedPostType = postType?.toLowerCase?.() === "event" ? enums.eventPostTypeEnum.INCIDENT : postType;

    if (!normalizedPostType || !allowedPostTypes.includes(postType)) {
      return apiResponse({
        res,
        status: false,
        message: "Invalid post type",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Add category filter validation for general_category
    if (normalizedPostType === enums.eventPostTypeEnum.GENERAL_CATEGORY && category) {
      try {
        const categoryArray = JSON.parse(category);
        if (!Array.isArray(categoryArray)) {
          return apiResponse({
            res,
            status: false,
            message: "Category must be an array of IDs",
            statusCode: StatusCodes.BAD_REQUEST,
          });
        }
        // Validate each category ID
        for (const catId of categoryArray) {
          if (!mongoose.Types.ObjectId.isValid(catId)) {
            return apiResponse({
              res,
              status: false,
              message: `Invalid category ID: ${catId}`,
              statusCode: StatusCodes.BAD_REQUEST,
            });
          }
        }
      } catch (error) {
        return apiResponse({
          res,
          status: false,
          message: "Invalid category format. Must be a valid JSON array",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
    }

    // Add status validation if status is provided
    if (status && !Object.values(enums.eventPostedCurrentStatusEnum).includes(status)) {
      return apiResponse({
        res,
        status: false,
        message: "Invalid status",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const { skip, limit: parsedLimit } = paginationFun({ page, limit });
    let eventPosts = [];
    let totalItems = 0;

    // Create date filter for eventTime
    const dateFilter = {};

    if (date) {
      let dateArray = Array.isArray(date) ? date : [date];
    
      dateFilter.$or = dateArray.map((dateString) => {
        const searchDate = new Date(dateString);
    
        if (isNaN(searchDate.getTime())) {
          return apiResponse({
            res,
            status: false,
            message: "Invalid date format",
            statusCode: StatusCodes.BAD_REQUEST,
          });
        }
    
        const startOfDay = new Date(
          Date.UTC(
            searchDate.getUTCFullYear(),
            searchDate.getUTCMonth(),
            searchDate.getUTCDate(),
            0, 0, 0, 0
          )
        );
    
        const endOfDay = new Date(
          Date.UTC(
            searchDate.getUTCFullYear(),
            searchDate.getUTCMonth(),
            searchDate.getUTCDate(),
            23, 59, 59, 999
          )
        );
    
        return {
          eventTime: {
            $gte: startOfDay.toISOString(),
            $lte: endOfDay.toISOString(),
          },
        };
      });
    }

    const statusFilter = status ? { status: status } : {};

    switch (filterType) {
      case enums.eventPostStatusEnum.APPROVED:
        const approvedQuery = {
          postType: normalizedPostType,
          'deleted.isDeleted': false,
          ...statusFilter,
        };

        console.log("[getFilteredAdminEventPosts] approvedQuery:", approvedQuery);

        eventPosts = await AdminEventPost.find(approvedQuery)
        .populate('postCategoryId', 'eventName eventIcon')
        .populate('mainCategoryId', 'eventName eventIcon')
        .populate('subCategoryId', 'eventName eventIcon')
        .sort({ eventTime: -1 })

        if(distance || lat || lon ) {
          eventPosts = filterEventsByDistance(eventPosts, lat, lon, distance);
        }
        
        totalItems = eventPosts.length;
        
        eventPosts = eventPosts.slice(skip, skip + parsedLimit);
  
      break;
      case enums.eventPostStatusEnum.REJECTED:
        const rejectedQuery = {
          postType: normalizedPostType,
          status: enums.eventPostStatusEnum.REJECTED,
          ...statusFilter,
        };

        console.log("[getFilteredAdminEventPosts] rejectedQuery:", rejectedQuery);

        eventPosts = await EventPost.find(rejectedQuery)
        .populate('postCategoryId', 'eventName eventIcon')
        .populate('mainCategoryId', 'eventName eventIcon')
        .populate('subCategoryId', 'eventName eventIcon')
        .sort({ eventTime: -1 })

        if(distance || lat || lon ) {
          eventPosts = filterEventsByDistance(eventPosts, lat, lon, distance);
        } 
        
        totalItems = eventPosts.length;

        eventPosts = eventPosts.slice(skip, skip + parsedLimit);

      break;
      case enums.eventPostStatusEnum.PENDING:
        const pendingQuery = {
          postType: normalizedPostType,
          status: enums.eventPostStatusEnum.PENDING,
          ...statusFilter,
        };

        console.log("[getFilteredAdminEventPosts] pendingQuery:", pendingQuery);

        eventPosts = await EventPost.find(pendingQuery)
          .populate('postCategoryId', 'eventName eventIcon')
          .populate('mainCategoryId', 'eventName eventIcon')
          .populate('subCategoryId', 'eventName eventIcon')
          .sort({ eventTime: -1 })

          if(distance || lat || lon ) {
            eventPosts = filterEventsByDistance(eventPosts, lat, lon, distance);
          } 

          totalItems = eventPosts.length;

          eventPosts = eventPosts.slice(skip, skip + parsedLimit);
      break;
      case 'all':
        console.log("[getFilteredAdminEventPosts] CASE: all");
        console.log("[getFilteredAdminEventPosts] normalizedPostType:", normalizedPostType);
        console.log("[getFilteredAdminEventPosts] statusFilter:", statusFilter);
      
        const pendingRejectedQuery = {
          postType: normalizedPostType,
          status: {
            $in: [
              enums.eventPostStatusEnum.PENDING,
              enums.eventPostStatusEnum.REJECTED,
            ],
          },
          ...statusFilter,
        };

        console.log("[getFilteredAdminEventPosts] pendingRejectedQuery:", pendingRejectedQuery);

        // Fetch pending & rejected posts from EventPost (user submitted)
        let pendingRejectedPosts = await EventPost.find(pendingRejectedQuery)
        .populate('postCategoryId', 'eventName eventIcon')
        .populate('mainCategoryId', 'eventName eventIcon')
        .populate('subCategoryId', 'eventName eventIcon')
        .sort({ eventTime: -1 });
      
        console.log("[getFilteredAdminEventPosts] pendingRejectedPosts count:", pendingRejectedPosts.length);

        // Fetch ALL posts from AdminEventPost (admin-created/approved posts)
        // Note: AdminEventPost contains posts created by admins - they don't have a status filter
        const allApprovedQuery = {
          postType: normalizedPostType,
          'deleted.isDeleted': false,
          ...statusFilter,
        };

        console.log("[getFilteredAdminEventPosts] allApprovedQuery:", allApprovedQuery);

        let approvedPosts = await AdminEventPost.find(allApprovedQuery)
        .populate('postCategoryId', 'eventName eventIcon')
        .populate('mainCategoryId', 'eventName eventIcon')
        .populate('subCategoryId', 'eventName eventIcon')
        .sort({ eventTime: -1 });

        console.log("[getFilteredAdminEventPosts] approvedPosts (AdminEventPost) count:", approvedPosts.length);
      
        eventPosts = [...pendingRejectedPosts, ...approvedPosts]
          .sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));

        console.log("[getFilteredAdminEventPosts] total combined eventPosts:", eventPosts.length);
        
        if (distance || lat || lon) {
          eventPosts = filterEventsByDistance(eventPosts, lat, lon, distance);
        } 
        
        totalItems = eventPosts.length;
        
        eventPosts = eventPosts.slice(skip, skip + parsedLimit);
      break;
      default:
        return apiResponse({
          res,
          status: false,
          message: "Invalid filter type",
          statusCode: StatusCodes.BAD_REQUEST,
        });
    }

    const transformedData = await Promise.all(eventPosts.map(async post => {
      if (post instanceof AdminEventPost) {
        const defaultAttachment = post.attachments?.[0];
        const user = defaultAttachment?.userId ? await User.findById(extractObjectId(defaultAttachment.userId)).select('name profilePicture username') : null;
        const attachmentFileType = helper.getFileType(post?.attachments?.[0]?.attachment);

        const userEventPostList = await EventPost.find({ userId: extractObjectId(defaultAttachment?.userId) });
        const verifiedEventPosts = (userEventPostList || []).filter(eventPost => eventPost.status === enums.eventPostStatusEnum.APPROVED)

        // Extract ObjectIds from potentially populated fields
        const mainCategoryIdValue = extractObjectId(post?.mainCategoryId);
        const subCategoryIdValue = extractObjectId(post?.subCategoryId);
        const postCategoryIdValue = extractObjectId(post?.postCategoryId);

        let postGeneralCategoryDetails = null;
        let postOtherCategoryDetails = null;
        let postGeneralSubCategoryDetails = null;
        
        // If already populated, use the populated data directly; otherwise fetch
        if (post?.mainCategoryId) {
          if (typeof post.mainCategoryId === 'object' && post.mainCategoryId.eventName) {
            postGeneralCategoryDetails = post.mainCategoryId;
          } else if (mainCategoryIdValue) {
            postGeneralCategoryDetails = await AdminEventType.findById(mainCategoryIdValue);
          }
          postGeneralSubCategoryDetails = postGeneralCategoryDetails?.subCategories?.find((v) => v?._id?.toString() === subCategoryIdValue?.toString());
        }

        if (post?.postCategoryId) {
          if (typeof post.postCategoryId === 'object' && post.postCategoryId.eventName) {
            postOtherCategoryDetails = post.postCategoryId;
          } else if (postCategoryIdValue) {
            postOtherCategoryDetails = await AdminEventType.findById(postCategoryIdValue);
          }
        }

        // reactions summary
        const reactionSummary = {};
        const reactionIds = post?.userReactions?.userIds || [];
        if (Array.isArray(reactionIds) && reactionIds.length) {
          reactionSummary['like'] = reactionIds.length; // single reaction type available
        }

        return {
          _id: post._id,
          title: post.title,
          description: post.description,
          attachment: post.attachments?.[0]?.attachment || null,
          attachmentFileType,
          status: enums.eventPostStatusEnum.APPROVED,
          eventTime: post.eventTime,
          address: post.address,
          userId: extractObjectId(defaultAttachment?.userId) || null,
          name: user?.name || null,
          profilePicture: user?.profilePicture || null,
          username: user?.username || null,
          address: post?.address,
          postCategoryId: postCategoryIdValue || null,
          mainCategoryId: mainCategoryIdValue || null,
          subCategoryId: subCategoryIdValue || null,
          postCategory: {
            eventName: postOtherCategoryDetails?.eventName || null,
            notificationCategotyName: postOtherCategoryDetails?.notificationCategotyName || null,
            eventIcon: postOtherCategoryDetails?.eventIcon || null,
          },
          mainCategory: {
            eventName: postGeneralCategoryDetails?.eventName || null,
            notificationCategotyName: postGeneralCategoryDetails?.notificationCategotyName || null,
            eventIcon: postGeneralCategoryDetails?.eventIcon || null,
          },
          subCategory: {
            eventName: postGeneralSubCategoryDetails?.eventName || null,
            notificationCategotyName: postGeneralSubCategoryDetails?.notificationCategotyName || null,
            eventIcon: postGeneralSubCategoryDetails?.eventIcon || null,
          },
          thumbnail: post?.attachments?.[0]?.thumbnail || null,
          latitude: post?.latitude,
          longitude: post?.longitude,
          hashTags: post?.hashTags || [],
          isShareAnonymously: post?.shareAnonymous,
          verifiedEventCounts: helper.formatNumber(verifiedEventPosts?.length ? verifiedEventPosts?.length : 0),
          lostItemName: post?.lostItemName || null,
          countryCode: post?.countryCode || null,
          mobileNumber: post?.mobileNumber || null,
          currentStatus: post?.status || null,
          reactions: reactionSummary,
        };
      } else {
        const userIdValue = extractObjectId(post.userId);
        const user = userIdValue ? await User.findById(userIdValue).select('name profilePicture username') : null;
        const attachmentFileType = helper.getFileType(post.attachment);
        const userEventPostList = userIdValue ? await EventPost.find({ userId: userIdValue }) : [];
        const verifiedEventPosts = (userEventPostList || []).filter(eventPost => eventPost.status === enums.eventPostStatusEnum.APPROVED);

        // Extract ObjectIds from potentially populated fields
        const mainCategoryIdValue = extractObjectId(post?.mainCategoryId);
        const subCategoryIdValue = extractObjectId(post?.subCategoryId);
        const postCategoryIdValue = extractObjectId(post?.postCategoryId);

        let postGeneralCategoryDetails = null;
        let postOtherCategoryDetails = null;
        let postGeneralSubCategoryDetails = null;
        
        // If already populated, use the populated data directly; otherwise fetch
        if (post?.mainCategoryId) {
          if (typeof post.mainCategoryId === 'object' && post.mainCategoryId.eventName) {
            postGeneralCategoryDetails = post.mainCategoryId;
          } else if (mainCategoryIdValue) {
            postGeneralCategoryDetails = await AdminEventType.findById(mainCategoryIdValue);
          }
          postGeneralSubCategoryDetails = postGeneralCategoryDetails?.subCategories?.find((v) => v?._id?.toString() === subCategoryIdValue?.toString());
        }

        if (post?.postCategoryId) {
          if (typeof post.postCategoryId === 'object' && post.postCategoryId.eventName) {
            postOtherCategoryDetails = post.postCategoryId;
          } else if (postCategoryIdValue) {
            postOtherCategoryDetails = await AdminEventType.findById(postCategoryIdValue);
          }
        }

        // reactions summary placeholder
        const reactionSummary = {};

        return {
          _id: post._id,
          title: post.title ?  post.title : post.additionalDetails,
          description: post.additionalDetails || null,
          attachment: post.attachment,
          attachmentFileType,
          status: post.status,
          eventTime: post.eventTime,
          userId: userIdValue,
          name: user?.name || null,
          address: post.address,
          postCategoryId: postCategoryIdValue || null,
          mainCategoryId: mainCategoryIdValue || null,
          subCategoryId: subCategoryIdValue || null,
          postCategory: {
            eventName: postOtherCategoryDetails?.eventName || null,
            notificationCategotyName: postOtherCategoryDetails?.notificationCategotyName || null,
            eventIcon: postOtherCategoryDetails?.eventIcon || null,
          },
          mainCategory: {
            eventName: postGeneralCategoryDetails?.eventName || null,
            notificationCategotyName: postGeneralCategoryDetails?.notificationCategotyName || null,
            eventIcon: postGeneralCategoryDetails?.eventIcon || null,
          },
          subCategory: {
            eventName: postGeneralSubCategoryDetails?.eventName || null,
            notificationCategotyName: postGeneralSubCategoryDetails?.notificationCategotyName || null,
            eventIcon: postGeneralSubCategoryDetails?.eventIcon || null,
          },
          profilePicture: user?.profilePicture || null,
          username: user?.username || null,
          thumbnail: post?.thumbnail || null,
          latitude: post?.latitude,
          longitude: post?.longitude,
          hashTags: post?.hashTags || [],
          isShareAnonymously: post?.shareAnonymous,
          verifiedEventCounts: helper.formatNumber(verifiedEventPosts?.length ? verifiedEventPosts?.length : 0),
          lostItemName: post?.lostItemName || null,
          countryCode: post?.countryCode || null,
          mobileNumber: post?.additionMobileNumber || null,
          currentStatus: post?.status || null,
          reactions: reactionSummary,
        };
      }
    }));

    const pagination = paginationDetails({
      page: parseInt(page),
      totalItems,
      limit: parsedLimit,
    });

    const getAllFilterTypeCounts = async () => {
      const commonFilters = {
        postType: normalizedPostType,
      };

      let [approvedPosts, rejectedPosts, pendingPosts] = await Promise.all([
        AdminEventPost.find({
          ...commonFilters,
          'deleted.isDeleted': false,
        })
        .populate('postCategoryId', 'eventName eventIcon')
        .populate('mainCategoryId', 'eventName eventIcon')
        .populate('subCategoryId', 'eventName eventIcon'),
    
        EventPost.find({
          ...commonFilters,
          status: enums.eventPostStatusEnum.REJECTED,
        })
        .populate('postCategoryId', 'eventName eventIcon')
        .populate('mainCategoryId', 'eventName eventIcon')
        .populate('subCategoryId', 'eventName eventIcon'),
    
        EventPost.find({
          ...commonFilters,
          status: enums.eventPostStatusEnum.PENDING,
        })
        .populate('postCategoryId', 'eventName eventIcon')
        .populate('mainCategoryId', 'eventName eventIcon')
        .populate('subCategoryId', 'eventName eventIcon'),
      ]);
    
      if (distance || lat || lon) {
        approvedPosts = filterEventsByDistance(approvedPosts, lat, lon, distance);
        rejectedPosts = filterEventsByDistance(rejectedPosts, lat, lon, distance);
        pendingPosts = filterEventsByDistance(pendingPosts, lat, lon, distance);
      }
    
      const approvedCount = approvedPosts.length;
      const rejectedCount = rejectedPosts.length;
      const pendingCount = pendingPosts.length;
      const totalCounts = approvedCount + rejectedCount + pendingCount;
    
      return { approvedCount, rejectedCount, pendingCount, totalCounts };
    };
    

    const { approvedCount, rejectedCount, pendingCount, totalCounts} = await getAllFilterTypeCounts();

    console.log("[getFilteredAdminEventPosts] FINAL transformedData length:", transformedData?.length || 0);
    console.log("[getFilteredAdminEventPosts] First 2 transformed items:", JSON.stringify(transformedData?.slice(0, 2), null, 2));

    return apiResponse({
      res,
      status: true,
      message: "Event posts fetched successfully",
      statusCode: StatusCodes.OK,
      data: {
        page: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        limit: pagination.limit,
        approvedCount,
        rejectedCount,
        pendingCount,
        totalCounts,
        data: transformedData || [],
      },
    });

  } catch (error) {
    console.error("[getFilteredAdminEventPosts] ERROR", error?.message, error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: error?.message || "Failed to fetch event posts",
    });
  }
};

const updateTimelineFileUpdateAdminEventPost = async (req, res) => {
  const { eventPostId, attachmentId } = req.body;
  const { gallaryAttachment, gallaryThumbnail } = req.files;

  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });
    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (!gallaryAttachment) {
      return apiResponse({
        res,
        status: false,
        message: "Gallery attachment is required.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    let gallaryAttachmentFileUrl = null;
    let gallaryThumbnailFileUrl = null;

    const uploadPromises = [];

    if (gallaryAttachment) {
      uploadPromises.push(helper.uploadMediaInS3Bucket(gallaryAttachment[0], config.mediaFolderEnum.EVENT_POST).then(url => gallaryAttachmentFileUrl = url));
    }
    if (gallaryThumbnail) {
      uploadPromises.push(helper.uploadMediaInS3Bucket(gallaryThumbnail[0], config.mediaFolderEnum.EVENT_POST).then(url => gallaryThumbnailFileUrl = url));
    }

    await Promise.all(uploadPromises);

    const updateAttachment = async (array) => {
      let updatedAttachment = null;

      const deletePromises = array.map(async (item) => {
        if (item.attachmentId === attachmentId && item.type !== 'default') {
          const deletePromises = [];

          if (item?.attachment && gallaryAttachmentFileUrl) {
            deletePromises.push(helper.deleteMediaFromS3Bucket(item.attachment));
          }
          if (item?.thumbnail && gallaryThumbnailFileUrl) {
            deletePromises.push(helper.deleteMediaFromS3Bucket(item.thumbnail));
          }

          await Promise.all(deletePromises);

          item.attachment = gallaryAttachmentFileUrl;
          item.thumbnail = gallaryThumbnailFileUrl;
          updatedAttachment = item;
        }
      });

      await Promise.all(deletePromises);

      return updatedAttachment;
    };

    const updatedAttachment = await updateAttachment(eventPost.attachments);

    if (!updatedAttachment) {
      return apiResponse({
        res,
        status: false,
        message: "Attachment not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    await eventPost.save();

    return apiResponse({
      res,
      status: true,
      message: "Attachment file updated successfully.",
      statusCode: StatusCodes.OK,
      data: updatedAttachment,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to update attachment file.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const deleteAttachmentFromAdminEventPost = async (req, res) => {
  const { eventPostId, timelineAndAttachmentId } = req.params;

  try {
    const eventPost = await AdminEventPost.findById({_id: eventPostId});
    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const attachment = eventPost.attachments.find(att => att.attachmentId === timelineAndAttachmentId);
    if (!attachment) {
      return apiResponse({
        res,
        status: false,
        message: "Attachment not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const deletePromises = [];
    if (attachment.attachment) {
      deletePromises.push(helper.deleteMediaFromS3Bucket(attachment.attachment));
    }
    if (attachment.thumbnail) {
      deletePromises.push(helper.deleteMediaFromS3Bucket(attachment.thumbnail));
    }

    await Promise.all(deletePromises);

    eventPost.attachments = eventPost.attachments.filter(att => att.attachmentId !== timelineAndAttachmentId);
    eventPost.timeLines = eventPost.timeLines.filter(tl => tl.attachmentId !== timelineAndAttachmentId);

    await eventPost.save();

    return apiResponse({
      res,
      status: true,
      message: "Attachment deleted successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to delete attachment.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const updateLostItemFoundStatus = async (req, res) => {
  const { eventPostId, status } = req.body;
  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });
    eventPost.status = status;
    await eventPost.save();

    apiResponse({
      res,
      status: true,
      message: "Event post status updated successfully.",
      statusCode: StatusCodes.OK,
      data: null
    })
  } catch (error) {
    apiResponse({
      res,
      status: false,
      message: "Failed to update event post status.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      data: null
    })
  }
}

export const getRescuePendingUpdateCount = async (req, res) => {
  try {
    const rescuePosts = await AdminEventPost.find({
      postType: enums.eventPostTypeEnum.RESCUE,
      'deleted.isDeleted': false
    }, { rescueUpdates: 1 });

    let pendingCount = 0;
    

    for (const post of rescuePosts) {
      const pendingUpdates = post.rescueUpdates.filter(update => update.status === enums.eventPostStatusEnum.PENDING);
      pendingCount += pendingUpdates.length;
    }

    apiResponse({
      res,
      status: true,
      message: "Pending rescue update count fetched successfully.",
      statusCode: StatusCodes.OK,
      data: { pendingCount }
    });

  } catch (error) {
    apiResponse({
      res,
      status: false,
      message: "Failed to fetch pending rescue update count.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      data: null
    });
  }
};

const bulkCreatePostByAdmin = async (req, res) => {
  try {
    const createdPostIds = [];

    // Step 1: Upload the media files just once
    const gallaryAttachment = req.files?.gallaryAttachment;
    const gallaryThumbnail = req.files?.gallaryThumbnail;

    if (!gallaryAttachment?.[0] || !gallaryThumbnail?.[0]) {
      return res.status(400).json({
        status: false,
        message: 'Attachment and Thumbnail are required files.',
      });
    }

    const attachmentUrl = await helper.uploadMediaInS3Bucket(
      gallaryAttachment[0],
      config.mediaFolderEnum.TEST_FOLDER
    );

    const thumbnailUrl = await helper.uploadMediaInS3Bucket(
      gallaryThumbnail[0],
      config.mediaFolderEnum.TEST_FOLDER
    );

    // Step 2: Fetch latest post title to get the last count
    const latestPost = await AdminEventPost.findOne({ title: /Airplane crash at Ahmedabad #/ })
      .sort({ createdAt: -1 })
      .select("title");

    let lastCount = 0;
    if (latestPost && latestPost.title) {
      const match = latestPost.title.match(/#(\d+)/);
      if (match) {
        lastCount = parseInt(match[1], 10);
      }
    }

    // Step 3: Create 5000 posts
    for (let i = 0; i < 5000; i++) {
      const currentCount = lastCount + i + 1;

      const mockReq = {
        body: {
          postType: 'incident',
          latitude: 21.325235,
          longitude: 72.23423,
          title: `Airplane crash at Ahmedabad #${currentCount}`,
          description: `Airplane crash at Ahmedabad at Medical hostel. Event ${currentCount}`,
          eventTime: new Date(),
          address: 'Ahmedabad',
          isShareAnonymously: false,
          isSensitiveContent: true,
          postCategoryId: '67ac24077ad841f38bb9d5ae',
          isDirectAdminPost: true,
          hashTags: ['#sir'],
          attachment: attachmentUrl,
          thumbnail: thumbnailUrl,
        },
        files: {
          gallaryAttachment: '',
          gallaryThumbnail: '',
        },
        user: {
          id: '68411ef048e50bbe51a741d2',
        },
      };

      let responseData = {};

      const mockRes = {
        status: function (statusCode) {
          responseData.statusCode = statusCode;
          return this;
        },
        json: function (data) {
          responseData.data = data;
        },
      };

      await createAdminEventPost(mockReq, mockRes);

      if (responseData?.data?._id) {
        createdPostIds.push(responseData.data._id);
      }

      if (i % 100 === 0) {
        console.log(`✅ Created post #${currentCount}`);
      }
    }

    return res.status(201).json({
      status: true,
      message: '5000 posts created successfully.',
      createdCount: createdPostIds.length,
      createdPostIds: createdPostIds.slice(0, 10), // return only first 10 IDs
    });
  } catch (error) {
    console.error('❌ Bulk post creation failed:', error);
    return res.status(500).json({
      status: false,
      message: 'Bulk post creation failed.',
      error: error.message,
    });
  }
};

const permanentDeletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const isExist = await AdminEventPost.findById(postId);
    if (!isExist) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        data: null,
        message: "Post not found.",
      });
    }

    await EventPost.findOneAndDelete({adminCreatedPostId: postId});
    await Report.deleteMany({postId: postId});
    await Notification.updateMany(
      { "notifications.eventId": postId },
      { $pull: { notifications: { eventId: postId } } }
    );
    await User.updateMany(
      {
        $or: [
          { savedEventPosts: postId },
          { eventPostNotificationOnIds: postId },
        ],
      },
      {
        $pull: {
          savedEventPosts: postId,
          eventPostNotificationOnIds: postId,
        },
      }
    );
    await AdminEventPost.findByIdAndDelete(postId);

    return apiResponse({
      res,
      status: true,
      message: "Post deleted successfully.",
      statusCode: StatusCodes.OK,
      data: null,
    });
  } catch (error) {
    console.log("error", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to delete event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const simpleDeletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Find and delete the post
    const deletedPost = await AdminEventPost.findByIdAndDelete(postId);

    if (!deletedPost) {
      return apiResponse({
        res,
        status: false,
        message: "Post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Clean up related data
    await EventPost.findOneAndDelete({ adminCreatedPostId: postId });
    await Report.deleteMany({ postId: postId });
    await Notification.updateMany(
      { "notifications.eventId": postId },
      { $pull: { notifications: { eventId: postId } } }
    );
    await User.updateMany(
      {
        $or: [
          { savedEventPosts: postId },
          { eventPostNotificationOnIds: postId },
        ],
      },
      {
        $pull: {
          savedEventPosts: postId,
          eventPostNotificationOnIds: postId,
        },
      }
    );

    return apiResponse({
      res,
      status: true,
      message: "Post deleted successfully.",
      statusCode: StatusCodes.OK,
      data: deletedPost,
    });
  } catch (error) {
    console.log("error", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to delete event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export default {
  createAdminEventPost,
  updateAdminEventPost,
  updateAdminEventPostText,
  deleteAdminEventPost,
  getAdminEventPosts,
  addFileAndTimelineToAdminEventPost,
  uploadFileToAdminEventPost,
  updateTimelineToAdminEventPost,
  getOnlyUploadedFilesToAdminPost,
  updateUserRequestedEventPostStatus,
  getSingleUserEventPost,
  getSingleAdminEventPost,
  rejectAndPendingUserRequestedRescueUpdate,
  getRescueUpdateListToAdminEventPost,
  getFilteredAdminEventPosts,
  updateTimelineFileUpdateAdminEventPost,
  deleteAttachmentFromAdminEventPost,
  updateLostItemFoundStatus,
  getRescuePendingUpdateCount,
  bulkCreatePostByAdmin,
  permanentDeletePost,
  simpleDeletePost
};
