import mongoose from 'mongoose';

const sosEventSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        trim: true
    },
    mapLink: {
        type: String,
        required: true
    },
    contacts: [{
        phone: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['SENT', 'DELIVERED', 'FAILED'],
            default: 'SENT'
        },
        providerResponse: {
            type: String,
            trim: true
        },
        sentAt: {
            type: Date,
            default: Date.now
        },
        deliveredAt: Date,
        failedAt: Date
    }],
    overallStatus: {
        type: String,
        enum: ['SENT', 'PARTIAL_FAILED', 'FAILED', 'RESOLVED'],
        default: 'SENT'
    },
    triggeredAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: Date,
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

// Index for efficient queries
sosEventSchema.index({ userId: 1, triggeredAt: -1 });
sosEventSchema.index({ overallStatus: 1, triggeredAt: -1 });

// Method to update overall status based on contact statuses
sosEventSchema.methods.updateOverallStatus = function() {
    const contacts = this.contacts;
    const allDelivered = contacts.every(c => c.status === 'DELIVERED');
    const allFailed = contacts.every(c => c.status === 'FAILED');
    const someFailed = contacts.some(c => c.status === 'FAILED');
    
    if (allDelivered) {
        this.overallStatus = 'SENT';
    } else if (allFailed) {
        this.overallStatus = 'FAILED';
    } else if (someFailed) {
        this.overallStatus = 'PARTIAL_FAILED';
    }
};

const SosEvent = mongoose.model('SosEvent', sosEventSchema);

export default SosEvent;
