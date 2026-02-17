
import TrainingRecord from '../models/TrainingRecord';
import Training from '../models/Training';
import User from '../models/User';
import Notification from '../models/Notification';
import { sendDocumentAssignmentEmail } from './emailService';
import { logTrainingAssigned } from './auditService';
import fs from 'fs';

/**
 * Triggers retraining for a new training version.
 * Finds all users who completed any previous version of the same TrainingMaster
 * and assigns them the new training.
 * 
 * @param newTrainingId The ObjectId of the newly created Training document
 * @param req Express request object for audit logging context
 */
export const triggerRetraining = async (newTrainingId: string, req: any) => {
    try {
        console.log(`[Retraining] Triggering for Training ID: ${newTrainingId}`);

        const newTraining = await Training.findById(newTrainingId);
        if (!newTraining) {
            console.error('[Retraining] New training not found');
            return;
        }

        // If no Master is linked, we can't reliably identify "previous versions" 
        // unless we strictly use 'code'.
        // Strategy: Use TrainingMaster if available, otherwise fallback to Code.

        let previousTrainingIds: string[] = [];

        if (newTraining.trainingMaster) {
            // Find all other trainings linked to this master, excluding self
            const siblings = await Training.find({
                trainingMaster: newTraining.trainingMaster,
                _id: { $ne: newTraining._id }
            }).select('_id');
            previousTrainingIds = siblings.map(t => t._id.toString());
        } else {
            // Fallback: Find by code
            const siblings = await Training.find({
                code: newTraining.code,
                _id: { $ne: newTraining._id }
            }).select('_id');
            previousTrainingIds = siblings.map(t => t._id.toString());
        }

        if (previousTrainingIds.length === 0) {
            console.log('[Retraining] No previous versions found. Skipping.');
            return;
        }

        console.log(`[Retraining] Found ${previousTrainingIds.length} previous versions.`);

        // Find users who have COMPLETED or EXPIRED any of the previous trainings
        // We act conservatively: If they interacted with previous versions, they should typically retrain.
        // URS-TMS-S3-009 says "COMPLETED".
        const qualifiedRecords = await TrainingRecord.find({
            training: { $in: previousTrainingIds },
            status: { $in: ['COMPLETED', 'EXPIRED', 'LOCKED'] }

            // Note: If they are IN_PROGRESS on old version, do we upgrade them? 
            // URS usually implies completed users need re-certification. 
            // Users in progress might just continue or be forced to switch. 
            // For now, let's stick to COMPLETED/EXPIRED/LOCKED (users who finished their attempt loop).
        }).select('user');

        const userIdsToRetrain = [...new Set(qualifiedRecords.map(r => r.user.toString()))];
        console.log(`[Retraining] Found ${userIdsToRetrain.length} users to retrain.`);

        if (userIdsToRetrain.length === 0) {
            return;
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // Default 2 weeks for retraining?

        let count = 0;
        for (const uid of userIdsToRetrain) {
            // Check if already assigned to NEW training
            const existing = await TrainingRecord.findOne({
                user: uid,
                training: newTraining._id
            });

            if (existing) continue;

            // Create PENDING record
            const newRecord = await TrainingRecord.create({
                user: uid,
                training: newTraining._id,
                status: 'PENDING',
                dueDate: dueDate,
                assignmentSource: 'system', // or 'retraining'
                assignedBy: req.user?._id // System triggered, but acting on behalf of uploader
            });

            count++;

            // Audit
            await logTrainingAssigned(
                uid,
                newTraining._id.toString(),
                newRecord._id.toString(),
                {
                    source: 'RETRAINING_TRIGGER',
                    previousVersions: previousTrainingIds
                },
                req
            );

            // Notify
            try {
                // System Notification
                await Notification.create({
                    userId: uid,
                    type: 'warning', // Warning to catch attention
                    title: 'Retraining Required',
                    message: `A new version of "${newTraining.title}" (${newTraining.version}) has been released. You have been assigned for retraining.`
                });

                // Email
                const user = await User.findById(uid);
                if (user && user.email) {
                    await sendDocumentAssignmentEmail(user.email, `${newTraining.title} (Rev ${newTraining.version})`);
                }
            } catch (notifyErr) {
                console.error(`[Retraining] Failed to notify user ${uid}`, notifyErr);
            }
        }

        console.log(`[Retraining] Successfully assigned ${count} users to new version.`);

    } catch (error) {
        console.error('[Retraining] Error:', error);
    }
};
