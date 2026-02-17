import mongoose, { Document, Schema } from 'mongoose';

export enum AuditEventType {
    // Sprint 1
    ASSIGN_TRAINING = 'ASSIGN_TRAINING',
    DOCUMENT_VIEWED = 'DOCUMENT_VIEWED',
    DOCUMENT_ACKNOWLEDGED = 'DOCUMENT_ACKNOWLEDGED',

    // Sprint 2
    ASSESSMENT_STARTED = 'ASSESSMENT_STARTED',
    ASSESSMENT_SUBMITTED = 'ASSESSMENT_SUBMITTED',
    ASSESSMENT_PASSED = 'ASSESSMENT_PASSED',
    ASSESSMENT_FAILED = 'ASSESSMENT_FAILED',
    TRAINING_OVERDUE = 'TRAINING_OVERDUE',
    LATE_COMPLETION = 'LATE_COMPLETION',

    // Sprint 3
    CERTIFICATE_GENERATED = 'CERTIFICATE_GENERATED',
    TRAINING_EXPIRED = 'TRAINING_EXPIRED',
    MATRIX_ACCESSED = 'MATRIX_ACCESSED',
    MATRIX_EXPORTED = 'MATRIX_EXPORTED',
    AI_USED = 'AI_USED',

    // Sprint 4
    BAI_ANALYTICS_QUERY = 'BAI_ANALYTICS_QUERY',

    // System/Config (Inherited)
    STATUS_CHANGED = 'STATUS_CHANGED',
    REJECTED_TRANSITION = 'REJECTED_TRANSITION'
}

export enum EventSource {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SYSTEM = 'SYSTEM'
}

export interface ITrainingAuditLog extends Document {
    event_type: AuditEventType;
    user_id?: mongoose.Types.ObjectId;
    training_id?: mongoose.Types.ObjectId;
    training_record_id?: mongoose.Types.ObjectId;
    assessment_id?: mongoose.Types.ObjectId;
    previous_status?: string;
    new_status?: string;
    system_timestamp: Date;
    event_source: EventSource;
    metadata?: any;
    ip_address?: string;
}

const TrainingAuditLogSchema = new Schema<ITrainingAuditLog>({
    event_type: {
        type: String,
        enum: Object.values(AuditEventType),
        required: true,
        immutable: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        immutable: true
    },
    training_id: {
        type: Schema.Types.ObjectId,
        ref: 'TrainingMaster', // Linked to TrainingMaster
        immutable: true
    },
    training_record_id: {
        type: Schema.Types.ObjectId,
        ref: 'TrainingRecord',
        immutable: true
    },
    assessment_id: {
        type: Schema.Types.ObjectId,
        ref: 'AssessmentAttempt',
        immutable: true
    },
    previous_status: {
        type: String,
        immutable: true
    },
    new_status: {
        type: String,
        immutable: true
    },
    system_timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        immutable: true
    },
    event_source: {
        type: String,
        enum: Object.values(EventSource),
        required: true,
        immutable: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        immutable: true
    },
    ip_address: {
        type: String,
        immutable: true
    }
}, {
    timestamps: false
});

// Indexes for efficient querying
TrainingAuditLogSchema.index({ system_timestamp: -1 });
TrainingAuditLogSchema.index({ user_id: 1, system_timestamp: -1 });
TrainingAuditLogSchema.index({ training_id: 1, system_timestamp: -1 });
TrainingAuditLogSchema.index({ event_type: 1, system_timestamp: -1 });

// Prevent updates and deletes
TrainingAuditLogSchema.pre('save', function (this: ITrainingAuditLog) {
    if (!this.isNew) {
        throw new Error('Audit logs are immutable and cannot be updated');
    }
});

TrainingAuditLogSchema.pre('findOneAndUpdate', function () {
    throw new Error('Audit logs are immutable and cannot be updated');
});

TrainingAuditLogSchema.pre('findOneAndDelete', function () {
    throw new Error('Audit logs are immutable and cannot be deleted');
});

TrainingAuditLogSchema.pre('deleteOne', function () {
    throw new Error('Audit logs are immutable and cannot be deleted');
});

export const TrainingAuditLog = mongoose.model<ITrainingAuditLog>('TrainingAuditLog', TrainingAuditLogSchema);
