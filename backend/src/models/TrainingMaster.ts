import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingMaster extends Document {
    training_code: string;
    title: string;
    description: string;
    training_type: 'Document-driven' | 'Role-based' | 'Instructor-led' | 'External / Certification';
    mandatory_flag: boolean;
    validity_period?: number;
    validity_unit: 'days' | 'months' | 'years';
    status: 'ACTIVE' | 'INACTIVE';
    created_by: mongoose.Types.ObjectId;
}

const TrainingMasterSchema: Schema = new Schema({
    training_code: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    training_type: {
        type: String,
        enum: ['Document-driven', 'Role-based', 'Instructor-led', 'External / Certification'],
        required: true
    },
    mandatory_flag: { type: Boolean, default: true },
    validity_period: { type: Number, default: null },
    validity_unit: {
        type: String,
        enum: ['days', 'months', 'years'],
        default: 'days'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<ITrainingMaster>('TrainingMaster', TrainingMasterSchema);
