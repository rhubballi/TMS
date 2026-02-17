import { Request, Response } from 'express';
import { TrainingAuditLog } from '../models/TrainingAuditLog';

/**
 * @desc    Get all audit logs with filters
 * @route   GET /api/audit-logs
 * @access  Private (Admin/QA)
 */
export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const {
            pageNumber,
            user_id,
            training_id,
            event_type,
            startDate,
            endDate
        } = req.query;

        const pageSize = 50;
        const page = Number(pageNumber) || 1;

        const query: any = {};

        if (user_id) query.user_id = user_id;
        if (training_id) query.training_id = training_id;
        if (event_type) query.event_type = event_type;

        if (startDate || endDate) {
            query.system_timestamp = {};
            if (startDate) query.system_timestamp.$gte = new Date(startDate as string);
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                query.system_timestamp.$lte = end;
            }
        }

        const count = await TrainingAuditLog.countDocuments(query);
        const logs = await TrainingAuditLog.find(query)
            .populate('user_id', 'name email role department')
            .populate('training_id', 'title code')
            .populate('training_record_id')
            .populate('assessment_id')
            .sort({ system_timestamp: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({
            logs,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        });
    } catch (error) {
        console.error('[AUDIT CONTROLLER ERROR]', error);
        res.status(500).json({ message: (error as Error).message });
    }
};
