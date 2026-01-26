import mongoose from 'mongoose';

const userSosContactSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    contacts: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        countryCode: {
            type: String,
            required: true,
            trim: true,
            default: '+91'
        }
    }],
}, {
    timestamps: true
});

// Ensure exactly 2 contacts
userSosContactSchema.pre('save', function(next) {
    if (this.contacts.length !== 2) {
        return next(new Error('Exactly 2 SOS contacts are required'));
    }
    next();
});

userSosContactSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.contacts && update.contacts.length !== 2) {
        return next(new Error('Exactly 2 SOS contacts are required'));
    }
    next();
});

const UserSosContact = mongoose.model('UserSosContact', userSosContactSchema);

export default UserSosContact;
