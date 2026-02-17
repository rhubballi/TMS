import express from 'express';
import {
  getMyLearningProgress,
  getLearningProgress,
  updateReadingProgress,
  getResumePoint,
} from '../controllers/learningProgressController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/my', getMyLearningProgress);
router.get('/:trainingRecordId', getLearningProgress);
router.get('/:trainingRecordId/resume', getResumePoint);
router.put('/:trainingRecordId/content/:contentId', updateReadingProgress);

export default router;