import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  hostId: {
    type: String,
    required: true,
  },
  hostName: {
    type: String,
    default: 'Host',
  },
  participants: [
    {
      userId: String,
      userName: String,
      joinedAt: { type: Date, default: Date.now },
      leftAt: Date,
    },
  ],
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: Date,
});

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;
