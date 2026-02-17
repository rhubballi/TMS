import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { askAIGovernance } from '../services/aiGovernanceService';

// @desc    Ask AI Governance Assistant
// @route   POST /api/analytics/ai/ask
// @access  Private (Admin/QA)
export const askAI = async (req: AuthRequest, res: Response) => {
    const { query } = req.body;
    const adminId = req.user!._id.toString();

    try {
        // 1. Pre-fetch Analytics Context (Aggregated data only)
        // We'll use a simplified set of metrics for the prompt context
        const TrainingRecord = (await import('../models/TrainingRecord')).default;
        const User = (await import('../models/User')).default;

        const totalUsers = await User.countDocuments();
        const completedCount = await TrainingRecord.countDocuments({ status: 'COMPLETED' });
        const overdueCount = await TrainingRecord.countDocuments({ status: 'OVERDUE' });
        const failedCount = await TrainingRecord.countDocuments({ status: 'FAILED' });
        const lockedCount = await TrainingRecord.countDocuments({ status: 'LOCKED' });

        // Departmental Breakdown (Aggregated)
        const deptStats = await TrainingRecord.aggregate([
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } },
            { $unwind: '$userDetails' },
            {
                $group: {
                    _id: '$userDetails.department',
                    count: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
                    overdue: { $sum: { $cond: [{ $eq: ['$status', 'OVERDUE'] }, 1, 0] } }
                }
            }
        ]);

        const analyticsContext = {
            overview: {
                totalUsers,
                totalRecords: completedCount + overdueCount + failedCount + lockedCount,
                completed: completedCount,
                overdue: overdueCount,
                failed: failedCount,
                locked: lockedCount,
                globalCompliance: totalUsers > 0 ? (completedCount / (completedCount + overdueCount)) * 100 : 0
            },
            departmentalBreakdown: deptStats
        };

        // 2. Call AI Service
        const aiResponse = await askAIGovernance(adminId, query, analyticsContext, req);

        res.json(aiResponse);

    } catch (error) {
        console.error('[AI Analytics Controller] Error:', error);
        res.status(500).json({ message: (error as Error).message });
    }
};
