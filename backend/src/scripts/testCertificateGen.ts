import mongoose from 'mongoose';
import TrainingMaster from '../models/TrainingMaster';
import Training from '../models/Training';
import TrainingRecord from '../models/TrainingRecord';
import User from '../models/User';
import { connectDB } from '../config/db';
import { generateCertificateId, generateCertificatePDF } from '../services/certificateService';
import fs from 'fs';
import path from 'path';

const testCertificateGen = async () => {
    try {
        await connectDB();

        console.log('--- Starting Certificate Gen Test ---');

        // 1. Mock Data
        const user = new User({
            name: 'Cert Test User',
            email: `cert-test-${Date.now()}@example.com`,
            password: 'password123',
            role: 'Trainee',
            department: 'IT'
        });

        const master = new TrainingMaster({
            training_code: 'CERT-001',
            title: 'Certificate Generation Protocol',
            description: 'Testing PDF Gen',
            training_type: 'Document-driven',
            validity_period: 365,
            validity_unit: 'days',
            created_by: new mongoose.Types.ObjectId() // Mock ID
        });

        const training = new Training({
            title: 'Certificate Gen Training',
            code: 'CERT-001',
            version: '2.0',
            description: 'Test Desc',
            purpose: 'Test Purpose',
            type: 'Document-driven',
            trainingMaster: master._id, // This needs to be ObjectId
            createdBy: new mongoose.Types.ObjectId()
        });

        // Mock Record
        const record = new TrainingRecord({
            user: user._id,
            training: training._id,
            status: 'COMPLETED',
            completedDate: new Date(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

        // 2. Test ID Generation
        const certId = generateCertificateId(user, training);
        console.log(`[TEST] Generated ID: ${certId}`);
        if (!certId.startsWith('CERT-001-CTU-')) {
            console.error('[FAIL] ID format incorrect');
            process.exit(1);
        }

        // 3. Test PDF Generation
        // We pass "record" which has _id
        const pdfUrl = await generateCertificatePDF(record, user, training, master);
        console.log(`[TEST] Generated PDF URL: ${pdfUrl}`);

        // Verify File Exists
        // record.certificateUrl is relative, e.g. /uploads/certificates/...
        const absolutePath = path.join(__dirname, '../../', pdfUrl);
        if (fs.existsSync(absolutePath)) {
            console.log('[PASS] PDF file exists on disk.');
        } else {
            console.error(`[FAIL] PDF file NOT found at ${absolutePath}`);
            process.exit(1);
        }

        console.log('--- Test Complete ---');
        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
};

testCertificateGen();
