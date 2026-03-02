import express from 'express';
import {
  getProfile,
  updateProfile,
  getAvailableDraws,
  getDrawDetails,
  getMyTokens,
  getMyPayments,
  getPaymentDetails,
  getMyReferrals,
  getDashboard,
  getResults
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Dashboard
router.get('/dashboard', getDashboard);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Draw routes
router.get('/draws', getAvailableDraws);
router.get('/draws/:id', getDrawDetails);

// Token routes
router.get('/tokens', getMyTokens);

// Payment routes
router.get('/payments', getMyPayments);
router.get('/payments/:id', getPaymentDetails);

// Referral routes
router.get('/referrals', getMyReferrals);

// Results routes
router.get('/results', getResults);

export default router;