import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  email: { type: String, required: true },
  photoURL: { type: String, default: '' },
  statusMessage: { type: String, default: 'Available' },
  settings: {
    defaultMuteOnJoin: { type: Boolean, default: false },
    defaultVideoOffOnJoin: { type: Boolean, default: false },
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'system' },
    notifySound: { type: Boolean, default: true },
    notifyPush: { type: Boolean, default: true },
    notifyEmail: { type: Boolean, default: false },
    waitingRoomEnabled: { type: Boolean, default: false },
    allowScreenSharing: { type: Boolean, default: true },
    recordingPermission: { type: String, enum: ['host', 'all', 'none'], default: 'host' },
    preferredMic: { type: String, default: '' },
    preferredCamera: { type: String, default: '' },
    preferredSpeaker: { type: String, default: '' },
    defaultLayout: { type: String, enum: ['sidebar', 'grid', 'speaker'], default: 'grid' },
  },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.model('User', userSchema);
