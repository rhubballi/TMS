import { Request, Response, NextFunction } from 'express';
import { logRejectedTransition } from '../services/auditService';

/**
 * Prevents manual editing of immutable fields in TrainingRecord
 * URS-TMS-S3-010: Immutability enforcement
 * 
 * Sprint 3: Critical enforcement middleware
 * - Prevents manual editing of expiryDate, certificateId, certificateUrl
 * - Prevents manual COMPLETED status assignment (only via assessment)
 * - Prevents manual EXPIRED status assignment (only via scheduler)
 */
export const enforceTrainingRecordImmutability = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const updates = req.body;
    const immutableFields = ['expiryDate', 'certificateId', 'certificateUrl'];
    const userId = (req as any).user?._id;

    // Check for immutable field edits
    for (const field of immutableFields) {
        if (updates[field] !== undefined) {
            await logRejectedTransition(
                userId,
                req.params.id,
                `MANUAL_EDIT_${field.toUpperCase()}`,
                'Immutable field cannot be manually edited',
                { field, attemptedValue: updates[field] },
                req
            );

            return res.status(403).json({
                message: `Field '${field}' is immutable and cannot be manually edited`
            });
        }
    }

    // Check for manual COMPLETED or EXPIRED status assignment
    if (updates.status) {
        if (updates.status === 'COMPLETED') {
            await logRejectedTransition(
                userId,
                req.params.id,
                'MANUAL_COMPLETED_ASSIGNMENT',
                'COMPLETED status can only be set by assessment submission',
                { attemptedStatus: 'COMPLETED' },
                req
            );

            return res.status(403).json({
                message: 'COMPLETED status can only be set by passing an assessment'
            });
        }

        if (updates.status === 'EXPIRED') {
            await logRejectedTransition(
                userId,
                req.params.id,
                'MANUAL_EXPIRED_ASSIGNMENT',
                'EXPIRED status can only be set by system scheduler',
                { attemptedStatus: 'EXPIRED' },
                req
            );

            return res.status(403).json({
                message: 'EXPIRED status can only be set by the system when certificate expires'
            });
        }
    }

    next();
};
