import mongoose from "mongoose";
import enums from "../config/enum.js";

const draftEventPostSchema = new mongoose.Schema(
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
    attachment: {
      type: String,
      default: null,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    postType: {
      type: String,
      enum: [
        enums.eventPostTypeEnum.INCIDENT,
        enums.eventPostTypeEnum.RESCUE,
        enums.eventPostTypeEnum.GENERAL_CATEGORY,
      ],
      required: true,
    },
    shareAnonymous: {
      type: Boolean,
      required: true,
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
    lostItemName: {
      type: String,
      default: null,
    },
    countryCode: {
      type: String,
      default: null,
    },
    additionMobileNumber: {
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

const DraftEventPost = mongoose.model("DraftEventPost", draftEventPostSchema);

export default DraftEventPost;
