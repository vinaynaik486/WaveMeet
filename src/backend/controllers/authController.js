import User from '../models/User.js';

export const syncUser = async (req, res) => {
  try {
    const { firebaseUid, displayName, email, photoURL } = req.body;
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      user = await User.create({ firebaseUid, displayName, email, photoURL });
    } else {
      user.displayName = displayName || user.displayName;
      user.photoURL = photoURL || user.photoURL;
      await user.save();
    }
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.query.uid });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
