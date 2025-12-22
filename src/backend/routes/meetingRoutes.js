import express from 'express';
import { 
  createMeeting, 
  getMeetings, 
  getMeetingByRoomId, 
  updateMeeting, 
  deleteMeeting, 
  getCalendarMeetings 
} from '../controllers/meetingController.js';

const router = express.Router();

router.post('/', createMeeting);
router.get('/', getMeetings);
router.get('/calendar', getCalendarMeetings);
router.get('/:roomId', getMeetingByRoomId);
router.put('/:roomId', updateMeeting);
router.delete('/:roomId', deleteMeeting);

export default router;
