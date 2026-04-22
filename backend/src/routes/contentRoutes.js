import express from 'express';
import {
  generateNotes,
  generateSlides,
  generateQuiz,
  saveSlides,
  saveContent,
  saveQuiz,
  getSavedContent,
  getSavedQuizzes,
  deleteSavedContent,
  deleteQuiz,
  submitQuizAttempt,
  getMyQuizResult,
  getQuizResults,
  downloadQuizResultsPDF,
} from '../controllers/contentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, generateNotes);
router.post('/generate/slides', protect, generateSlides);
router.post('/generate/quiz', protect, generateQuiz);

router.post('/saved/slides', protect, saveSlides);
router.post('/saved/quiz', protect, saveQuiz);
router.post('/saved', protect, saveContent);

router.get('/saved', protect, getSavedContent);
router.get('/saved/quizzes', protect, getSavedQuizzes);

router.delete('/saved/:id', protect, deleteSavedContent);
router.delete('/quiz/:id', protect, deleteQuiz);

// Quiz attempt routes
router.post('/quiz/:id/attempt', protect, submitQuizAttempt);
router.get('/quiz/:id/my-result', protect, getMyQuizResult);
router.get('/quiz/:id/results', protect, getQuizResults);
router.get('/quiz/:id/results/pdf', protect, downloadQuizResultsPDF);

export default router;
