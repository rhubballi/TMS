import express from 'express';
import {
    createDocumentLink,
    getDocumentLinks,
    updateDocumentLink,
    deleteDocumentLink,
} from '../controllers/documentLinkController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .post(protect, createDocumentLink);

router.route('/:trainingId')
    .get(protect, getDocumentLinks);

router.route('/:id')
    .put(protect, updateDocumentLink)
    .delete(protect, deleteDocumentLink);

export default router;