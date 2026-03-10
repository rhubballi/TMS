
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { TrainingAuditLog } from '../models/TrainingAuditLog';

// Load env from the correct location
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runDiagnostic() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/tms';
    console.log('--- Environment Check ---');
    console.log('MONGO_URI from Env:', process.env.MONGO_URI ? 'FOUND' : 'NOT FOUND');
    console.log('Connecting to:', uri);

    try {
        await mongoose.connect(uri);
        console.log('--- Connection Info ---');
        console.log('DB Name:', mongoose.connection.name);
        console.log('Ready State:', mongoose.connection.readyState);

        console.log('--- Collection List ---');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available Collections:', collections.map(c => c.name));

        console.log('--- Mongoose Model Query ---');
        const count = await TrainingAuditLog.countDocuments({});
        console.log('TrainingAuditLog.countDocuments({}):', count);

        if (count > 0) {
            const sample = await TrainingAuditLog.findOne({});
            console.log('Sample Log Date:', sample?.system_timestamp);
            console.log('Sample Log Type:', sample?.event_type);
        } else {
            console.log('Attempting raw collection query...');
            const rawCount = await mongoose.connection.db.collection('trainingauditlogs').countDocuments({});
            console.log('Raw trainingauditlogs count:', rawCount);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('DIAGNOSTIC FAILED:', err);
    }
}

runDiagnostic();
