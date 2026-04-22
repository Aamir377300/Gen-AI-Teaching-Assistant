import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import {
  createAssignment,
  getTeacherAssignments,
  getStudentAssignments,
  submitAssignment,
  getSubmissions,
  deleteAssignment,
  generateAssignment,
} from '../controllers/assignmentController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/generate', protect, generateAssignment);
router.post('/', protect, upload.single('file'), createAssignment);
router.get('/teacher', protect, getTeacherAssignments);
router.get('/student', protect, getStudentAssignments);
router.post('/:id/submit', protect, submitAssignment);
router.get('/:id/submissions', protect, getSubmissions);
router.delete('/:id', protect, deleteAssignment);

export default router;
