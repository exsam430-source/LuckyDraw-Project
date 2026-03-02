import express from 'express';
import {
  getMyReferralInfo,
  validateReferralCode,
  getAllReferrals,
  getTopReferrers,
  awardReferralPoints
} from '../controllers/referralController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Public routes
router.get('/validate/:code', validateReferralCode);

// User routes
router.get('/my', protect, getMyReferralInfo);

// Admin routes
router.get('/admin/all', protect, isAdmin, getAllReferrals);
router.get('/admin/top', protect, isAdmin, getTopReferrers);
router.post('/admin/award', protect, isAdmin, awardReferralPoints);

export default router;