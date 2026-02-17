import mongoose, { Document, Schema } from 'mongoose';

export interface IElectronicSignature extends Document {
    adminUser: mongoose.Types.ObjectId;
    actionType: string;
    reason: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

const ElectronicSignatureSchema = new Schema<IElectronicSignature>({
    adminUser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    actionType: {
        type: String,
        required: true,
        immutable: true
    },
    reason: {
        type: String,
        required: true,
        immutable: true
    },
    ipAddress: {
        type: String,
        immutable: true
    },
    userAgent: {
        type: String,
        immutable: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        immutable: true
    }
}, {
    timestamps: false
});

// Prevent updates and deletes
ElectronicSignatureSchema.pre('save', function (this: IElectronicSignature) {
    if (!this.isNew) {
        throw new Error('Electronic signatures are immutable and cannot be updated');
    }
});

ElectronicSignatureSchema.pre('findOneAndUpdate', function () {
    throw new Error('Electronic signatures are immutable');
});

ElectronicSignatureSchema.pre('findOneAndDelete', function () {
    throw new Error('Electronic signatures are immutable');
});

export const ElectronicSignature = mongoose.model<IElectronicSignature>('ElectronicSignature', ElectronicSignatureSchema);
