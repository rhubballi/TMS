import mongoose from 'mongoose';
import TrainingRecord from '../models/TrainingRecord';
import Training from '../models/Training';
import User from '../models/User';
import Notification from '../models/Notification';
import { connectDB } from '../config/db';
import { checkTrainingReminders, checkExpiryWarnings } from '../services/schedulerService';

const testNotifications = async () => {
    try {
        await connectDB();
        console.log('--- Starting Notification Test ---');

        // 1. Setup Mock User
        const user = await User.create({
            name: 'Notif Test',
            email: `notif-${Date.now()}@example.com`,
            password: 'password123',
            role: 'Trainee',
            department: 'IT'
        });

        // 2. Create Training
        const training = await Training.create({
            title: 'Notif Training',
            code: `NOT-${Date.now()}`,
            version: '1.0',
            description: 'desc',
            purpose: 'purpose',
            type: 'Document-driven',
            createdBy: user._id
        } as any);

        // 3. Create Record DUE IN 7 DAYS
        const due7 = new Date();
        due7.setDate(due7.getDate() + 7);

        await TrainingRecord.create({
            user: user._id,
            training: training._id,
            status: 'PENDING',
            assignedDate: new Date(),
            dueDate: due7,
            assignmentSource: 'manual'
        });

        // 4. Create Record EXPIRING IN 30 DAYS
        const expiring30 = new Date();
        expiring30.setDate(expiring30.getDate() + 30);

        await TrainingRecord.create({
            user: user._id,
            training: training._id,
            status: 'COMPLETED', // valid
            completedDate: new Date(),
            dueDate: new Date(),
            expiryDate: expiring30,
            assignmentSource: 'manual'
        });

        // 5. Run Schedulers
        await checkTrainingReminders();
        await checkExpiryWarnings();

        // 6. Verify In-App Notifications
        const notifs = await Notification.find({ userId: user._id });
        console.log(`[TEST] Found ${notifs.length} notifications.`);

        const dueSoon = notifs.find(n => n.type === 'info' && n.title === 'Training Due Soon');
        if (dueSoon) console.log('[PASS] Due Soon notification found.');
        else console.error('[FAIL] Due Soon notification MISSING.');

        const expirySoon = notifs.find(n => n.type === 'info' && n.title === 'Certificate Expiring');
        if (expirySoon) console.log('[PASS] Expiry Warning notification found.');
        else console.error('[FAIL] Expiry Warning notification MISSING.');

        // Cleanup
        await User.findByIdAndDelete(user._id);
        await Training.findByIdAndDelete(training._id);
        await TrainingRecord.deleteMany({ user: user._id });
        await Notification.deleteMany({ userId: user._id });

        console.log('--- Test Complete ---');
        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
};

testNotifications();
