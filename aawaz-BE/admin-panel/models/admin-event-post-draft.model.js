import mongoose from "mongoose";
import enums from "../../config/enum.js";

const draftAdminEventPostSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    isDirectAdminPost: { type: Boolean, default: false },
    longitude: { type: Number, required: null },
    latitude: { type: Number, required: null },
    title: { type: String, default: null },
    description: { type: String, default: null },
    lostItemName: { type: String, default: null },
    address: { type: String, default: null },
    hashTags: { type: Array, default: [] },
    mobileNumber: { type: String, default: null },
    reactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminEventReaction",
      default: null,
    },
    eventTime: { type: String, default: null },
    countryCode: { type: String, default: null },
    postCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminEventType",
      default: null,
    },
    postType: {
      type: String,
      enum: [
        enums.eventPostTypeEnum.INCIDENT,
        enums.eventPostTypeEnum.RESCUE,
        enums.eventPostTypeEnum.GENERAL_CATEGORY,
      ],
      default: enums.eventPostTypeEnum.INCIDENT,
    },
    isSensitiveContent: { type: Boolean, default: false },
    isShareAnonymously: { type: Boolean, default: false },
    attachment: { type: String, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userRequestedEventId: { type: String, default: null },
    thumbnail: { type: String, default: null },
    mainCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminEventType",
      default: null,
    },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminEventType",
      default: null,
    },
  },
  { timestamps: true }
);

const DraftAdminEventPost = mongoose.model(
  "DraftAdminEventPost",
  draftAdminEventPostSchema
);

export default DraftAdminEventPost;
