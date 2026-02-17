import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingRecord extends Document {
    user: mongoose.Types.ObjectId;
    training: mongoose.Types.ObjectId;
    documentLink?: mongoose.Types.ObjectId; // For document-driven trainings
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'OVERDUE' | 'LOCKED' | 'EXPIRED';
    assignedDate: Date;
    dueDate: Date;
    startedDate?: Date;
    completedDate?: Date;
    documentViewed: boolean;
    assessmentAttempts: number;
    lastAttemptDate?: Date;
    score?: number;
    passed: boolean;
    documentAcknowledged: boolean;
    acknowledgedAt?: Date;
    trainingMaster?: mongoose.Types.ObjectId;
    assignmentSource: 'manual' | 'system';
    assignedBy?: mongoose.Types.ObjectId;
    completedLate: boolean;
    expiryDate?: Date;
    certificateId?: string;
    certificateUrl?: string;
    resultGrade?: 'PASS' | 'EXCELLENT';
    createdAt?: Date;
    updatedAt?: Date;
}

const TrainingRecordSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    training: { type: Schema.Types.ObjectId, ref: 'Training' }, // Now optional
    trainingMaster: { type: Schema.Types.ObjectId, ref: 'TrainingMaster' },
    documentLink: { type: Schema.Types.ObjectId, ref: 'DocumentLink' },
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'OVERDUE', 'LOCKED', 'EXPIRED'], default: 'PENDING' },
    assignedDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    startedDate: { type: Date },
    completedDate: { type: Date },
    documentViewed: { type: Boolean, default: false },
    assessmentAttempts: { type: Number, default: 0 },
    lastAttemptDate: { type: Date },
    score: { type: Number },
    passed: { type: Boolean },
    documentAcknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    assignmentSource: { type: String, enum: ['manual', 'system'], default: 'manual' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedLate: { type: Boolean, default: false },
    expiryDate: { type: Date },
    certificateId: { type: String, unique: true, sparse: true },
    certificateUrl: { type: String },
    resultGrade: { type: String, enum: ['PASS', 'EXCELLENT'] }
}, { timestamps: true });

// Index for efficient queries
TrainingRecordSchema.index({ user: 1, training: 1 });
TrainingRecordSchema.index({ status: 1, dueDate: 1 });

// Sprint 3: Prevent deletion of terminal-state records
// URS-TMS-S3-010: Immutability enforcement
// Note: Using 'deleteOne' and 'remove' hooks to prevent deletion of terminal-state records
TrainingRecordSchema.pre('deleteOne', { document: true, query: false }, function (this: ITrainingRecord, next: any) {
    if (['COMPLETED', 'EXPIRED', 'LOCKED'].includes(this.status)) {
        return next(new Error('Training records with terminal status (COMPLETED, EXPIRED, LOCKED) cannot be deleted'));
    }
    next();
});

export default mongoose.model<ITrainingRecord>('TrainingRecord', TrainingRecordSchema);