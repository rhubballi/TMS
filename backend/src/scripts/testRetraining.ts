import mongoose from 'mongoose';
import TrainingMaster from '../models/TrainingMaster';
import Training from '../models/Training';
import TrainingRecord from '../models/TrainingRecord';
import User from '../models/User';
import { connectDB } from '../config/db';
import { triggerRetraining } from '../services/retrainingService';

const testRetraining = async () => {
    try {
        await connectDB();
        console.log('--- Starting Retraining Test ---');

        // 1. Setup Data
        const user = await User.create({
            name: 'Retrain Target',
            email: `retrain-${Date.now()}@example.com`,
            password: 'password123',
            role: 'Trainee',
            department: 'IT'
        });

        const timestamp = Date.now();
        const code = `SOP-RETR-${timestamp}`;

        // Master
        const master = await TrainingMaster.create({
            training_code: code,
            title: 'Retraining SOP',
            description: 'Testing Retraining',
            training_type: 'Document-driven',
            validity_period: 365,
            validity_unit: 'days',
            created_by: user._id
        });

        // Training V1
        const t1 = await Training.create({
            title: 'Retraining SOP v1',
            code: `${code}-V1`,
            version: '1.0',
            description: 'v1',
            purpose: 'v1 Purpose',
            type: 'Document-driven',
            trainingMaster: master._id,
            createdBy: user._id
        } as any);

        // Record V1 (COMPLETED)
        await TrainingRecord.create({
            user: user._id,
            training: t1._id,
            status: 'COMPLETED',
            completedDate: new Date(),
            dueDate: new Date(), // Required field
            assignmentSource: 'manual'
        } as any);

        console.log('[TEST] Created User and Completed V1 Training.');

        // 2. Create V2
        const t2 = await Training.create({
            title: 'Retraining SOP v2',
            code: `${code}-V2`,
            version: '2.0',
            description: 'v2',
            purpose: 'v2 Purpose',
            type: 'Document-driven',
            trainingMaster: master._id, // LINKED SAME MASTER
            createdBy: user._id
        } as any);

        console.log('[TEST] Created V2 Training. Triggering Retraining...');

        // 3. Trigger Retraining
        // Mock request object for audit
        const mockReq = { user: { _id: user._id, name: 'System Admin' } };

        await triggerRetraining(t2._id.toString(), mockReq);

        // 4. Verify Assignment
        const v2Record = await TrainingRecord.findOne({
            user: user._id,
            training: t2._id
        });

        if (v2Record) {
            console.log(`[PASS] Found V2 Record: ${v2Record._id}`);
            console.log(`[PASS] Status: ${v2Record.status}`);
            console.log(`[PASS] Source: ${v2Record.assignmentSource}`);
        } else {
            console.error('[FAIL] User was NOT assigned to V2!');
            process.exit(1);
        }

        // Cleanup
        await User.findByIdAndDelete(user._id);
        await TrainingMaster.findByIdAndDelete(master._id);
        await Training.deleteMany({ trainingMaster: master._id });
        await TrainingRecord.deleteMany({ user: user._id });

        console.log('--- Test Complete ---');
        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
};

testRetraining();
