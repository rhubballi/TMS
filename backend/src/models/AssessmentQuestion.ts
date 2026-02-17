import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessmentQuestion extends Document {
    assessment: mongoose.Types.ObjectId;
    question_text: string;
    options: string[];
    correct_answer: string;
    createdAt: Date;
    updatedAt: Date;
}

const AssessmentQuestionSchema = new Schema<IAssessmentQuestion>({
    assessment: {
        type: Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true,
        immutable: true
    },
    question_text: {
        type: String,
        required: true,
        immutable: true
    },
    options: {
        type: [String],
        required: true,
        immutable: true
    },
    correct_answer: {
        type: String,
        required: true,
        select: false, // Security: Never expose by default
        immutable: true
    }
}, { timestamps: true });

// Strict Immutability per Sprint 2 rules
AssessmentQuestionSchema.pre('save', async function (this: any) {
    if (!this.isNew) {
        throw new Error('Assessment questions are immutable and cannot be updated');
    }
});

AssessmentQuestionSchema.pre('findOneAndUpdate', async function () {
    throw new Error('Assessment questions are immutable once created');
});

AssessmentQuestionSchema.pre('findOneAndDelete', async function () {
    throw new Error('Assessment questions cannot be deleted');
});

AssessmentQuestionSchema.pre('deleteMany', async function () {
    // Only allow deletion if training is being reset or handled via specific admin flow (if any)
    // But for Sprint 2 hardening, we block it unless we have a specific reason.
    // However, the current code in assessmentController.ts uses deleteMany before update.
    // To allow the "Update" flow (which is allowed if no attempts exist), we need careful logic.
});

export default mongoose.model<IAssessmentQuestion>('AssessmentQuestion', AssessmentQuestionSchema);
