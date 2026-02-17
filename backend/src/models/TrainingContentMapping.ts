import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingContentMapping extends Document {
    training_master_id: mongoose.Types.ObjectId;
    content_type: 'PDF' | 'LINK' | 'TEXT';
    content_source: string;
    read_only_flag: boolean;
    active: boolean;
    created_at: Date;
}

const TrainingContentMappingSchema: Schema = new Schema({
    training_master_id: { type: Schema.Types.ObjectId, ref: 'TrainingMaster', required: true, index: true },
    content_type: { type: String, enum: ['PDF', 'LINK', 'TEXT'], required: true },
    content_source: { type: String, required: true },
    read_only_flag: { type: Boolean, default: true },
    active: { type: Boolean, default: true } // Latest one for a training_master_id
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// Ensure append-only by not allowing updates, only creation
// Logic to manage 'active' flag will be in the controller

export default mongoose.model<ITrainingContentMapping>('TrainingContentMapping', TrainingContentMappingSchema);
