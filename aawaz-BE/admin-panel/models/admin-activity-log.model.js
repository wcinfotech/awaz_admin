import mongoose from "mongoose";

const adminActivityLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGOUT",
        "EVENT_CREATED",
        "EVENT_APPROVED",
        "EVENT_REJECTED",
        "EVENT_DELETED",
        "EVENT_UPDATED",
        "USER_BLOCKED",
        "USER_UNBLOCKED",
        "USER_DELETED",
        "CATEGORY_CREATED",
        "CATEGORY_DELETED",
        "REACTION_CREATED",
        "REACTION_DELETED",
        "NOTIFICATION_SENT",
        "REPORT_RESOLVED",
        "SETTINGS_UPDATED",
        "ADMIN_CREATED",
        "ADMIN_APPROVED",
        "ADMIN_REJECTED",
        "SYSTEM_ERROR",
        "OTHER",
      ],
    },
    level: {
      type: String,
      enum: ["info", "warning", "error", "success"],
      default: "info",
    },
    type: {
      type: String,
      enum: ["auth", "event", "user", "system", "admin"],
      default: "system",
    },
    details: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index for efficient querying
adminActivityLogSchema.index({ adminId: 1, createdAt: -1 });
adminActivityLogSchema.index({ action: 1 });
adminActivityLogSchema.index({ level: 1 });
adminActivityLogSchema.index({ type: 1 });
adminActivityLogSchema.index({ createdAt: -1 });

const AdminActivityLog = mongoose.model("AdminActivityLog", adminActivityLogSchema);

export default AdminActivityLog;
