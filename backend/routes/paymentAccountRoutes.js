import express from 'express';
import {
  createPaymentAccount,
  getAllPaymentAccounts,
  updatePaymentAccount,
  deletePaymentAccount,
  setPrimaryAccount,
  getActivePaymentAccounts
} from '../controllers/paymentAccountController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { uploadQRCode, handleUploadError } from '../middlewares/upload.js';

const router = express.Router();

// Public / User route
router.get('/active', getActivePaymentAccounts);

// Admin routes
router.get('/', protect, isAdmin, getAllPaymentAccounts);
router.post('/', protect, isAdmin, uploadQRCode, handleUploadError, createPaymentAccount);
router.put('/:id', protect, isAdmin, uploadQRCode, handleUploadError, updatePaymentAccount);
router.delete('/:id', protect, isAdmin, deletePaymentAccount);
router.patch('/:id/primary', protect, isAdmin, setPrimaryAccount);

export default router;