import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    type: {
        type: String,
        enum: ['INFO', 'ALERT', 'WARNING', 'PROMOTION'],
        required: true,
        default: 'INFO'
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
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    totalUsers: {
        type: Number,
        default: 0
    },
    deliveredUsers: {
        type: Number,
        default: 0
    },
    failedUsers: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['SENT', 'PARTIAL_FAILED', 'FAILED'],
        default: 'SENT'
    },
    deliveryCompletedAt: Date
}, {
    timestamps: true
});

// Indexes for efficient queries
adminNotificationSchema.index({ sentAt: -1 });
adminNotificationSchema.index({ status: 1, sentAt: -1 });
adminNotificationSchema.index({ sentBy: 1, sentAt: -1 });

// Method to update delivery statistics
adminNotificationSchema.methods.updateDeliveryStats = function(delivered, failed) {
    this.deliveredUsers += delivered;
    this.failedUsers += failed;
    
    // Update status based on delivery results
    if (this.deliveredUsers === this.totalUsers) {
        this.status = 'SENT';
    } else if (this.deliveredUsers > 0) {
        this.status = 'PARTIAL_FAILED';
    } else {
        this.status = 'FAILED';
    }
    
    this.deliveryCompletedAt = new Date();
    return this.save();
};

const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);

export default AdminNotification;
