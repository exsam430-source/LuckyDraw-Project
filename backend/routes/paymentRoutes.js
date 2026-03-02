import express from 'express';
import {
  createPayment,
  getAllPaymentsAdmin,
  getPaymentByIdAdmin,
  approvePayment,
  rejectPayment,
  getMyPayments,
  getPaymentReceipt
} from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { uploadPaymentScreenshot, handleUploadError } from '../middlewares/upload.js';

const router = express.Router();

// User routes
router.post('/', protect, uploadPaymentScreenshot, handleUploadError, createPayment);
router.get('/my', protect, getMyPayments);
router.get('/:id/receipt', protect, getPaymentReceipt);

// Admin routes
router.get('/admin/all', protect, isAdmin, getAllPaymentsAdmin);
router.get('/admin/:id', protect, isAdmin, getPaymentByIdAdmin);
router.post('/:id/approve', protect, isAdmin, approvePayment);
router.post('/:id/reject', protect, isAdmin, rejectPayment);

export default router;