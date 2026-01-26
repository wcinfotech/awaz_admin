import mongoose from "mongoose";
import enums from "../../config/enum.js";

const schema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    otp: {
      type: Number,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: Object.values(enums.userRoleEnum),
      default: enums.userRoleEnum.ADMIN,
    },
    provider: {
      type: String,
      enum: Object.values(enums.authProviderEnum),
      default: enums.authProviderEnum.EMAIL,
    },
    mobileNumber: {
      type: String,
      default: null,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    countryCode: {
      type: String,
      default: null,
    },
    ownerApproveStatus: {
      type: String,
      enum: Object.values(enums.ownerApproveStatusEnum),
      default: enums.ownerApproveStatusEnum.PENDING,
    },
    radius : {
      type: Number,
      default: 12
    },
    fcmToken : {
      type: String,
      default: null
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const AdminUserModel = mongoose.model("AdminUser", schema);
export default AdminUserModel;
