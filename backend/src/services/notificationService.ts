import Notification from '../models/Notification';
import User from '../models/User';
import { sendDocumentAssignmentEmail } from './emailService';
import fs from 'fs';

// Types of notifications (extensible)
export type NotificationType =
    | 'TRAINING_ASSIGNED'
    | 'TRAINING_COMPLETED'
    | 'TRAINING_FAILED'
    | 'TRAINING_OVERDUE'
    | 'TRAINING_DUE_SOON'
    | 'CERTIFICATE_EXPIRING_SOON'
    | 'RETRAINING_REQUIRED'
    | 'TRAINING_EXPIRED';

interface NotificationContext {
    trainingTitle: string;
    trainingVersion?: string;
    dueDate?: Date;
    score?: number;
    daysRemaining?: number;
}

/**
 * Centralized service to handle all system notifications (Email + In-App)
 */
export const sendNotification = async (
    userId: string | any,
    type: NotificationType,
    context: NotificationContext
) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        let title = '';
        let message = '';
        let emailSubject = '';
        let emailBody = ''; // If we want custom body, otherwise we use templates

        // 1. Template Logic
        switch (type) {
            case 'TRAINING_ASSIGNED':
                title = 'New Training Assigned';
                message = `You have been assigned "${context.trainingTitle}". Due: ${context.dueDate?.toLocaleDateString()}.`;
                emailSubject = `Action Required: Training Assignment - ${context.trainingTitle}`;
                break;
            case 'RETRAINING_REQUIRED':
                title = 'Retraining Required';
                message = `A new version of "${context.trainingTitle}" is available. Please complete retraining.`;
                emailSubject = `Retraining Required: ${context.trainingTitle}`;
                break;
            case 'TRAINING_COMPLETED':
                title = 'Training Completed';
                message = `Congratulations! You have completed "${context.trainingTitle}" with score ${context.score}%.`;
                emailSubject = `Completion Certificate: ${context.trainingTitle}`;
                break;
            case 'TRAINING_FAILED':
                title = 'Training Failed';
                message = `You failed "${context.trainingTitle}". Please retry.`;
                emailSubject = `Assessment Failed: ${context.trainingTitle}`;
                break;
            case 'TRAINING_OVERDUE':
                title = 'Training Overdue';
                message = `Action Required: "${context.trainingTitle}" is OVERDUE.`;
                emailSubject = `URGENT: Training Overdue - ${context.trainingTitle}`;
                break;
            case 'TRAINING_DUE_SOON':
                title = 'Training Due Soon';
                message = `Reminder: "${context.trainingTitle}" is due in ${context.daysRemaining} days.`;
                emailSubject = `Reminder: Training Due Soon - ${context.trainingTitle}`;
                break;
            case 'CERTIFICATE_EXPIRING_SOON':
                title = 'Certificate Expiring';
                message = `Your certificate for "${context.trainingTitle}" expires in ${context.daysRemaining} days.`;
                emailSubject = `Expiry Warning: ${context.trainingTitle}`;
                break;
            case 'TRAINING_EXPIRED':
                title = 'Training Expired';
                message = `Your certification for "${context.trainingTitle}" has expired. Retraining required.`;
                emailSubject = `URGENT: Certification Expired - ${context.trainingTitle}`;
                break;
        }

        // 2. Create In-App Notification
        await Notification.create({
            userId: user._id,
            type: ['TRAINING_FAILED', 'TRAINING_OVERDUE'].includes(type) ? 'error' : 'info',
            title,
            message
        });

        // 3. Send Email
        if (user.email) {
            // For now, we reuse the existing simple email function for assignments
            // For others, we might need a generic sender
            // We will use a generic log/send capability here

            if (type === 'TRAINING_ASSIGNED' || type === 'RETRAINING_REQUIRED') {
                await sendDocumentAssignmentEmail(user.email, context.trainingTitle);
            } else {
                // Generic handler (mocked for now as emailService only has assignment template)
                // In a real app, sendGenericEmail(user.email, emailSubject, message);
                console.log(`[EmailService] Mock sending legacy email to ${user.email}: ${emailSubject}`);
                fs.appendFileSync('email_debug.log', `[${new Date().toISOString()}] Sent '${type}' to ${user.email}\n`);
            }
        }

    } catch (error) {
        console.error('[NotificationService] Error:', error);
    }
};
