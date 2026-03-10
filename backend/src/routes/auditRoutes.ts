import express, { Request, Response } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { protect, admin } from '../middleware/authMiddleware';
import { TrainingAuditLog } from '../models/TrainingAuditLog';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', protect, admin, getAuditLogs);

// Diagnostic route
router.get('/diagnostic', protect, admin, async (req: Request, res: Response) => {
    try {
        const count = await TrainingAuditLog.countDocuments({});
        res.json({
            uri: process.env.MONGO_URI,
            dbName: mongoose.connection.name,
            readyState: mongoose.connection.readyState,
            count
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;
