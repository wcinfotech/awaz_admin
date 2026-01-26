import mongoose from "mongoose";
import enums from "../config/enum.js";

const eventPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    eventTime: {
      type: String,
      required: true,
    },
    attachment: {
      type: String,
      default: null,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    postCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminEventType",
      default: null,
    },
    hashTags: {
      type: Array,
      default: [],
    },
    title: {
      type: String,
      default: null,
    },
    additionalDetails: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    shareAnonymous: {
      type: Boolean,
      default: false,
    },
    lostItemName: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(enums.eventPostStatusEnum),
      default: enums.eventPostStatusEnum.PENDING,
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
    adminCreatedPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminEventPost",
      default: null,
    },
    countryCode: {
      type: String,
      default: null,
    },
    attachmentId: { type: String, default: null },
    additionMobileNumber: {
      type: String,
      default: null,
    },
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

const EventPost = mongoose.model("EventPost", eventPostSchema);

export default EventPost;
