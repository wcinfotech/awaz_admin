import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../../helper/apiResponse.js";
import helper from "../../helper/common.js";
import DraftAdminEventPost from "../../admin-panel/models/admin-event-post-draft.model.js";
import UserModel from "../../models/user.model.js";
import config from "../../config/config.js";
import enums from  "../../config/enum.js";
import AdminEventType from "../models/admin-event-type.model.js";
import mongoose from "mongoose";

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

const createAdminDraftEventPost = async (req, res) => {
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
        thumbnail,
        userId,
        userRequestedEventId,
    } = req.body;

    const adminId = req.user.id;
    const { gallaryAttachment, gallaryThumbnail } = req.files;

    try {
        // Sanitize ObjectIds - extract plain ObjectId from potentially populated objects
        const sanitizedPostCategoryId = extractObjectId(postCategoryId);
        const sanitizedReactionId = extractObjectId(reactionId);
        
        let gallaryAttachmentFileUrl = null;
        if(gallaryAttachment && gallaryAttachment[0]){
            gallaryAttachmentFileUrl = await helper.uploadMediaInS3Bucket(gallaryAttachment[0], config.mediaFolderEnum.DRAFT_ADMIN_POST);
        } else {
            gallaryAttachmentFileUrl = attachment ? attachment : null
        }

        let gallaryThumbnailFileUrl = null;
        if(gallaryThumbnail && gallaryThumbnail[0]){
          gallaryThumbnailFileUrl = await helper.uploadMediaInS3Bucket(gallaryThumbnail[0], config.mediaFolderEnum.DRAFT_ADMIN_POST);
        } else {
          gallaryThumbnailFileUrl = thumbnail
        }
    
        const newDraft = new DraftAdminEventPost({
            adminId,
            isDirectAdminPost,
            longitude,
            latitude,
            title,
            description,
            lostItemName,
            address,
            hashTags,
            mobileNumber,
            reactionId: sanitizedReactionId,
            eventTime,
            countryCode,
            postCategoryId: sanitizedPostCategoryId,
            postType,
            isSensitiveContent,
            isShareAnonymously,
            attachment: gallaryAttachmentFileUrl,
            userId,
            userRequestedEventId,
            thumbnail: gallaryThumbnailFileUrl
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
        console.log("error", error)
        return apiResponse({
            res,
            status: false,
            message: "Failed to save draft post.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const deleteDraftAdminEventPost = async (req, res) => {
    const { draftId } = req.params;
    try {
        const draftAdminEventPost = await DraftAdminEventPost.findByIdAndDelete(draftId);

        if (!draftAdminEventPost) {
            return apiResponse({
                res,
                status: false,
                message: "Draft event post not found.",
                statusCode: StatusCodes.NOT_FOUND,
            });
        }

        if (draftAdminEventPost?.attachment) {
            await helper.deleteMediaFromS3Bucket(draftAdminEventPost?.attachment)
        }
        if(draftAdminEventPost?.thumbnail){
            await helper.deleteMediaFromS3Bucket(draftAdminEventPost?.thumbnail)
        }

        return apiResponse({
            res,
            status: true,
            message: "Draft event post deleted successfully.",
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        return apiResponse({
            res,
            status: false,
            message: "Failed to delete draft event post.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const getDraftAdminEventPost = async (req, res) => {
    const adminId = req.user.id;
    const { postType } = req.query

    console.log("[getDraftAdminEventPost] query:", req.query);
    
    try {
        const allowedPostTypes = [...Object.values(enums.eventPostTypeEnum), "EVENT", "event"];
        if (postType && !allowedPostTypes.includes(postType)) {
            return apiResponse({
                res,
                status: false,
                message: "Invalid post type",
                statusCode: StatusCodes.BAD_REQUEST,
            });
        }

        let draftEventPost = null

        const baseQuery = postType ? { adminId: adminId, postType: postType?.toLowerCase?.() === 'event' ? enums.eventPostTypeEnum.INCIDENT : postType } : { adminId: adminId };

        draftEventPost = await DraftAdminEventPost.find(baseQuery)
            .populate('postCategoryId', 'eventName eventIcon notificationCategotyName')
            .populate('mainCategoryId', 'eventName eventIcon notificationCategotyName')
            .populate('subCategoryId', 'eventName eventIcon notificationCategotyName')
            .populate('reactionId')
            .sort({createdAt: -1});

        const filterDraftEventPostData = await Promise.all(
            draftEventPost.map(async (data) => {
                let userData = null;

                if (data?.userId) {
                    userData = await UserModel.findById({_id: data.userId}).select("name profilePicture username");
                }

                const attachmentFileType = helper.getFileType(data?.attachment);

                // Extract ObjectIds - populated fields are objects, so get _id; otherwise use raw value
                const postCategoryIdValue = typeof data?.postCategoryId === 'object' && data?.postCategoryId?._id 
                    ? data.postCategoryId._id 
                    : data?.postCategoryId;
                const mainCategoryIdValue = typeof data?.mainCategoryId === 'object' && data?.mainCategoryId?._id 
                    ? data.mainCategoryId._id 
                    : data?.mainCategoryId;
                const subCategoryIdValue = typeof data?.subCategoryId === 'object' && data?.subCategoryId?._id 
                    ? data.subCategoryId._id 
                    : data?.subCategoryId;
                const reactionIdValue = typeof data?.reactionId === 'object' && data?.reactionId?._id 
                    ? data.reactionId._id 
                    : data?.reactionId;

                // Use populated data for category details (already populated by mongoose)
                const postCategoryDetails = typeof data?.postCategoryId === 'object' ? data.postCategoryId : null;
                const mainCategoryDetails = typeof data?.mainCategoryId === 'object' ? data.mainCategoryId : null;
                const subCategoryDetails = data?.subCategoryId && mainCategoryDetails?.subCategories 
                    ? mainCategoryDetails.subCategories.find((v) => v?._id?.toString() === subCategoryIdValue?.toString()) 
                    : null;

                return {
                    _id: data?._id || null,
                    isDirectAdminPost: data?.isDirectAdminPost,
                    longitude: data?.longitude || null,
                    latitude: data?.latitude || null,
                    title: data?.title || null,
                    description: data?.description || null,
                    lostItemName: data?.lostItemName || null,
                    address: data?.address || null,
                    hashTags: data?.hashTags || null,
                    mobileNumber: data?.mobileNumber || null,
                    reactionId: reactionIdValue || null,
                    eventTime: data?.eventTime || null,
                    countryCode: data?.countryCode || null,
                    postCategoryId: postCategoryIdValue || null,
                    mainCategoryId: mainCategoryIdValue || null,
                    subCategoryId: subCategoryIdValue || null,
                    postType: data?.postType || null,
                    isSensitiveContent: data?.isSensitiveContent,
                    isShareAnonymously: data?.isShareAnonymously,
                    attachment: data?.attachment || null,
                    userId: data?.userId || null,
                    userRequestedEventId: data?.userRequestedEventId || null,
                    thumbnail: data?.thumbnail || null,
                    attachmentFileType: attachmentFileType || null,
                    profilePicture: userData?.profilePicture || null,
                    name: userData?.name || null,
                    username: userData?.username || null,
                    postCategory: {
                        eventName: postCategoryDetails?.eventName || null,
                        notificationCategotyName: postCategoryDetails?.notificationCategotyName || null,
                        eventIcon: postCategoryDetails?.eventIcon || null,
                    },
                    mainCategory: {
                        eventName: mainCategoryDetails?.eventName || null,
                        notificationCategotyName: mainCategoryDetails?.notificationCategotyName || null,
                        eventIcon: mainCategoryDetails?.eventIcon || null,
                    },
                    subCategory: {
                        eventName: subCategoryDetails?.eventName || null,
                        notificationCategotyName: subCategoryDetails?.notificationCategotyName || null,
                        eventIcon: subCategoryDetails?.eventIcon || null,
                    },
                    status: enums.eventPostStatusEnum.PENDING,
                };
            })
        );

        return apiResponse({
            res,
            status: true,
            message: "Draft fetched successfully.",
            statusCode: StatusCodes.OK,
            data: filterDraftEventPostData
        });
    } catch (error) {
        console.error("[getDraftAdminEventPost] ERROR", error?.message, error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: false,
            message: error?.message || "Failed to fetch drafts.",
        });
    }
};

export default {
    createAdminDraftEventPost,
    deleteDraftAdminEventPost,
    getDraftAdminEventPost
};
