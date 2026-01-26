import mongoose from "mongoose";

const adminEventReactionSchema = new mongoose.Schema(
  {
    reactionName: {
      type: String,
      required: true,
    },
    reactionIcon: {
      type: String,
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const AdminEventReaction = mongoose.model("AdminEventReaction", adminEventReactionSchema);
export default AdminEventReaction;