import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
    text: string;
    type: 'mcq';
    options?: string[];
    correctAnswer: string;
}

export interface ITrainingSession extends Document {
    fileName: string;
    fileUrl: string;
    uploadDate: Date;
    documentText: string;
    questions: {
        mcq: { question: string; options: string[]; answer: string }[];
        shortAnswer: { question: string; answer?: string }[];
        trueFalse: { question: string; answer: boolean }[];
    };
    userAnswers?: any;
    evaluationResults?: {
        question: string;
        userAnswer: string;
        correct: boolean;
        correctAnswer: string;
    }[];
    score?: number;
    percentage?: number;
    feedback?: string;
    status: 'pending' | 'completed';
    user?: any;
    trainingRecord?: any;
}

// Check if we want to store questions in a flat list or grouped. The prompt requires specific counts, so grouped is easier to manage.
// However, the AI service returns them grouped.
// We should store the "Answer Key" inside the DB only.

const TrainingSessionSchema: Schema = new Schema({
    fileName: { type: String, required: true },
    fileUrl: { type: String },
    uploadDate: { type: Date, default: Date.now },
    documentText: { type: String, required: true },
    questions: {
        mcq: [{ question: String, options: [String], answer: String }],
        shortAnswer: [{ question: String, answer: String }], // Store model answer for reference, though AI evaluates fuzzy
        trueFalse: [{ question: String, answer: Boolean }]
    },
    userAnswers: { type: Object },
    evaluationResults: [{
        question: String,
        userAnswer: String,
        correct: Boolean,
        correctAnswer: String
    }],
    score: { type: Number },
    percentage: { type: Number },
    feedback: { type: String },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    trainingRecord: { type: Schema.Types.ObjectId, ref: 'TrainingRecord' }
});

export default mongoose.model<ITrainingSession>('TrainingSession', TrainingSessionSchema);
