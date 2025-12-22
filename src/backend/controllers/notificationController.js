import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const q = { userId: req.query.userId };
    if (req.query.unread === 'true') q.read = false;
    const notifications = await Notification.find(q).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.query.userId, read: false });
    res.json({ notifications, unreadCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
