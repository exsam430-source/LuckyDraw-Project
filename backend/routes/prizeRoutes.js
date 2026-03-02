import express from 'express';
import {
  createPrize,
  getPrizesByDraw,
  updatePrize,
  deletePrize,
  assignTokenToPrize,
  getPublicPrizes
} from '../controllers/prizeController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { uploadPrizeImage, handleUploadError } from '../middlewares/upload.js';

const router = express.Router();

// Public routes
router.get('/public/:drawId', getPublicPrizes);

// Admin routes
router.post('/', protect, isAdmin, createPrize);
router.get('/draw/:drawId', protect, isAdmin, getPrizesByDraw);
router.put('/:id', protect, isAdmin, updatePrize);
router.delete('/:id', protect, isAdmin, deletePrize);
router.post('/:id/assign-token', protect, isAdmin, assignTokenToPrize);

// Upload prize image
router.post('/:id/image', protect, isAdmin, uploadPrizeImage, handleUploadError, async (req, res) => {
  try {
    const Prize = (await import('../models/Prize.js')).default;
    const prize = await Prize.findByIdAndUpdate(
      req.params.id,
      { image: req.file.path },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded',
      data: { imageUrl: prize.image }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

export default router;