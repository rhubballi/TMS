import express from 'express';
import {
    assignTraining,
    getMyTrainingRecords,
    getTrainingRecords,
    startTraining,
    viewDocument,
    completeTraining,
    getRecordDocument,
    getRecordsByTrainingAndDepartment,
    getTrainingHistory,
    acknowledgeDocument
} from '../controllers/trainingRecordController';
import { protect } from '../middleware/authMiddleware';
import { enforceTrainingRecordImmutability } from '../middleware/immutabilityMiddleware';

const router = express.Router();

router.route('/compliance/:trainingId/:department')
    .get(protect, getRecordsByTrainingAndDepartment);

router.route('/')
    .get(protect, getTrainingRecords)
    .post(protect, assignTraining);

router.route('/my')
    .get(protect, getMyTrainingRecords);

router.route('/history')
    .get(protect, getTrainingHistory);

router.route('/:id/start')
    .put(protect, startTraining);

router.route('/:id/view-document')
    .put(protect, viewDocument);

router.route('/:id/acknowledge')
    .put(protect, acknowledgeDocument);

router.route('/:id/document')
    .get(protect, getRecordDocument);

router.route('/:id/complete')
    .put(protect, enforceTrainingRecordImmutability, completeTraining);



export default router;