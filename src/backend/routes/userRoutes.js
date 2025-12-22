import express from 'express';
import { updateUserSettings, updateUserProfile } from '../controllers/userController.js';

const router = express.Router();

router.put('/settings', updateUserSettings);
router.put('/profile', updateUserProfile);

export default router;
