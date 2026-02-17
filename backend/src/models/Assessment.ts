import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessment extends Document {
    training: mongoose.Types.ObjectId;
    pass_percentage: number;
    max_attempts: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AssessmentSchema: Schema = new Schema({
    training: {
        type: Schema.Types.ObjectId,
        ref: 'Training',
        required: true,
        unique: true,
        immutable: true
    },
    pass_percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    max_attempts: {
        type: Number,
        required: true,
        min: 1
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// NON-NEGOTIABLE IMMUTABILITY: Prevent modification of assessment config via generic methods
AssessmentSchema.pre('findOneAndUpdate', async function () {
    throw new Error('Assessment configuration is immutable via generic update. Changes must be justified and strictly authorized.');
});

AssessmentSchema.pre('findOneAndDelete', async function () {
    throw new Error('Assessment configuration cannot be deleted once created.');
});

export default mongoose.model<IAssessment>('Assessment', AssessmentSchema);
