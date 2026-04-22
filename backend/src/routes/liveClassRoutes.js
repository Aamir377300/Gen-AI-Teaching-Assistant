import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  startLiveClass,
  endLiveClass,
  getTeacherLiveClasses,
  getActiveLiveClass,
} from '../controllers/liveClassController.js';

const router = express.Router();

router.post('/start', protect, startLiveClass);
router.put('/:id/end', protect, endLiveClass);
router.get('/teacher', protect, getTeacherLiveClasses);
router.get('/active', protect, getActiveLiveClass);

export default router;
