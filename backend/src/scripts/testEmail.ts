import { sendVerificationEmail } from '../services/emailService';
import dotenv from 'dotenv';
import path from 'path';

// Load env from one level up (backend/.env)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function test() {
    console.log('Testing Email Service...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_USER:', process.env.SMTP_USER);

    try {
        const testEmail = process.env.SMTP_USER || 'test@example.com';
        console.log(`Sending test verification email to ${testEmail}...`);
        await sendVerificationEmail(testEmail, 'test-token-123');
        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('Failed to send test email:', error);
    }
}

test();
