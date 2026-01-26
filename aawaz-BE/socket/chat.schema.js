import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [
      {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        read: { type: Boolean, default: false } 
      }
    ],
    requestTab: { type: String, enum: ['chat', 'request'], default: 'request' },
    requestStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true, versionKey: false }
);

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
