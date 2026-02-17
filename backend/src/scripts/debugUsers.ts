import User from '../models/User';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function debugUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tms_db');
        const users = await User.find({});
        const logData = users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            department: u.department,
            verified: u.isVerified
        }));
        fs.writeFileSync('users_debug.json', JSON.stringify(logData, null, 2));
        console.log('Debug info written to users_debug.json');
    } catch (error) {
        console.error('Debug users failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugUsers();
