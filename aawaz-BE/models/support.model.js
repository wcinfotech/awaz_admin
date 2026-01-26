import mongoose from 'mongoose';
import enums from '../config/enum.js';

const supportRequestSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  attachments: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: [enums.statusEnum.OPEN, enums.statusEnum.CLOSE],
    default: enums.statusEnum.OPEN,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

const SupportRequest = mongoose.model('SupportRequest', supportRequestSchema);

export default SupportRequest;