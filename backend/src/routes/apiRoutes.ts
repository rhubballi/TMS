import express from 'express';
import multer from 'multer';
import { uploadDocument, submitAnswers, getTrainingResult, getSession } from '../controllers/uploadController';
import { protect } from '../middleware/authMiddleware';
import trainingRoutes from './trainingRoutes';
import trainingRecordRoutes from './trainingRecordRoutes';
import learningProgressRoutes from './learningProgressRoutes';
import auditRoutes from './auditRoutes';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload-document', protect, upload.single('document'), uploadDocument);
router.post('/submit-answers', protect, submitAnswers);
router.get('/training-result/:id', protect, getTrainingResult);
router.get('/session/:id', protect, getSession);

// Include other route modules
router.use('/trainings', trainingRoutes);
router.use('/training-records', trainingRecordRoutes);
router.use('/learning-progress', learningProgressRoutes);
router.use('/audit-logs', auditRoutes);

export default router;
