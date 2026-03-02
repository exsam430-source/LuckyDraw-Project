import express from 'express';
import {
  register,
  login,
  verifyOTP,
  resendOTP,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  logout
} from '../controllers/authController.js';
import { protect, protectUnverified } from '../middlewares/authMiddleware.js';
import {
  validateRegister,
  validateLogin,
  validateOTP,
  validate
} from '../validators/authValidator.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, validate, register);
router.post('/login', validateLogin, validate, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword); // NOW PUBLIC — uses email+otp

// Protected routes (unverified allowed)
router.post('/verify-otp', protectUnverified, validateOTP, validate, verifyOTP);
router.post('/resend-otp', protectUnverified, resendOTP);

// Protected routes (verified required)
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

export default router;