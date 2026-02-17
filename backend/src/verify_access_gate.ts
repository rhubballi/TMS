import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Assessment from './models/Assessment';
import AssessmentQuestion from './models/AssessmentQuestion';
import TrainingRecord from './models/TrainingRecord';
import TrainingMaster from './models/TrainingMaster';
import User from './models/User';
import { connectDB } from './config/db';

async function verifyAccessGate() {
    console.log('--- STARTING ACCESS GATE VERIFICATION ---');
    await connectDB();

    try {
        // 1. Setup Test Data
        console.log('\n[1] Setting up test data...');
        let testAdmin = await User.findOne({ role: 'Administrator' });
        if (!testAdmin) {
            testAdmin = await User.create({
                name: 'Admin Test',
                email: 'admin_test@example.com',
                password: 'password123',
                role: 'Administrator',
                isVerified: true
            });
        }

        let testUser = await User.findOne({ role: 'Trainee' });
        if (!testUser) {
            testUser = await User.create({
                name: 'User Test',
                email: 'user_test@example.com',
                password: 'password123',
                role: 'Trainee',
                isVerified: true
            });
        }

        const timestamp = Date.now();
        const testTraining = await TrainingMaster.create({
            training_code: 'GATE-' + timestamp,
            title: 'Gate Test Training ' + timestamp,
            description: 'Testing Access Gate',
            training_type: 'Role-based',
            mandatory_flag: true,
            validity_period: 365,
            validity_unit: 'days',
            status: 'ACTIVE',
            created_by: testAdmin._id
        });

        const assessment = await Assessment.create({
            training: testTraining._id,
            pass_percentage: 80,
            max_attempts: 3
        });

        await AssessmentQuestion.create({
            assessment: assessment._id,
            question_text: 'Test Question?',
            options: ['A', 'B', 'C', 'D'],
            correct_answer: 'A'
        });

        console.log('Setup complete.');

        // 2. Test Logic (Simulated Controller Logic)
        const checkAccess = async (userId: string, role: string, trainingId: string) => {
            const isAdmin = role === 'Administrator';
            if (isAdmin) return { allowed: true, reason: 'Admin bypass' };

            const record = await TrainingRecord.findOne({ user: userId, training: trainingId });
            if (!record) return { allowed: false, reason: 'NOT_ASSIGNED' };
            if (!record.documentViewed) return { allowed: false, reason: 'DOC_NOT_VIEWED' };
            if (['FAILED', 'LOCKED'].includes(record.status)) return { allowed: false, reason: `STATUS_${record.status}` };

            return { allowed: true, reason: 'All checks passed' };
        };

        // Scenario A: Not Assigned
        console.log('\n[Scenario A] Training not assigned...');
        let res = await checkAccess(testUser._id.toString(), testUser.role, testTraining._id.toString());
        console.log(`Allowed: ${res.allowed}, Reason: ${res.reason}`);
        if (!res.allowed && res.reason === 'NOT_ASSIGNED') console.log('SUCCESS: Access blocked as expected.');

        // Scenario B: Assigned but not viewed
        console.log('\n[Scenario B] Assigned but not viewed...');
        const record = await TrainingRecord.create({
            user: testUser._id,
            training: testTraining._id,
            dueDate: new Date(Date.now() + 86400000),
            status: 'PENDING',
            documentViewed: false
        });
        res = await checkAccess(testUser._id.toString(), testUser.role, testTraining._id.toString());
        console.log(`Allowed: ${res.allowed}, Reason: ${res.reason}`);
        if (!res.allowed && res.reason === 'DOC_NOT_VIEWED') console.log('SUCCESS: Access blocked as expected.');

        // Scenario C: Locked Status
        console.log('\n[Scenario C] Status is LOCKED...');
        record.documentViewed = true;
        record.status = 'LOCKED';
        await record.save();
        res = await checkAccess(testUser._id.toString(), testUser.role, testTraining._id.toString());
        console.log(`Allowed: ${res.allowed}, Reason: ${res.reason}`);
        if (!res.allowed && res.reason === 'STATUS_LOCKED') console.log('SUCCESS: Access blocked as expected.');

        // Scenario D: All prerequisites met
        console.log('\n[Scenario D] All prerequisites met...');
        record.status = 'IN_PROGRESS';
        await record.save();
        res = await checkAccess(testUser._id.toString(), testUser.role, testTraining._id.toString());
        console.log(`Allowed: ${res.allowed}, Reason: ${res.reason}`);
        if (res.allowed) console.log('SUCCESS: Access granted as expected.');

        // Scenario E: Admin bypass
        console.log('\n[Scenario E] Admin bypass...');
        res = await checkAccess(testAdmin._id.toString(), testAdmin.role, testTraining._id.toString());
        console.log(`Allowed: ${res.allowed}, Reason: ${res.reason}`);
        if (res.allowed) console.log('SUCCESS: Admin bypass confirmed.');

        // 3. Cleanup
        console.log('\n[3] Cleaning up test data...');
        await AssessmentQuestion.deleteMany({ assessment: assessment._id });
        await Assessment.deleteOne({ _id: assessment._id });
        await TrainingRecord.deleteOne({ _id: record._id });
        await TrainingMaster.deleteOne({ _id: testTraining._id });
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n--- VERIFICATION FINISHED ---');
    }
}

verifyAccessGate();
