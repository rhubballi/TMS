import express from 'express';
import {
    createTraining,
    getTrainings,
    getTraining,
    updateTraining,
    deleteTraining,
} from '../controllers/trainingController';
import { protect } from '../middleware/authMiddleware';
import { auditMiddleware } from '../middleware/auditMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getTrainings)
    .post(protect, auditMiddleware('CREATE', 'Training'), createTraining);

router.route('/:id')
    .get(protect, getTraining)
    .put(protect, auditMiddleware('UPDATE', 'Training'), updateTraining)
    .delete(protect, auditMiddleware('DELETE', 'Training'), deleteTraining);

export default router;