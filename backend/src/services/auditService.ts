import { TrainingAuditLog, AuditEventType, EventSource } from '../models/TrainingAuditLog';
import { Request } from 'express';

/**
 * Extract IP address from request
 */
const getIpAddress = (req?: Request): string | undefined => {
    if (!req) return undefined;
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.socket?.remoteAddress ||
        undefined;
};

/**
 * Main audit logging function - non-blocking
 */
export const logAuditEvent = async (eventData: {
    event_type: AuditEventType;
    user_id?: string;
    training_id?: string;
    training_record_id?: string;
    assessment_id?: string;
    previous_status?: string;
    new_status?: string;
    event_source: EventSource;
    metadata?: any;
    ip_address?: string;
    req?: Request;
}): Promise<void> => {
    try {
        const { req, ...data } = eventData;

        await TrainingAuditLog.create({
            ...data,
            ip_address: data.ip_address || getIpAddress(req)
        });

        console.log(`[AUDIT] ${data.event_type} logged for user ${data.user_id || 'SYSTEM'}`);
    } catch (error) {
        console.error('[AUDIT ERROR] Failed to log audit event:', error);
    }
};

/**
 * Helper: Log training assignment (Sprint 1)
 */
export const logTrainingAssigned = async (
    userId: string,
    trainingId: string | undefined,
    trainingRecordId: string,
    metadata?: any,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.ASSIGN_TRAINING,
        user_id: userId,
        training_id: trainingId,
        training_record_id: trainingRecordId,
        event_source: EventSource.ADMIN,
        metadata,
        req
    });
};

/**
 * Helper: Log document viewed (Sprint 1)
 */
export const logDocumentViewed = async (
    userId: string,
    trainingId: string,
    trainingRecordId: string,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.DOCUMENT_VIEWED,
        user_id: userId,
        training_id: trainingId,
        training_record_id: trainingRecordId,
        event_source: EventSource.USER,
        req
    });
};

/**
 * Helper: Log document acknowledged (Sprint 1)
 */
export const logDocumentAcknowledged = async (
    userId: string,
    trainingId: string,
    trainingRecordId: string,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.DOCUMENT_ACKNOWLEDGED,
        user_id: userId,
        training_id: trainingId,
        training_record_id: trainingRecordId,
        event_source: EventSource.USER,
        req
    });
};

/**
 * Helper: Log assessment started (Sprint 2)
 */
export const logAssessmentStarted = async (
    userId: string,
    trainingId: string,
    trainingRecordId: string,
    metadata?: any,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.ASSESSMENT_STARTED,
        user_id: userId,
        training_id: trainingId,
        training_record_id: trainingRecordId,
        event_source: EventSource.USER,
        metadata,
        req
    });
};

/**
 * Helper: Log assessment submitted (Sprint 2)
 */
export const logAssessmentSubmitted = async (
    userId: string,
    trainingId: string,
    trainingRecordId: string,
    assessmentId: string,
    metadata?: any,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.ASSESSMENT_SUBMITTED,
        user_id: userId,
        training_id: trainingId,
        training_record_id: trainingRecordId,
        assessment_id: assessmentId,
        event_source: EventSource.USER,
        metadata,
        req
    });
};

/**
 * Helper: Log assessment result (Sprint 2)
 */
export const logAssessmentResult = async (
    userId: string,
    trainingId: string,
    trainingRecordId: string,
    assessmentId: string,
    passed: boolean,
    score: number,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: passed ? AuditEventType.ASSESSMENT_PASSED : AuditEventType.ASSESSMENT_FAILED,
        user_id: userId,
        training_id: trainingId,
        training_record_id: trainingRecordId,
        assessment_id: assessmentId,
        event_source: EventSource.SYSTEM,
        metadata: { score },
        req
    });
};

/**
 * Helper: Log status change
 */
export const logStatusChanged = async (
    userId: string,
    trainingId: string,
    trainingRecordId: string,
    oldStatus: string,
    newStatus: string,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.STATUS_CHANGED,
        user_id: userId,
        training_id: trainingId,
        training_record_id: trainingRecordId,
        previous_status: oldStatus,
        new_status: newStatus,
        event_source: EventSource.SYSTEM,
        req
    });
};

/**
 * Helper: Log training overdue (Sprint 2)
 */
export const logTrainingOverdue = async (
    userId: string,
    trainingId: string,
    trainingRecordId: string
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.TRAINING_OVERDUE,
        user_id: userId,
        training_id: trainingId,
        training_record_id: trainingRecordId,
        event_source: EventSource.SYSTEM
    });
};

/**
 * Helper: Log late completion (Sprint 2)
 */
export const logLateCompletion = async (
    userId: string,
    trainingId: string,
    trainingRecordId: string,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.LATE_COMPLETION,
        user_id: userId,
        training_id: trainingId,
        training_record_id: trainingRecordId,
        event_source: EventSource.SYSTEM,
        req
    });
};

/**
 * Helper: Log assessment config created
 */
export const logAssessmentConfigCreated = async (
    userId: string,
    trainingId: string,
    metadata?: any,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.STATUS_CHANGED, // Or a specific CONFIG_CREATED if it exists
        user_id: userId,
        training_id: trainingId,
        event_source: EventSource.ADMIN,
        metadata: { ...metadata, action: 'ASSESSMENT_CREATED' },
        req
    });
};

/**
 * Helper: Log assessment config updated
 */
export const logAssessmentConfigUpdated = async (
    userId: string,
    trainingId: string,
    metadata?: any,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.STATUS_CHANGED,
        user_id: userId,
        training_id: trainingId,
        event_source: EventSource.ADMIN,
        metadata: { ...metadata, action: 'ASSESSMENT_UPDATED' },
        req
    });
};

/**
 * Helper: Log rejected transition
 */
export const logRejectedTransition = async (
    userId: string,
    trainingRecordId: string,
    attemptedTransition: string,
    reason: string,
    metadata?: any,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.REJECTED_TRANSITION,
        user_id: userId,
        training_record_id: trainingRecordId,
        event_source: EventSource.SYSTEM,
        metadata: { attemptedTransition, reason, ...metadata },
        req
    });
};

/**
 * Helper: Log certificate generation (Sprint 3)
 */
export const logCertificateGenerated = async (
    userId: string,
    trainingId: string,
    trainingRecordId: string,
    metadata?: any,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.CERTIFICATE_GENERATED,
        user_id: userId,
        training_id: trainingId,
        training_record_id: trainingRecordId,
        event_source: EventSource.SYSTEM,
        metadata,
        req
    });
};

/**
 * Helper: Log training expiry (Sprint 3)
 */
export const logTrainingExpired = async (
    userId: string,
    trainingId: string,
    trainingRecordId: string,
    metadata?: any,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.TRAINING_EXPIRED,
        user_id: userId,
        training_id: trainingId,
        training_record_id: trainingRecordId,
        previous_status: 'COMPLETED',
        new_status: 'EXPIRED',
        event_source: EventSource.SYSTEM,
        metadata,
        req
    });
};

/**
 * Helper: Log AI usage (Sprint 3)
 * URS-TMS-S3-013: AI governance and audit logging
 */
export const logAIUsed = async (
    userId: string,
    purpose: string,
    metadata?: any,
    req?: Request
): Promise<void> => {
    await logAuditEvent({
        event_type: AuditEventType.AI_USED,
        user_id: userId,
        event_source: EventSource.SYSTEM,
        metadata: {
            purpose,
            model: 'llama-3.3-70b-versatile',
            timestamp: new Date().toISOString(),
            ...metadata
        },
        req
    });
};
