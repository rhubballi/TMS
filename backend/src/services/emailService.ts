import emailjs from '@emailjs/nodejs';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || '';
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || '';
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || '';

export const sendVerificationEmail = async (email: string, otp: string) => {
    const templateId = process.env.EMAILJS_TEMPLATE_ID_VERIFY || '';

    const templateParams = {
        to_email: email,
        otp: otp,
        user_email: email,
        email: email,
        from_name: 'TMS Admin'
    };

    try {
        if (!EMAILJS_SERVICE_ID || !templateId) {
            console.warn('EmailJS not configured. Falling back to console log for development.');
            console.log('--- EMAIL VERIFICATION OTP ---');
            console.log(`To: ${email}`);
            console.log(`OTP: ${otp}`);
            console.log('-------------------------------');
            return;
        }

        await emailjs.send(
            EMAILJS_SERVICE_ID,
            templateId,
            templateParams,
            {
                publicKey: EMAILJS_PUBLIC_KEY,
                privateKey: EMAILJS_PRIVATE_KEY,
            }
        );
        fs.appendFileSync('email_debug.log', `[${new Date().toISOString()}] EmailJS Success: Verification OTP sent to ${email}\n`);
        console.log(`Verification OTP sent to ${email}`);
    } catch (error: any) {
        const errorDetail = error.text || JSON.stringify(error) || 'Unknown error';
        fs.appendFileSync('email_debug.log', `[${new Date().toISOString()}] EmailJS Error (Verify OTP): ${email} - ${errorDetail}\n`);
        console.error('Error sending verification OTP:', error);
        throw error;
    }
};

export const sendDocumentAssignmentEmail = async (email: string, docTitle: string) => {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
    const templateId = process.env.EMAILJS_TEMPLATE_ID_ASSIGN || '';

    const templateParams = {
        to_email: email,
        user_email: email,
        email: email,
        document_title: docTitle,
        dashboard_url: dashboardUrl,
        from_name: 'TMS Admin'
    };

    try {
        if (!EMAILJS_SERVICE_ID || !templateId) {
            console.warn('EmailJS not configured. Falling back to console log for development.');
            console.log(`Assignment Email to ${email}: ${docTitle}`);
            return;
        }

        await emailjs.send(
            EMAILJS_SERVICE_ID,
            templateId,
            templateParams,
            {
                publicKey: EMAILJS_PUBLIC_KEY,
                privateKey: EMAILJS_PRIVATE_KEY,
            }
        );
        fs.appendFileSync('email_debug.log', `[${new Date().toISOString()}] EmailJS Success: Assignment sent to ${email}\n`);
        console.log(`Assignment email sent to ${email}`);
    } catch (error: any) {
        const errorDetail = error.text || JSON.stringify(error) || 'Unknown error';
        fs.appendFileSync('email_debug.log', `[${new Date().toISOString()}] EmailJS Error (Assign): ${email} - ${errorDetail}\n`);
        console.error('Error sending assignment email:', error);
        throw error;
    }
};
