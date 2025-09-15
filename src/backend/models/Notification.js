import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['join_request', 'meeting_invite', 'message', 'reminder', 'call'],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
  read: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
