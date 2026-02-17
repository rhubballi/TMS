import express from 'express';
import { askAI } from '../controllers/aiAnalyticsController';
import { protect, adminOnly } from '../middleware/authMiddleware';
import { requireElectronicSignature } from '../middleware/signatureMiddleware';

const router = express.Router();

// All AI analytics routes are admin/QA only - Signature required for queries (Governance Analytics)
router.post('/ask', protect, adminOnly, requireElectronicSignature('AI_GOVERNANCE_QUERY'), askAI);

export default router;
