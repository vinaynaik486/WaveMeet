import ChatMessage from '../models/ChatMessage.js';

export const getChatHistory = async (req, res) => {
  try {
    const q = { roomId: req.params.roomId };
    if (req.query.before) q._id = { $lt: req.query.before };
    const msgs = await ChatMessage.find(q)
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);
    res.json({ messages: msgs.reverse() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
