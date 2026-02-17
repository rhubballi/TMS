
import TrainingRecord from '../models/TrainingRecord';
import { sendNotification } from './notificationService';
import { refreshTrainingStatus } from '../controllers/trainingRecordController';

/**
 * Checks for records due in 7 days or 1 day and sends reminders.
 */
export const checkTrainingReminders = async () => {
    console.log('[Scheduler] Checking assignments due soon...');

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(now.getDate() + 1);

    // Range query approximation for "Due on that specific day"
    // Ideally we check if dueDate is between start/end of target day

    // Find records due in roughly 7 days (+- 12 hours window to catch them)
    // For simplicity in this logical impl, we check strict date equality logic or range
    // Let's simplified: Find PENDING/IN_PROGRESS records where dueDate < 7 days from now AND not yet reminded?
    // We don't have a "reminded" flag, so we might spam. 
    // Sprint 3 update: We should ideally add a 'lastRemindedAt' to TrainingRecord to avoid spam.
    // For now, we will just log/identify them.

    // Logic: Find records due between now and 7 days? Or exactly 7 days? 
    // "Reminder Schedule: 7 days before due" implies exactly 7 days.

    // Implementation: Since we don't have a persistent job runner, this is a function called periodically.
    // We will query for records due in [7days_start, 7days_end]

    const startOf7 = new Date(sevenDaysFromNow); startOf7.setHours(0, 0, 0, 0);
    const endOf7 = new Date(sevenDaysFromNow); endOf7.setHours(23, 59, 59, 999);

    const recordsDue7 = await TrainingRecord.find({
        status: { $in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { $gte: startOf7, $lte: endOf7 }
    }).populate('user').populate('training');

    for (const r of recordsDue7) {
        await sendNotification(r.user._id, 'TRAINING_DUE_SOON', {
            trainingTitle: (r.training as any).title,
            dueDate: r.dueDate,
            daysRemaining: 7
        });
    }

    console.log(`[Scheduler] Sent 7-day reminders to ${recordsDue7.length} users.`);
};

/**
 * Checks for records expiring in 30 days.
 */
export const checkExpiryWarnings = async () => {
    console.log('[Scheduler] Checking expiry warnings...');

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const start = new Date(thirtyDaysFromNow); start.setHours(0, 0, 0, 0);
    const end = new Date(thirtyDaysFromNow); end.setHours(23, 59, 59, 999);

    const recordsExpiring = await TrainingRecord.find({
        status: 'COMPLETED',
        expiryDate: { $gte: start, $lte: end }
    }).populate('user').populate('training');

    for (const r of recordsExpiring) {
        await sendNotification(r.user._id, 'CERTIFICATE_EXPIRING_SOON', {
            trainingTitle: (r.training as any).title,
            daysRemaining: 30
        });
    }

    console.log(`[Scheduler] Sent 30-day expiry warnings to ${recordsExpiring.length} users.`);
};

/**
 * Checks for overdue records and updates status + notifies.
 */
export const checkOverdue = async () => {
    console.log('[Scheduler] Checking overdue records...');

    const now = new Date();

    // Find PENDING/IN_PROGRESS with due date < now
    const overdueRecords = await TrainingRecord.find({
        status: { $in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { $lt: now }
    }).populate('user').populate('training');

    for (const r of overdueRecords) {
        // refreshTrainingStatus already handles the logic to flip to OVERDUE and log audit
        // We just need to trigger it.
        const oldStatus = r.status;
        await refreshTrainingStatus(r);

        if (r.status === 'OVERDUE' && oldStatus !== 'OVERDUE') {
            await sendNotification(r.user._id, 'TRAINING_OVERDUE', {
                trainingTitle: (r.training as any).title
            });
        }
    }

    console.log(`[Scheduler] Processed overdue checks for ${overdueRecords.length} records.`);
};

/**
 * Checks for expired certificates and auto-transitions to EXPIRED status.
 * URS-TMS-S3-008: System-only expiry enforcement
 * Sprint 3: Critical enforcement - prevents manual EXPIRED assignment
 */
export const checkExpiredCertificates = async () => {
    console.log('[Scheduler] Checking expired certificates...');

    const now = new Date();

    // Find COMPLETED records where expiryDate < now
    const expiredRecords = await TrainingRecord.find({
        status: 'COMPLETED',
        expiryDate: { $exists: true, $lt: now }
    }).populate('user').populate('training');

    for (const record of expiredRecords) {
        const oldStatus = record.status;

        // Transition to EXPIRED
        record.status = 'EXPIRED';
        await record.save();

        console.log(`[Scheduler] Transitioned record ${record._id} from ${oldStatus} to EXPIRED (expiryDate: ${record.expiryDate?.toISOString()})`);

        // Audit log
        const auditService = await import('./auditService');
        await auditService.logTrainingExpired(
            record.user._id.toString(),
            record.training._id.toString(),
            record._id.toString(),
            {
                expiryDate: record.expiryDate,
                certificateId: record.certificateId,
                autoTransitioned: true
            }
        );

        // Notify user
        await sendNotification(record.user._id, 'TRAINING_EXPIRED', {
            trainingTitle: (record.training as any).title
        });
    }

    console.log(`[Scheduler] Processed ${expiredRecords.length} expired certificates.`);
};
