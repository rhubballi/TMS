import express from 'express';
import { getCurrentConfig, getConfigHistory, updateConfig, rollbackConfig } from '../controllers/governanceController';
import { protect, adminOnly } from '../middleware/authMiddleware';
import { requireElectronicSignature } from '../middleware/signatureMiddleware';

const router = express.Router();

// Publicly accessible to Admin/QA
router.get('/current', protect, adminOnly, getCurrentConfig);
router.get('/history', protect, adminOnly, getConfigHistory);

// Signature Required for Mutating Actions
router.post('/update', protect, adminOnly, requireElectronicSignature('GOVERNANCE_CONFIG_UPDATE'), updateConfig);
router.post('/rollback/:version', protect, adminOnly, requireElectronicSignature('GOVERNANCE_CONFIG_ROLLBACK'), rollbackConfig);

export default router;
