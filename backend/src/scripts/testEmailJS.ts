import dotenv from 'dotenv';
import path from 'path';
import { sendVerificationEmail } from '../services/emailService';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runTest() {
    const testEmail = 'rakshahubballi08@gmail.com';
    const testToken = 'verify-final-test-456';

    console.log('--- RE-TESTING EmailJS Integration ---');
    try {
        await sendVerificationEmail(testEmail, testToken);
        console.log('✅ Dispatch sent. Check email_debug.log');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

runTest();
