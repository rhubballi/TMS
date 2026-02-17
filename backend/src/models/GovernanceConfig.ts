import mongoose, { Document, Schema } from 'mongoose';

export interface IGovernanceConfig extends Document {
    version: number;
    name: string;
    description?: string;
    config: Record<string, any>;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    signatureId: mongoose.Types.ObjectId; // Link to the ElectronicSignature that authorized this version
}

const GovernanceConfigSchema = new Schema<IGovernanceConfig>({
    version: {
        type: Number,
        required: true,
        immutable: true
    },
    name: {
        type: String,
        required: true,
        immutable: true
    },
    description: {
        type: String,
        immutable: true
    },
    config: {
        type: Schema.Types.Mixed,
        required: true,
        immutable: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
        immutable: true
    },
    signatureId: {
        type: Schema.Types.ObjectId,
        ref: 'ElectronicSignature',
        required: true,
        immutable: true
    }
}, {
    timestamps: false
});

// Ensure (version, name) uniqueness is handled by logic, but version alone should be unique for easy reference
GovernanceConfigSchema.index({ version: 1 }, { unique: true });
GovernanceConfigSchema.index({ isActive: 1 });

// Prevent updates and deletes (Versioning principle)
GovernanceConfigSchema.pre('save', function (this: IGovernanceConfig) {
    if (!this.isNew && this.isModified('version')) {
        throw new Error('Governance configuration versions are immutable.');
    }
});

GovernanceConfigSchema.pre('findOneAndDelete', function () {
    throw new Error('Governance configuration versions cannot be deleted.');
});

export const GovernanceConfig = mongoose.model<IGovernanceConfig>('GovernanceConfig', GovernanceConfigSchema);
