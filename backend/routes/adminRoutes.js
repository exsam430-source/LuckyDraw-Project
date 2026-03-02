import express from 'express';
import {
  getDashboardStats, getAllUsers, getUserById, updateUserStatus,
  executeDraw, createAdminUser, cleanupDrawData,
  rollDraw, confirmDrawnToken, toggleLiveDraw, getDrawResults
} from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();
router.use(protect, isAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);

router.post('/draws/:id/execute', executeDraw);
router.post('/draws/:id/roll', rollDraw);              // NEW unified roll
router.post('/draws/:id/confirm-draw', confirmDrawnToken);
router.post('/draws/:id/toggle-live', toggleLiveDraw);
router.get('/draws/:id/results', getDrawResults);      // NEW results/PDF data
router.post('/draws/:id/cleanup', cleanupDrawData);

router.post('/create-admin', createAdminUser);

export default router;