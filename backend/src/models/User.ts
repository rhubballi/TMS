import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'Trainee' | 'Trainer' | 'QA' | 'Administrator';
    department?: string;
    isVerified: boolean;
    verificationOTP?: string;
    otpExpiry?: Date;
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Trainee', 'Trainer', 'QA', 'Administrator'], default: 'Trainee' },
    department: {
        type: String,
        enum: [
            'R&D',
            'Clinical Research/Affairs',
            'Manufacturing',
            'Quality Assurance',
            'Quality Control',
            'Regulatory Affairs',
            'Pharmacovigilance',
            'Supply Chain & Logistics',
            'Engineering',
            'Sales & Marketing',
            'HR',
            'Finance',
            'IT',
            'Legal',
            'Other'
        ],
        required: false // Optional for Admin? Or required for everyone? safely optional for now to avoid breaking existing users
    },
    isVerified: { type: Boolean, default: false },
    verificationOTP: { type: String },
    otpExpiry: { type: Date },
}, { timestamps: true });

// Pre-save hook to hash password
UserSchema.pre('save', async function (this: IUser) {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
