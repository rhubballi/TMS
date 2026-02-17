import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getAnalyticsDashboard, generateInsight } from '../controllers/analyticsController';

const router = express.Router();

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get comprehensive analytics dashboard (Compliance, Risk, Effectiveness)
 * @access  Private (Admin, QA)
 */
router.get('/dashboard', protect, getAnalyticsDashboard);
router.post('/ai-insight', protect, generateInsight);

export default router;
