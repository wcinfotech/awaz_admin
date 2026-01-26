import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    level: {
        type: String,
        required: true,
        enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
        default: 'INFO'
    },
    type: {
        type: String,
        required: true,
        enum: ['USER', 'APP', 'POST', 'COMMENT', 'NOTIFICATION', 'SYSTEM', 'ADMIN', 'REPORT', 'SOS']
    },
    action: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: 'activity_logs'
});

// Indexes for better query performance
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ level: 1, createdAt: -1 });
activityLogSchema.index({ type: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ adminId: 1, createdAt: -1 });

// Text index for search functionality
activityLogSchema.index({ 
    message: 'text', 
    action: 'text',
    'metadata.device': 'text',
    'metadata.error': 'text'
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
