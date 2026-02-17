import TrainingRecord from '../models/TrainingRecord';
import { refreshTrainingStatus } from '../controllers/trainingRecordController';

/**
 * Initializes the background overdue tracker.
 * Checks all active records against their due dates.
 */
export const initOverdueTracker = () => {
    console.log('[SYSTEM] Initializing Overdue Tracker...');

    // Check every hour (3600000 ms)
    setInterval(async () => {
        try {
            const now = new Date();
            // Find all pending/in_progress records that are past due
            const pastDueRecords = await TrainingRecord.find({
                status: { $in: ['PENDING', 'IN_PROGRESS'] },
                dueDate: { $lt: now }
            });

            if (pastDueRecords.length > 0) {
                console.log(`[SYSTEM] Found ${pastDueRecords.length} overdue records. Processing...`);
                for (const record of pastDueRecords) {
                    await refreshTrainingStatus(record);
                }
            }
        } catch (error) {
            console.error('[SYSTEM ERROR] Overdue tracker failed:', error);
        }
    }, 3600000);

    // Also run immediate check on startup
    setImmediate(async () => {
        try {
            const now = new Date();
            const pastDueRecords = await TrainingRecord.find({
                status: { $in: ['PENDING', 'IN_PROGRESS'] },
                dueDate: { $lt: now }
            });
            for (const record of pastDueRecords) {
                await refreshTrainingStatus(record);
            }
        } catch (err) {
            console.error('[SYSTEM ERROR] Initial overdue check failed:', err);
        }
    });
};
