import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingCertificate extends Document {
    certificateId: string;
    user: mongoose.Types.ObjectId;
    training: mongoose.Types.ObjectId;
    trainingRecord: mongoose.Types.ObjectId;
    issueDate: Date;
    expiryDate?: Date;
    score: number;
    resultGrade: 'PASS' | 'EXCELLENT';
    certificateUrl: string;
    metadata?: any;
}

const TrainingCertificateSchema: Schema = new Schema({
    certificateId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    training: { type: Schema.Types.ObjectId, ref: 'Training', required: true },
    trainingRecord: { type: Schema.Types.ObjectId, ref: 'TrainingRecord', required: true },
    issueDate: { type: Date, default: Date.now, required: true },
    expiryDate: { type: Date },
    score: { type: Number, required: true },
    resultGrade: { type: String, enum: ['PASS', 'EXCELLENT'], required: true },
    certificateUrl: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed }
}, {
    timestamps: true,
    collection: 'trainingcertificates' // Explicitly name the collection
});

// Indexes for performance and uniqueness
TrainingCertificateSchema.index({ user: 1, training: 1 }, { unique: true });
TrainingCertificateSchema.index({ certificateId: 1 });

export default mongoose.model<ITrainingCertificate>('TrainingCertificate', TrainingCertificateSchema);
