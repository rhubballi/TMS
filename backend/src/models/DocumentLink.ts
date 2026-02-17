import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentLink extends Document {
    training: mongoose.Types.ObjectId;
    documentId: string; // DMS document ID
    documentVersionId: string;
    versionString: string;
    effectiveDate: Date;
    isPrimary: boolean;
    linkedBy: mongoose.Types.ObjectId;
}

const DocumentLinkSchema: Schema = new Schema({
    training: { type: Schema.Types.ObjectId, ref: 'Training', required: true },
    documentId: { type: String, required: true },
    documentVersionId: { type: String, required: true },
    versionString: { type: String, required: true },
    effectiveDate: { type: Date, required: true },
    isPrimary: { type: Boolean, default: true },
    linkedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<IDocumentLink>('DocumentLink', DocumentLinkSchema);