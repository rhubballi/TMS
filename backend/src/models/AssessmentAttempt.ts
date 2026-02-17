import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessmentAttempt extends Document {
    training: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    attempt_number: number;
    answers: Map<string, string>;
    score: number;
    result: 'PASS' | 'FAIL';
    attempted_at: Date;
}

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>({
    training: {
        type: Schema.Types.ObjectId,
        ref: 'Training',
        required: true,
        immutable: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    attempt_number: {
        type: Number,
        required: true,
        immutable: true
    },
    answers: {
        type: Map,
        of: String,
        required: true,
        immutable: true
    },
    score: {
        type: Number,
        required: true,
        immutable: true
    },
    result: {
        type: String,
        enum: ['PASS', 'FAIL'],
        required: true,
        immutable: true
    }
}, {
    timestamps: { createdAt: 'attempted_at', updatedAt: false }
});

// NON-NEGOTIABLE IMMUTABILITY: Block all updates and deletes
AssessmentAttemptSchema.pre('save', async function (this: any) {
    if (!this.isNew) {
        throw new Error('Assessment attempt is immutable and cannot be updated');
    }
});

AssessmentAttemptSchema.pre('findOneAndUpdate', async function () {
    throw new Error('Assessment attempts are immutable and cannot be updated');
});

AssessmentAttemptSchema.pre('findOneAndDelete', async function () {
    throw new Error('Assessment attempts are immutable and cannot be deleted');
});

AssessmentAttemptSchema.pre('deleteOne', { document: true, query: true } as any, async function () {
    throw new Error('Assessment attempts are immutable and cannot be deleted');
});

export default mongoose.model<IAssessmentAttempt>('AssessmentAttempt', AssessmentAttemptSchema);
