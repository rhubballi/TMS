import express from 'express';
import multer from 'multer';
import { attachTrainingContent, getTrainingContent } from '../controllers/trainingContentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/attach', protect, upload.single('file'), attachTrainingContent);
router.get('/:training_master_id', protect, getTrainingContent);

export default router;
