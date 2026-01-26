import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../../helper/apiResponse.js";
import AdminEventPost from "../models/admin-event-post.model.js";
import enums from "../../config/enum.js";
import config from "../../config/config.js";
import AdminEventReaction from "../models/admin-event-reaction.model.js";
import AdminEventType from "../models/admin-event-type.model.js";
import User from "../../models/user.model.js";
import { filterEventPostData } from "../../helper/filter-response.js";
import {
  sendEventNotifications,
  sendPostApproveAndRejectNotification,
} from "../services/notification.services.js";
import DraftAdminEventPost from "../models/admin-event-post-draft.model.js";
import EventPost from "../../models/event-post.model.js";
import helper from "../../helper/common.js";

// Helper function to extract ObjectId from potentially populated fields
const extractObjectId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === 'object' && value._id) {
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
    address,
    hashTags,
    reactionId,
    eventTime,
    attachment,
    thumbnail,
    userId,
    userRequestedEventId,
    adminPostDraftId,
    mainCategoryId,
    subCategoryId,
    isShareAnonymously,
    isSensitiveContent,
    postType,
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
      {
        model: EventPost,
        id: userRequestedEventId,
        name: "userRequestedEventId",
      },
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

    const validationErrors = await helper.validateEntitiesExistence(
      entitiesToValidate
    );
    if (validationErrors.length > 0) {
      return apiResponse({
        res,
        status: true,
        message: validationErrors.join(", "),
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
  }

  // Sanitize ObjectIds from potentially populated objects
  const sanitizedMainCategoryId = extractObjectId(mainCategoryId);
  const sanitizedSubCategoryId = extractObjectId(subCategoryId);
  const sanitizedReactionId = extractObjectId(reactionId);

  const mainCategory = await AdminEventType.findById(sanitizedMainCategoryId);

  console.log("mainCategory", mainCategory)
  if (!mainCategory) {
    return apiResponse({
      res,
      status: false,
      message: "Main category not found with the provided ID.",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  if (mainCategory.postType !== postType) {
    return apiResponse({
      res,
      status: false,
      message: `The selected post type (${postType}) does not match the main category's post type.`,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  const subCategoryExists = mainCategory.subCategories.find((subCat) => subCat._id.toString() === sanitizedSubCategoryId?.toString());
  console.log("subCategoryExists", subCategoryExists)
  if (!subCategoryExists) {
    return apiResponse({
      res,
      status: false,
      message: "Subcategory not found.",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    let user = null;
    let userEventPost = null;

    if (helper.toBoolean(isDirectAdminPost) === false) {
      user = await User.findById({ _id: userId });
      userEventPost = await EventPost.findById({
        _id: userRequestedEventId,
      });
    }
    let reactionDetails = null;
    if (sanitizedReactionId) {
      reactionDetails = await AdminEventReaction.findById({ _id: sanitizedReactionId });
    }

    let gallaryAttachmentFileUrl = null;
    if (gallaryAttachment && gallaryAttachment[0]) {
      gallaryAttachmentFileUrl = await helper.uploadMediaInS3Bucket(
        gallaryAttachment[0],
        config.mediaFolderEnum.EVENT_POST
      );
    } else {
      gallaryAttachmentFileUrl = attachment;
    }

    let gallaryThumbnailFileUrl = null;
    if (gallaryThumbnail && gallaryThumbnail[0]) {
      gallaryThumbnailFileUrl = await helper.uploadMediaInS3Bucket(
        gallaryThumbnail[0],
        config.mediaFolderEnum.EVENT_POST
      );
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
      name:
        helper.toBoolean(isDirectAdminPost) === true
          ? "Awaaz"
          : helper.toBoolean(isShareAnonymously) === true
          ? null
          : user?.name,
      type: enums.eventPostTimelineTypeEnum.DEFAULT,
      profilePicture:
        helper.toBoolean(isDirectAdminPost) === true
          ? null
          : helper.toBoolean(isShareAnonymously) === true
          ? null
          : user?.profilePicture,
      isShareAnonymously: helper.toBoolean(isShareAnonymously),
      isSensitiveContent: helper.toBoolean(isSensitiveContent),
      thumbnail: gallaryThumbnailFileUrl ? gallaryThumbnailFileUrl : null,
    };

    const newEventPost = new AdminEventPost({
      adminId,
      longitude,
      latitude,
      title,
      description: description ? description : null,
      eventTime,
      mainCategoryId: sanitizedMainCategoryId,
      subCategoryId: sanitizedSubCategoryId,
      attachments: [attachmentObject],
      hashTags: hashTags && hashTags?.length ? hashTags : [],
      address: address ? address : null,
      userReactions: {
        reactionIcon: sanitizedReactionId
          ? reactionDetails?.reactionIcon
          : sanitizedSubCategoryId
          ? subCategoryExists?.eventIcon
          : null,
        reactionId: sanitizedReactionId ? sanitizedReactionId : null,
      },
      postCategory: subCategoryExists?.eventIcon
        ? subCategoryExists?.eventIcon
        : null,
      postType,
    });

    await newEventPost.save();

    if (helper.toBoolean(isDirectAdminPost) === false && userEventPost) {
      userEventPost.adminCreatedPostId = newEventPost?._id;
      userEventPost.status = enums?.eventPostStatusEnum?.APPROVED;
      userEventPost.attachmentId = eventTimeFileId;
      await userEventPost.save();
      sendPostApproveAndRejectNotification(
        userEventPost.userId,
        enums.eventPostStatusEnum.APPROVED
      );
    }

    console.log("newEventPost>>>", newEventPost)

    // const notificationResults = await sendEventNotifications(
    //   {
    //     _id: newEventPost._id,
    //     latitude: newEventPost.latitude,
    //     longitude: newEventPost.longitude,
    //     title: newEventPost.title,
    //     description: newEventPost.description
    //       ? newEventPost?.description
    //       : newEventPost.title,
    //     eventTypeId: newEventPost.mainCategoryId,
    //     attachment: gallaryThumbnailFileUrl ? gallaryThumbnailFileUrl : null,
    //     // attachments: [{ attachment: gallaryAttachmentFileUrl }]
    //   },
    //   "eventPost"
    // );

    // const sendSuccessNotificationList = notificationResults?.filter(
    //   (notification) => notification.status === "success"
    // );

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
    mainCategoryId,
    subCategoryId,
  } = req.body;

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
    const existingEventPost = await AdminEventPost.findById({
      _id: eventPostId,
    });
    if (!existingEventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    let gallaryAttachmentFileUrl = null;
    let gallaryThumbnailFileUrl = null;

    if (gallaryAttachment) {
      gallaryAttachmentFileUrl = await helper.uploadMediaInS3Bucket(
        gallaryAttachment[0],
        config.mediaFolderEnum.EVENT_POST
      );
      gallaryThumbnailFileUrl = await helper.uploadMediaInS3Bucket(
        gallaryThumbnail[0],
        config.mediaFolderEnum.EVENT_POST
      );
    }

    // Update the fields
    existingEventPost.latitude = latitude || existingEventPost.latitude;
    existingEventPost.longitude = longitude || existingEventPost.longitude;
    existingEventPost.title = title || existingEventPost.title;
    existingEventPost.description =
      description || existingEventPost.description;
    existingEventPost.address = address || existingEventPost.address;
    existingEventPost.eventTime = eventTime || existingEventPost.eventTime;
    existingEventPost.hashTags = hashTags || existingEventPost.hashTags;
    existingEventPost.commentCounts =
      commentCounts || existingEventPost.commentCounts;
    existingEventPost.reactionCounts =
      reactionCounts || existingEventPost.reactionCounts;
    existingEventPost.sharedCount =
      sharedCount || existingEventPost.sharedCount;
    existingEventPost.viewCounts = viewCounts || existingEventPost.viewCounts;
    existingEventPost.mainCategoryId =
      mainCategoryId || existingEventPost.mainCategoryId;
    existingEventPost.subCategoryId =
      subCategoryId || existingEventPost.subCategoryId;

    if (title || description || eventTime || gallaryAttachmentFileUrl) {
      const defaultAttachment = existingEventPost.attachments.find(
        (att) => att.type === enums.eventPostTimelineTypeEnum.DEFAULT
      );
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

    if (reactionId) {
      const reactionDetails = await AdminEventReaction.findById({
        _id: reactionId,
      });
      existingEventPost.userReactions = {
        reactionIcon: reactionDetails?.reactionIcon,
        reactionId: reactionId,
      };
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

export default {
  createAdminEventPost,
  updateAdminEventPost,
};
