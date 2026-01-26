import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import helper from "../helper/common.js";
import DraftEventPost from "../models/event-post-draft.model.js";
import config from "../config/config.js";

export const createUserDraftEventPost = async (req, res) => {
    const {
        longitude,
        latitude,
        additionalDetails,
        title,
        shareAnonymous,
        postType,
        lostItemName,
        countryCode,
        additionMobileNumber,
        address,
        hashTags,
        postCategoryId
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
            postType,
            shareAnonymous,
            title,
            additionalDetails,
            address,
            lostItemName,
            countryCode,
            additionMobileNumber,
            hashTags,
            postCategoryId,
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

const deleteDraftEventPost = async (req, res) => {
    const { draftId } = req.params;
    try {
        const draftEventPost = await DraftEventPost.findByIdAndDelete(draftId);

        if (!draftEventPost) {
            return apiResponse({
                res,
                status: false,
                message: "Draft event post not found.",
                statusCode: StatusCodes.NOT_FOUND,
            });
        }

        if (draftEventPost?.attachment) {
            await helper.deleteMediaFromS3Bucket(draftEventPost?.attachment)
        }

        if (draftEventPost?.thumbnail) {
            await helper.deleteMediaFromS3Bucket(draftEventPost?.thumbnail)
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

const getUserDraftEventPost = async (req, res) => {
    const userId = req.user.id;
    try {
        const draftEventPost = await DraftEventPost.find({ userId: userId }).sort({createdAt: -1});

        const filterDraftEventPostData = draftEventPost?.map((data)=>{
            return {
                _id: data?._id,
                longitude: data?.longitude,
                latitude: data?.latitude,
                attachment: data?.attachment,
                thumbnail: data?.thumbnail,
                postType: data?.postType,
                shareAnonymous: data?.shareAnonymous,
                title: data?.title,
                additionalDetails: data?.additionalDetails,
                address: data?.address,
                postCategoryId: data?.postCategoryId,
                mainCategoryId: data?.mainCategoryId || null,
                subCategoryId: data?.subCategoryId || null,
                hashTags: data?.hashTags,
                countryCode: data?.countryCode || null,
                additionMobileNumber: data?.additionMobileNumber || null,
            }
        })

        return apiResponse({
            res,
            status: true,
            message: "Draft fetched successfully.",
            statusCode: StatusCodes.OK,
            data: filterDraftEventPostData
        });
    } catch (error) {
        return apiResponse({
            res,
            status: false,
            message: "Failed to fetch drafts.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

export default {
    createUserDraftEventPost,
    deleteDraftEventPost,
    getUserDraftEventPost
};
