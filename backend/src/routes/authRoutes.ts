import express from 'express';
import { loginUser, registerUser, getUsers, verifyOTP } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.get('/users', protect, getUsers);

export default router;
