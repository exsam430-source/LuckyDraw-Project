import express from 'express';
import {
  getDrawReport,
  getParticipantsList,
  getWinnersList,
  getRevenueReport,
  downloadDrawReport,
  getUserActivityReport
} from '../controllers/reportController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Public winner list (for completed draws)
router.get('/draw/:drawId/winners', getWinnersList);

// Admin routes
router.get('/draw/:drawId', protect, isAdmin, getDrawReport);
router.get('/draw/:drawId/participants', protect, isAdmin, getParticipantsList);
router.get('/draw/:drawId/download', protect, isAdmin, downloadDrawReport);
router.get('/revenue', protect, isAdmin, getRevenueReport);
router.get('/users/activity', protect, isAdmin, getUserActivityReport);

export default router;