import express from 'express';
import { syncUser, getMe } from '../controllers/authController.js';

const router = express.Router();

router.post('/sync', syncUser);
router.get('/me', getMe);

export default router;
