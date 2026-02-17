import express from 'express';
import { askAI } from '../controllers/aiAnalyticsController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// All AI analytics routes are admin/QA only
router.post('/ask', protect, adminOnly, askAI);

export default router;
