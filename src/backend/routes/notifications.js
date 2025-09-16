import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const { userId, unread } = req.query;
    const query = { userId };
    if (unread === 'true') query.read = false;
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId, read: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark one as read
router.put('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    const { userId } = req.body;
    await Notification.updateMany({ userId, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
