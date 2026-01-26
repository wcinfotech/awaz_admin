import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../../helper/apiResponse.js";
import helper from "../../helper/common.js";
import DraftAdminEventPost from "../../admin-panel/models/admin-event-post-draft.model.js";
import config from "../../config/config.js";

const createAdminDraftEventPost = async (req, res) => {
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
    mainCategoryId,
    subCategoryId,
    postType,
    isSensitiveContent,
    isShareAnonymously,
    attachment,
    thumbnail,
    userId,
    userRequestedEventId,
  } = req.body;

  const adminId = req.user.id;
  const { gallaryAttachment, gallaryThumbnail } = req.files;

  try {
    let gallaryAttachmentFileUrl = null;
    if (gallaryAttachment && gallaryAttachment[0]) {
      gallaryAttachmentFileUrl = await helper.uploadMediaInS3Bucket(gallaryAttachment[0], config.mediaFolderEnum.DRAFT_ADMIN_POST);
    } else {
      gallaryAttachmentFileUrl = attachment ? attachment : null;
    }

    let gallaryThumbnailFileUrl = null;
    if (gallaryThumbnail && gallaryThumbnail[0]) {
      gallaryThumbnailFileUrl = await helper.uploadMediaInS3Bucket(gallaryThumbnail[0], config.mediaFolderEnum.DRAFT_ADMIN_POST);
    } else {
      gallaryThumbnailFileUrl = thumbnail;
    }

    const newDraft = new DraftAdminEventPost({
      adminId,
      isDirectAdminPost,
      longitude,
      latitude,
      title,
      description,
      address,
      hashTags,
      reactionId,
      mainCategoryId,
      subCategoryId,
      eventTime,
      postType,
      isSensitiveContent,
      isShareAnonymously,
      attachment: gallaryAttachmentFileUrl,
      userId,
      userRequestedEventId,
      thumbnail: gallaryThumbnailFileUrl,
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
  createAdminDraftEventPost,
};
