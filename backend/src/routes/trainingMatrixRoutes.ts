import express from 'express';
import { getTrainingMatrix, exportTrainingMatrix } from '../controllers/trainingMatrixController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Sprint 3: Training Matrix routes (Admin/QA only, read-only)
router.get('/', protect, getTrainingMatrix);
router.get('/export', protect, exportTrainingMatrix);

export default router;
