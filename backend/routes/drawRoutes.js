import express from 'express';
import {
  createDraw, getAllDrawsAdmin, getDrawByIdAdmin, updateDraw, deleteDraw,
  getPublicDraws, getDrawById, changeDrawStatus, getLiveDrawState
} from '../controllers/drawController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Admin — literal paths first
router.get('/admin/all', protect, isAdmin, getAllDrawsAdmin);
router.get('/admin/:id', protect, isAdmin, getDrawByIdAdmin);

// Public
router.get('/', getPublicDraws);
router.get('/:id', getDrawById);
router.get('/:id/live', getLiveDrawState);

// Admin write
router.post('/', protect, isAdmin, createDraw);
router.put('/:id', protect, isAdmin, updateDraw);
router.delete('/:id', protect, isAdmin, deleteDraw);
router.patch('/:id/status', protect, isAdmin, changeDrawStatus);

export default router;