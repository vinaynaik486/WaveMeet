import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Sync Firebase user to MongoDB (called on login)
router.post('/sync', async (req, res) => {
  try {
    const { firebaseUid, displayName, email, photoURL } = req.body;
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      user = await User.create({ firebaseUid, displayName, email, photoURL });
    } else {
      user.displayName = displayName || user.displayName;
      user.email = email || user.email;
      user.photoURL = photoURL || user.photoURL;
      await user.save();
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const { uid } = req.query;
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
