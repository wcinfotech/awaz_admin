import mongoose from 'mongoose';

const deviceTokenSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
    },
    deviceToken: { 
        type: String, 
        required: true,
        index: true
    },
    deviceId: { 
        type: String, 
        required: true,
        index: true
    },
    platform: { 
        type: String, 
        enum: ['android', 'ios', 'web'], 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true,
        index: true
    },
    lastActiveAt: { 
        type: Date, 
        default: Date.now 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
deviceTokenSchema.index({ userId: 1, isActive: 1 });
deviceTokenSchema.index({ deviceId: 1, isActive: 1 });

// Static method to get all active device tokens
deviceTokenSchema.statics.getActiveTokens = function() {
    return this.find({ isActive: true })
        .populate('userId', 'name email')
        .sort({ lastActiveAt: -1 });
};

// Static method to get tokens by user
deviceTokenSchema.statics.getTokensByUser = function(userId) {
    return this.find({ userId, isActive: true })
        .sort({ lastActiveAt: -1 });
};

// Static method to deactivate token
deviceTokenSchema.statics.deactivateToken = function(deviceToken) {
    return this.updateOne(
        { deviceToken },
        { isActive: false, lastActiveAt: new Date() }
    );
};

// Static method to cleanup old inactive tokens
deviceTokenSchema.statics.cleanupOldTokens = function(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return this.deleteMany({
        isActive: false,
        lastActiveAt: { $lt: cutoffDate }
    });
};

const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);

export default DeviceToken;
