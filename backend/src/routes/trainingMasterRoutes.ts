import express from 'express';
import {
    createTrainingMaster,
    getTrainingMasters,
    updateTrainingMaster,
    toggleTrainingMasterStatus,
    assignTrainingMaster
} from '../controllers/trainingMasterController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getTrainingMasters)
    .post(protect, createTrainingMaster);

router.route('/:id')
    .put(protect, updateTrainingMaster);

router.route('/:id/status')
    .patch(protect, toggleTrainingMasterStatus);

router.route('/:id/assign')
    .post(protect, assignTrainingMaster);

export default router;
