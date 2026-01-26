import mongoose from 'mongoose';

const userNotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notificationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminNotification',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['INFO', 'ALERT', 'WARNING', 'PROMOTION'],
        required: true
    },
    imageUrl: {
        type: String,
        trim: true,
        default: null
    },
    deepLink: {
        type: String,
        trim: true,
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    deliveredAt: {
        type: Date,
        default: Date.now
    },
    readAt: Date,
    pushStatus: {
        type: String,
        enum: ['SENT', 'DELIVERED', 'FAILED', 'PENDING'],
        default: 'PENDING'
    },
    pushResponse: String,
    pushSentAt: Date
}, {
    timestamps: true
});

// Indexes for efficient queries
userNotificationSchema.index({ userId: 1, deliveredAt: -1 });
userNotificationSchema.index({ userId: 1, isRead: 1, deliveredAt: -1 });
userNotificationSchema.index({ notificationId: 1 });
userNotificationSchema.index({ pushStatus: 1, deliveredAt: -1 });

// Method to mark notification as read
userNotificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

// Method to update push status
userNotificationSchema.methods.updatePushStatus = function(status, response = null) {
    this.pushStatus = status;
    this.pushResponse = response;
    if (status === 'SENT') {
        this.pushSentAt = new Date();
    }
    return this.save();
};

const UserNotification = mongoose.model('UserNotification', userNotificationSchema);

export default UserNotification;
