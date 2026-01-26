import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import helper from "../helper/common.js";
import DraftEventPost from "../models/event-post-draft.model.js";
import config from "../config/config.js";
import AdminEventType from "../admin-panel/models/admin-event-type.model.js";

const createUserDraftEventPost = async (req, res) => {
  const {
    longitude,
    latitude,
    additionalDetails,
    title,
    shareAnonymous,
    address,
    hashTags,
    mainCategoryId,
    subCategoryId,
    postType,
    countryCode,
    additionMobileNumber,
  } = req.body;

  const userId = req.user.id;
  const { attachment, thumbnail } = req.files;

  if (!attachment) {
    return apiResponse({
      res,
      status: false,
      message: "Attachment is required",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    const fileUrl = await helper.uploadMediaInS3Bucket(attachment[0], config.mediaFolderEnum.DRAFT_POST);
    let thumbnailUrl = null;
    if (thumbnail) {
      thumbnailUrl = await helper.uploadMediaInS3Bucket(thumbnail[0], config.mediaFolderEnum.DRAFT_POST);
    }

    const newDraft = new DraftEventPost({
      userId,
      longitude,
      latitude,
      attachment: fileUrl,
      thumbnail: thumbnailUrl,
      shareAnonymous,
      title,
      additionalDetails,
      address,
      hashTags,
      mainCategoryId,
      subCategoryId,
      postType,
      countryCode,
      additionMobileNumber,
    });

    await newDraft.save();

    return apiResponse({
      res,
      status: true,
      message: "Draft post saved successfully.",
      statusCode: StatusCodes.CREATED,
      data: newDraft,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to save draft post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export default {
  createUserDraftEventPost,
};
