import Payment from '../models/Payment.js';
import { deleteImage } from '../config/cloudinary.js';

/**
 * Delete all payment screenshots from Cloudinary for a completed draw
 * and clear screenshot data from DB.
 * Keeps: payment records, tokens, prizes, draw info, winners.
 */
export const cleanupDrawScreenshots = async (drawId) => {
  try {
    const payments = await Payment.find({
      draw: drawId,
      screenshotPublicId: { $exists: true, $ne: '' }
    });

    let deletedCount = 0;
    const errors = [];

    for (const payment of payments) {
      if (payment.screenshotPublicId) {
        const result = await deleteImage(payment.screenshotPublicId);
        if (result.success) {
          deletedCount++;
        } else {
          errors.push({ paymentId: payment._id, error: result.error });
        }
      }
    }

    // Clear screenshot references from all payments in this draw
    await Payment.updateMany(
      { draw: drawId },
      {
        $set: {
          screenshotUrl: '',
          screenshotPublicId: ''
        }
      }
    );

    console.log(`✅ Cleanup complete for draw ${drawId}: ${deletedCount} screenshots deleted`);

    return {
      success: true,
      deletedCount,
      totalPayments: payments.length,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('Cleanup Error:', error);
    return { success: false, error: error.message };
  }
};