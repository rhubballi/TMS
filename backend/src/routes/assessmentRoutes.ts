import express from 'express';
import { createAssessment, getAssessmentByTraining, updateAssessment, submitAssessment } from '../controllers/assessmentController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// All routes are protected
router.use(protect);

// GET assessment by training ID (available to all authenticated users for evaluation, 
// though answers are hidden by select: false)
router.get('/training/:trainingId', getAssessmentByTraining);

// Submit assessment (User)
router.post('/submit', submitAssessment);

// Admin-only configuration routes
router.post('/', admin, createAssessment);
router.put('/:id', admin, updateAssessment);

export default router;
