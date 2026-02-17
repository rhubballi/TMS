import mongoose, { Schema, Document } from 'mongoose';

export interface ITraining extends Document {
    code: string;
    title: string;
    description: string;
    purpose: string;
    type: 'Document-driven' | 'Role-based' | 'Instructor-led' | 'External';
    mandatory: boolean;
    version?: string; // e.g. "1.0"
    active: boolean;
    createdBy: mongoose.Types.ObjectId;
    trainingMaster?: mongoose.Types.ObjectId;
    content?: {
        fileName: string;
        fileUrl: string;
        text: string;
        questions: {
            shortAnswer: Array<{ question: string, answer: string }>;
            mcq: Array<{ question: string, options: string[], correctAnswer: string }>;
            trueFalse: Array<{ question: string, answer: boolean }>;
        };
    };
}

const TrainingSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    purpose: { type: String, required: true },
    type: { type: String, enum: ['Document-driven', 'Role-based', 'Instructor-led', 'External'], required: true },
    mandatory: { type: Boolean, default: true },
    version: { type: String, default: "1.0" },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    trainingMaster: { type: Schema.Types.ObjectId, ref: 'TrainingMaster' },
    content: {
        fileName: String,
        fileUrl: String,
        text: String,
        questions: {
            shortAnswer: [{ question: String, answer: String }],
            mcq: [{ question: String, options: [String], correctAnswer: String }],
            trueFalse: [{ question: String, answer: Boolean }]
        }
    }
}, { timestamps: true });

export default mongoose.model<ITraining>('Training', TrainingSchema);