import mongoose from 'mongoose';
import enums from '../config/enum.js';

const reportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reportedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    postId: {
        type: String,
        default: null,
    },
    commentId: {
        type: String,
        default: null,
    },
    commentReplyId: {
        type: String,
        default: null,
    },
    reason: {
        type: String,
        required: true,
    },
    reportType: {
        type: String,
        enum: [enums.reportTypeEnum.USER, enums.reportTypeEnum.POST, enums.reportTypeEnum.COMMENT, enums.reportTypeEnum.COMMENT_REPLY],
        required: true,
    },
    status: {
        type: String,
        enum: [enums.statusEnum.OPEN, enums.statusEnum.CLOSE],
        default: enums.statusEnum.OPEN,
    },
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);

export default Report;