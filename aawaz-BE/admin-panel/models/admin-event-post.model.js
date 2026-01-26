import mongoose from "mongoose";
import enums from "../../config/enum.js";

const commentReplySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comment: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
  likes: { type: Array, default: [] },
  isDeleted: { type: Boolean, default: false },
});

const userCommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comment: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
  likes: { type: Array, default: [] },
  isDeleted: { type: Boolean, default: false },
  replies: [commentReplySchema],
});

const timeLineSchema = new mongoose.Schema({
  eventTime: { type: String, default: null },
  description: { type: String, default: null },
  attachmentId: { type: String, default: null },
  address: { type: String, default: null },
  countryCode: { type: String, default: null },
  mobileNumber: { type: String, default: null },
});

const attachmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    default: null,
  },
  title: { type: String, default: null },
  eventTime: { type: String, default: null },
  description: { type: String, default: null },
  attachment: { type: String, default: null },
  attachmentId: { type: String, default: null },
  name: { type: String, default: null },
  type: { type: String, default: null },
  profilePicture: { type: String, default: null },
  isShareAnonymously: { type: Boolean, default: false },
  isSensitiveContent: { type: Boolean, default: false },
  thumbnail: { type: String, default: null },
  attachmentViewUserIds: { type: Array, default: [] },
  attachmentViewCounts: { type: Number, default: 0 },
});

const rescueUpdateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  longitude: { type: Number, required: true },
  latitude: { type: Number, required: true },
  attachment: { type: String, default: null },
  thumbnail: { type: String, default: null },
  description: { type: String, default: null },
  address: { type: String, default: null },
  countryCode: { type: String, default: null },
  mobileNumber: { type: String, default: null },
  eventTime: { type: String, default: null },
  status: {
    type: String,
    enum: Object.values(enums.eventPostStatusEnum),
    default: enums.eventPostStatusEnum.PENDING,
  },
});

const adminEventPostSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    longitude: { type: Number, required: true },
    latitude: { type: Number, required: true },
    title: { type: String, required: false, default: null },
    description: { type: String, required: false, default: null },
    eventTime: { type: String, default: null },
    userViews: { type: Array, default: [] },
    viewCounts: { type: Number, default: 0 },
    userComments: [userCommentSchema],
    commentCounts: { type: Number, default: 0 },
    reactionCounts: { type: Number, default: 0 },
    attachments: [attachmentSchema],
    hashTags: { type: Array, default: [] },
    timeLines: [timeLineSchema],
    sharedCount: { type: Number, default: 0 },
    notifiedUserCount: { type: Number, default: 0 },
    lostItemName: { type: String, default: null },
    countryCode: { type: String, default: null },
    mobileNumber: { type: String, default: null },
    address: { type: String, default: null },
    postCategory: { type: String, default: null },
    postCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminEventType",
      default: null,
    },
    userReactions: {
      type: new mongoose.Schema(
        {
          reactionIcon: { type: String, default: null },
          reactionId: { type: mongoose.Schema.Types.ObjectId, default: null },
          userIds: [
            { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
          ],
        },
        { _id: false }
      ),
      default: { reactionIcon: null, userIds: [] },
    },
    deleted: {
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
      deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdminUser",
        default: null,
      },
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
    rescueUpdates: [rescueUpdateSchema],
    status: {
      type: String,
      enum: Object.values(enums.eventPostedCurrentStatusEnum),
      default: enums.eventPostedCurrentStatusEnum.PENDING,
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

const AdminEventPost = mongoose.model("AdminEventPost", adminEventPostSchema);

export default AdminEventPost;
