import express from 'express';
import Meeting from '../models/Meeting.js';
import Notification from '../models/Notification.js';

const router = express.Router();
const genRoomId = () => Math.random().toString(36).substring(2, 10);

// Create / schedule meeting
router.post('/', async (req, res) => {
  try {
    const { title, hostId, scheduledAt, duration, recurring, invitees, password } = req.body;
    const roomId = genRoomId();
    const status = scheduledAt ? 'scheduled' : 'active';
    const meeting = await Meeting.create({
      roomId, title: title || 'WaveMeet Room', hostId, password,
      scheduledAt, duration, recurring, invitees, status,
    });
    if (invitees?.length) {
      const notifications = invitees.map(inv => ({
        userId: inv.email,
        type: 'meeting_invite',
        title: 'Meeting Invitation',
        body: `You're invited to "${meeting.title}"`,
        meetingId: meeting._id,
      }));
      await Notification.insertMany(notifications);
    }
    res.json({ meeting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List user's meetings
router.get('/', async (req, res) => {
  try {
    const { hostId, status } = req.query;
    const query = {};
    if (hostId) query.hostId = hostId;
    if (status) query.status = status;
    const meetings = await Meeting.find(query).sort({ scheduledAt: 1, startedAt: -1 }).limit(50);
    res.json({ meetings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single meeting
router.get('/:roomId', async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json({ meeting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update meeting
router.put('/:roomId', async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndUpdate(
      { roomId: req.params.roomId },
      { $set: req.body },
      { new: true }
    );
    res.json({ meeting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete / cancel meeting
router.delete('/:roomId', async (req, res) => {
  try {
    await Meeting.deleteOne({ roomId: req.params.roomId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
