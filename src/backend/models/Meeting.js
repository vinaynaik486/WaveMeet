import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: 'WaveMeet Room' },
  hostId: { type: String, required: true },
  coHosts: [{ type: String }],
  waitingRoomEnabled: { type: Boolean, default: false },
  password: { type: String, default: '' },
  scheduledAt: { type: Date, default: null },
  duration: { type: Number, default: 60 },
  recurring: {
    enabled: { type: Boolean, default: false },
    pattern: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
    endDate: { type: Date, default: null },
  },
  invitees: [{
    email: String,
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  }],
  participants: [{
    odId: String,
    displayName: String,
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date,
    role: { type: String, enum: ['host', 'cohost', 'participant'], default: 'participant' },
  }],
  waitingRoom: [{
    odId: String,
    displayName: String,
    socketId: String,
    requestedAt: { type: Date, default: Date.now },
  }],
  tasks: [{
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
  }],
  isRecording: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  status: { type: String, enum: ['scheduled', 'active', 'ended'], default: 'active' },
}, { timestamps: true });

export default mongoose.model('Meeting', meetingSchema);
