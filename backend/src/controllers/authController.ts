import { Request, Response } from 'express';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import fs from 'fs';
import { sendVerificationEmail } from '../services/emailService';
import crypto from 'crypto';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
    const { name, email, password, role, department } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const user = await User.create({
            name,
            email,
            password,
            role,
            department,
            isVerified: false,
            verificationOTP: otp,
            otpExpiry
        });

        if (user) {
            // Send Verification Email
            try {
                await sendVerificationEmail(email, otp);
            } catch (emailErr) {
                console.error('Failed to send verification email:', emailErr);
                // We still created the user, they can try resend later
            }

            res.status(201).json({
                message: 'Registration successful. Please check your email for the verification OTP.',
                email: user.email
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        console.log(`Login attempt for email: ${email}`);
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found for email: ${email}`);
        } else {
            const isMatch = await user.matchPassword(password);
            console.log(`User found. Password match: ${isMatch}`);
        }

        if (user && (await user.matchPassword(password))) {
            if (!user.isVerified) {
                res.status(401).json({ message: 'Please verify your email before logging in.' });
                return;
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                token: generateToken(user._id.toString()),
            });
        } else {
            const reason = !user ? 'User not found' : 'Password mismatch';
            fs.appendFileSync('auth_errors.log', `[${new Date().toISOString()}] Login failed for ${email}: ${reason}\n`);
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (user.isVerified) {
            res.status(400).json({ message: 'User is already verified' });
            return;
        }

        if (user.verificationOTP !== otp) {
            res.status(400).json({ message: 'Invalid OTP' });
            return;
        }

        if (user.otpExpiry && user.otpExpiry < new Date()) {
            res.status(400).json({ message: 'OTP has expired' });
            return;
        }

        user.isVerified = true;
        user.verificationOTP = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({
            message: 'Email verified successfully',
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            token: generateToken(user._id.toString()),
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private (Protect)
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
