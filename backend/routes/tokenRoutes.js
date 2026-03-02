import express from 'express';
import {
  getTokensByDraw,
  getTokenById,
  getMyTokens,
  getMyTokensForDraw,
  getTokenSummary,
  getWinningTokens
} from '../controllers/tokenController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// User routes
router.get('/my', protect, getMyTokens);
router.get('/my/draw/:drawId', protect, getMyTokensForDraw);

// Public route
router.get('/draw/:drawId/winners', getWinningTokens);

// Admin routes
router.get('/draw/:drawId', protect, isAdmin, getTokensByDraw);
router.get('/draw/:drawId/summary', protect, isAdmin, getTokenSummary);
router.get('/:id', protect, isAdmin, getTokenById);

export default router;