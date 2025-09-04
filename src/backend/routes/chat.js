const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const router = express.Router();

// Get chat history
router.get('/:roomId', async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const query = { roomId: req.params.roomId };
    if (before) query._id = { $lt: before };
    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
