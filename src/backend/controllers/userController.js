import User from '../models/User.js';

export const updateUserSettings = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.body.firebaseUid },
      { $set: { settings: req.body.settings } },
      { new: true }
    );
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const upd = {};
    if (req.body.displayName) upd.displayName = req.body.displayName;
    if (req.body.statusMessage !== undefined) upd.statusMessage = req.body.statusMessage;
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.body.firebaseUid },
      { $set: upd },
      { new: true }
    );
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
