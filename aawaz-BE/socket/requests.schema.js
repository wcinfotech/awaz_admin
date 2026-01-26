import mongoose from 'mongoose';

const messageRequestSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true, versionKey: false }
);

const MessageRequest = mongoose.model('MessageRequest', messageRequestSchema);
export default MessageRequest;
