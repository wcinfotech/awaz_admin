import mongoose from "mongoose";
import _enum from "../../config/enum.js";

const adminEventTypeSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
    },
    eventIcon: {
      type: String,
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    notificationCategotyName: {
      type: String,
      required: true,
    },
    postType: {
      type: String,
      enums: Object.values(_enum.eventPostTypeEnum),
      default: "",
    },
    subCategories: [
      {
        eventName: String,
        notificationCategotyName: String,
        eventIcon: String,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const AdminEventType = mongoose.model("AdminEventType", adminEventTypeSchema);
export default AdminEventType;
