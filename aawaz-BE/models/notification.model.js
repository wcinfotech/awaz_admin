import mongoose from 'mongoose';

const userNotificationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminEventPost', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  distance: { type: Number, required: true },
  attachment: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notifications: [userNotificationSchema]
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;