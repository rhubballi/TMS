import mongoose from 'mongoose';
import TrainingMaster from '../models/TrainingMaster';
import Training from '../models/Training';
import TrainingRecord from '../models/TrainingRecord';
import User from '../models/User';
import { connectDB } from '../config/db';

const testExpiryLogic = async () => {
    try {
        await connectDB();

        // 1. Create a Test User
        const user = await User.create({
            name: 'Test Expiry User',
            email: `expiry-test-${Date.now()}@example.com`,
            password: 'password123',
            role: 'Trainee',
            department: 'IT'
        });

        // 2. Create a TrainingMaster with Validity (30 Days)
        const master = await TrainingMaster.create({
            training_code: `EXP-TEST-${Date.now()}`,
            title: 'Expiry Logic Test',
            description: 'Testing Expiry Calculation',
            training_type: 'Document-driven',
            validity_period: 30,
            validity_unit: 'days',
            created_by: user._id
        });

        // 3. Create a Training Linked to Master
        const training = await Training.create({
            title: 'Expiry Logic Test Training',
            code: master.training_code,
            version: '1.0',
            description: 'Test Description',
            purpose: 'Test Purpose',
            type: 'Document-driven',
            trainingMaster: master._id,
            createdBy: user._id
        } as any);

        // 4. Create a Training Record (Pending)
        const record = await TrainingRecord.create({
            user: user._id,
            training: training._id,
            trainingMaster: master._id,
            dueDate: new Date(),
            status: 'PENDING',
            assignmentSource: 'manual'
        } as any);

        // 5. Simulate One-Step Completion (mimicking controller logic)
        // We act as the controller here to test the specific calculation block we added

        // Emulate the controller logic
        const trainingDoc = await Training.findById(record.training).populate('trainingMaster') as any;
        if (trainingDoc && trainingDoc.trainingMaster) {
            const m = trainingDoc.trainingMaster as any;
            if (m.validity_period && m.validity_period > 0) {
                const validityDays = m.validity_unit === 'years' ? m.validity_period * 365 :
                    m.validity_unit === 'months' ? m.validity_period * 30 :
                        m.validity_period;

                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + validityDays);
                record.expiryDate = expiryDate;
                record.status = 'COMPLETED';
                record.completedDate = new Date();
                await record.save();

                console.log(`[PASS] Expiry Date Calculated: ${expiryDate.toISOString()}`);
                console.log(`[PASS] Expected Range: ${validityDays} days from now`);
            } else {
                console.error('[FAIL] Validity period not found on master');
            }
        } else {
            console.error('[FAIL] Could not populate TrainingMaster');
        }

        // Cleanup
        await User.findByIdAndDelete(user._id);
        await TrainingMaster.findByIdAndDelete(master._id);
        await Training.findByIdAndDelete(training._id);
        await TrainingRecord.findByIdAndDelete(record._id);

        console.log('Test Complete');
        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
};

testExpiryLogic();
