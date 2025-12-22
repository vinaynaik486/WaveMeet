import Meeting from '../models/Meeting.js';

export const createMeeting = async (req, res) => {
  try {
    const { title, hostId, scheduledAt, duration, recurring, invitees, password } = req.body;
    const roomId = Math.random().toString(36).substring(2, 10);
    const meeting = await Meeting.create({ 
      roomId, 
      title: title || 'WaveMeet Room', 
      hostId, 
      password, 
      scheduledAt, 
      duration, 
      recurring, 
      invitees, 
      status: scheduledAt ? 'scheduled' : 'active' 
    });
    res.json({ meeting });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getMeetings = async (req, res) => {
  try {
    const q = {};
    if (req.query.hostId) q.hostId = req.query.hostId;
    if (req.query.status) q.status = req.query.status;
    const meetings = await Meeting.find(q).sort({ scheduledAt: 1 }).limit(50);
    res.json({ meetings });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getMeetingByRoomId = async (req, res) => {
  try {
    const m = await Meeting.findOne({ roomId: req.params.roomId });
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json({ meeting: m });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateMeeting = async (req, res) => {
  try {
    const m = await Meeting.findOneAndUpdate({ roomId: req.params.roomId }, { $set: req.body }, { new: true });
    res.json({ meeting: m });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteMeeting = async (req, res) => {
  try {
    await Meeting.deleteOne({ roomId: req.params.roomId });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getCalendarMeetings = async (req, res) => {
  try {
    const { hostId, month, year } = req.query;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const meetings = await Meeting.find({ hostId, scheduledAt: { $gte: start, $lte: end } }).sort({ scheduledAt: 1 });
    res.json({ meetings });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
