import express from 'express';
import User from '../models/User.js';
import Meeting from '../models/Meeting.js';

const router = express.Router();

// Update settings
router.put('/settings', async (req, res) => {
  try {
    const { firebaseUid, settings } = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { $set: { settings } },
      { new: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/profile', async (req, res) => {
  try {
    const { firebaseUid, displayName, statusMessage } = req.body;
    const update = {};
    if (displayName) update.displayName = displayName;
    if (statusMessage !== undefined) update.statusMessage = statusMessage;
    const user = await User.findOneAndUpdate({ firebaseUid }, { $set: update }, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Block user
router.post('/block', async (req, res) => {
  try {
    const { firebaseUid, targetUserId } = req.body;
    await User.findOneAndUpdate(
      { firebaseUid },
      { $addToSet: { blockedUsers: targetUserId } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unblock user
router.post('/unblock', async (req, res) => {
  try {
    const { firebaseUid, targetUserId } = req.body;
    await User.findOneAndUpdate(
      { firebaseUid },
      { $pull: { blockedUsers: targetUserId } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calendar endpoint — meetings for a given month/year
router.get('/calendar', async (req, res) => {
  try {
    const { hostId, month, year } = req.query;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const meetings = await Meeting.find({
      hostId,
      scheduledAt: { $gte: start, $lte: end },
    }).sort({ scheduledAt: 1 });
    res.json({ meetings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
