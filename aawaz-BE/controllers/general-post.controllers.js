import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import User from "../models/user.model.js";
import EventPost from "../models/event-post.model.js";
import helper from "../helper/common.js";
import DraftEventPost from "../models/event-post-draft.model.js";
import config from "../config/config.js";
import AdminEventType from "../admin-panel/models/admin-event-type.model.js";

const createUserGeneralPost = async (req, res) => {
  const {
    longitude,
    latitude,
    additionalDetails,
    hashTags,
    shareAnonymous,
    postType,
    eventTime,
    title,
    address,
    attachmentUrl,
    thumbnailUrl,
    userPostDraftId,
    mainCategoryId,
    subCategoryId,
  } = req.body;
  const userId = req.user.id;
  const { attachment, thumbnail } = req.files;

  const user = await User.findById({ _id: userId });

  if (!user) {
    return apiResponse({
      res,
      status: false,
      message: "User not found.",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }

  if (!attachment && !attachmentUrl) {
    return apiResponse({
      res,
      status: false,
      message: "attachment is required",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  if (!thumbnail && !thumbnailUrl) {
    return apiResponse({
      res,
      status: false,
      message: "thumbnail is required",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  const mainCategory = await AdminEventType.findById(mainCategoryId);
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

  const subCategoryExists = mainCategory.subCategories.some(
    (subCat) => subCat._id.toString() === subCategoryId
  );

  if (!subCategoryExists) {
    return apiResponse({
      res,
      status: false,
      message: "Subcategory not found.",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    let attachmentGeneratedUrl = attachmentUrl;
    let thumbnailGeneratedUrl = thumbnailUrl;

    if (attachment) {
      attachmentGeneratedUrl = await helper.uploadMediaInS3Bucket(
        attachment[0],
        config.mediaFolderEnum.EVENT_POST
      );
    }
    if (thumbnail) {
      thumbnailGeneratedUrl = await helper.uploadMediaInS3Bucket(
        thumbnail[0],
        config.mediaFolderEnum.EVENT_POST
      );
    }

    const newEventPost = new EventPost({
      userId,
      longitude,
      latitude,
      eventTime,
      mainCategoryId,
      subCategoryId,
      additionalDetails,
      hashTags: hashTags ? hashTags : [],
      attachment: attachmentGeneratedUrl,
      thumbnail: thumbnailGeneratedUrl,
      shareAnonymous,
      postType,
      title: title ? title : null,
      address: address ? address : null,
    });

    await newEventPost.save();

    if (userPostDraftId) {
      await DraftEventPost.findByIdAndDelete(userPostDraftId);
    }

    return apiResponse({
      res,
      status: true,
      message: "General post created successfully.",
      statusCode: StatusCodes.CREATED,
      data: newEventPost,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to create event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export default {
  createUserGeneralPost,
};
