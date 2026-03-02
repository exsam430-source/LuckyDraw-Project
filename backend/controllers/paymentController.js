import Payment from '../models/Payment.js';
import Draw from '../models/Draw.js';
import Token from '../models/Token.js';
import User from '../models/User.js';
import Referral from '../models/Referral.js';
import { deleteImage } from '../config/cloudinary.js';
import { sendPaymentConfirmation } from '../utils/smsService.js';

// @desc    Create payment request (User)
// @route   POST /api/payments
// @access  User
export const createPayment = async (req, res) => {
  try {
    const {
      drawId,
      paymentMethod,
      numberOfTokens,
      transactionId,
      useReferralPoints
    } = req.body;

    // Check if draw exists and is active
    const draw = await Draw.findById(drawId);
    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    if (draw.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Draw is not active for purchases'
      });
    }

    // Parse numberOfTokens
    const numTokens = parseInt(numberOfTokens) || 1;

    // Check remaining tokens
    const remainingTokens = draw.totalTokens - draw.tokensSold;
    if (remainingTokens < numTokens) {
      return res.status(400).json({
        success: false,
        message: `Only ${remainingTokens} tokens remaining`
      });
    }

    // Check user's token limit for this draw
    const userTokenCount = await Token.countDocuments({
      draw: drawId,
      user: req.user._id
    });

    const canBuy = draw.maxTokensPerUser - userTokenCount;
    if (numTokens > canBuy) {
      return res.status(400).json({
        success: false,
        message: `You can only buy ${canBuy} more tokens for this draw`
      });
    }

    // Check for pending payments
    const pendingPayment = await Payment.findOne({
      user: req.user._id,
      draw: drawId,
      status: 'pending'
    });

    if (pendingPayment) {
      return res.status(400).json({
        success: false,
        message: 'You have a pending payment for this draw. Please wait for approval.'
      });
    }

    // Calculate amounts
    const tokenPrice = draw.tokenPrice;
    const totalAmount = numTokens * tokenPrice;
    let discountApplied = 0;
    let referralPointsUsed = 0;

    // Apply referral points if requested
    const user = await User.findById(req.user._id);
    if (useReferralPoints === 'true' || useReferralPoints === true) {
      if (user.referralPoints > 0) {
        const pointsValue = (user.referralPoints / 100) * 20;
        discountApplied = Math.min(pointsValue, totalAmount);
        referralPointsUsed = Math.ceil((discountApplied / 20) * 100);
      }
    }

    const finalAmount = totalAmount - discountApplied;

    // Check if screenshot was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required'
      });
    }

    // Get Cloudinary URL and public ID
    const screenshotUrl = req.file.path;
    const screenshotPublicId = req.file.filename;

    // Create payment
    const payment = await Payment.create({
      user: req.user._id,
      draw: drawId,
      paymentMethod,
      transactionId: transactionId || '',
      numberOfTokens: numTokens,
      tokenPrice,
      totalAmount,
      discountApplied,
      referralPointsUsed,
      finalAmount,
      screenshotUrl,
      screenshotPublicId
    });

    return res.status(201).json({
      success: true,
      message: 'Payment submitted successfully. Waiting for admin approval.',
      data: {
        payment: {
          id: payment._id,
          receiptNumber: payment.receiptNumber,
          numberOfTokens: payment.numberOfTokens,
          totalAmount: payment.totalAmount,
          discountApplied: payment.discountApplied,
          finalAmount: payment.finalAmount,
          status: payment.status
        }
      }
    });

  } catch (error) {
    console.error('Create Payment Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments/admin/all
// @access  Admin
export const getAllPaymentsAdmin = async (req, res) => {
  try {
    const { status, drawId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (drawId) query.draw = drawId;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('user', 'fullName email contactNumber')
      .populate('draw', 'drawName tokenPrice')
      .populate('approvedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get All Payments Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payments'
    });
  }
};

// @desc    Get payment details (Admin)
// @route   GET /api/payments/admin/:id
// @access  Admin
export const getPaymentByIdAdmin = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'fullName email contactNumber currentLocation')
      .populate('draw', 'drawName tokenPrice grandPrize status')
      .populate('tokensAssigned', 'tokenNumber')
      .populate('approvedBy', 'fullName');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment retrieved successfully',
      data: { payment }
    });

  } catch (error) {
    console.error('Get Payment Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment'
    });
  }
};

// @desc    Approve payment (Admin)
// @route   POST /api/payments/:id/approve
// @access  Admin
export const approvePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'fullName contactNumber referralPoints')
      .populate('draw', 'drawName tokenPrice tokensSold totalTokens');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Payment already ${payment.status}`
      });
    }

    const draw = payment.draw;

    // Check if enough tokens available
    if (draw.totalTokens - draw.tokensSold < payment.numberOfTokens) {
      return res.status(400).json({
        success: false,
        message: 'Not enough tokens available'
      });
    }

    // Generate sequential token numbers
    const lastToken = await Token.findOne({ draw: draw._id })
      .sort({ tokenNumber: -1 })
      .select('tokenNumber');

    const startTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;
    const tokens = [];
    const tokenIds = [];

    // Create tokens
    for (let i = 0; i < payment.numberOfTokens; i++) {
      const token = await Token.create({
        tokenNumber: startTokenNumber + i,
        draw: draw._id,
        user: payment.user._id,
        payment: payment._id,
        price: payment.tokenPrice
      });
      tokens.push(token.tokenNumber);
      tokenIds.push(token._id);
    }

    // Update payment
    payment.status = 'approved';
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    payment.tokensAssigned = tokenIds;
    await payment.save();

    // Update draw tokens sold
    await Draw.findByIdAndUpdate(draw._id, {
      $inc: { tokensSold: payment.numberOfTokens }
    });

    // Deduct referral points if used
    if (payment.referralPointsUsed > 0) {
      await User.findByIdAndUpdate(payment.user._id, {
        $inc: { referralPoints: -payment.referralPointsUsed }
      });
    }

    // Complete referral if first purchase
    const referral = await Referral.findOne({
      referred: payment.user._id,
      status: 'pending'
    });

    if (referral) {
      referral.status = 'rewarded';
      referral.pointsAwarded = 100;
      referral.completedAt = new Date();
      referral.firstPurchasePayment = payment._id;
      await referral.save();

      // Award points to referrer
      await User.findByIdAndUpdate(referral.referrer, {
        $inc: { referralPoints: 100, totalReferrals: 1 }
      });
    }

    // Send SMS confirmation
    try {
      await sendPaymentConfirmation(payment.user.contactNumber, {
        amount: payment.finalAmount,
        drawName: draw.drawName,
        tokens: tokens.join(', ')
      });
    } catch (smsError) {
      console.error('SMS Error:', smsError);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment approved and tokens assigned',
      data: {
        payment: {
          id: payment._id,
          status: payment.status,
          tokensAssigned: tokens
        }
      }
    });

  } catch (error) {
    console.error('Approve Payment Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve payment'
    });
  }
};

// @desc    Reject payment (Admin)
// @route   POST /api/payments/:id/reject
// @access  Admin
export const rejectPayment = async (req, res) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Payment already ${payment.status}`
      });
    }

    payment.status = 'rejected';
    payment.rejectionReason = reason || 'Payment verification failed';
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    await payment.save();

    return res.status(200).json({
      success: true,
      message: 'Payment rejected',
      data: { payment }
    });

  } catch (error) {
    console.error('Reject Payment Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject payment'
    });
  }
};

// @desc    Get user's payments
// @route   GET /api/payments/my
// @access  User
export const getMyPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('draw', 'drawName grandPrize status')
      .populate('tokensAssigned', 'tokenNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get My Payments Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payments'
    });
  }
};

// @desc    Get payment receipt data
// @route   GET /api/payments/:id/receipt
// @access  User/Admin
export const getPaymentReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'fullName email contactNumber')
      .populate('draw', 'drawName grandPrize')
      .populate('tokensAssigned', 'tokenNumber');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this receipt'
      });
    }

    const receiptData = {
      receiptNumber: payment.receiptNumber,
      userName: payment.user.fullName,
      email: payment.user.email,
      contactNumber: payment.user.contactNumber,
      drawName: payment.draw.drawName,
      grandPrize: payment.draw.grandPrize?.title || '',
      paymentMethod: payment.paymentMethod,
      numberOfTokens: payment.numberOfTokens,
      tokenPrice: payment.tokenPrice,
      totalAmount: payment.totalAmount,
      discountApplied: payment.discountApplied,
      finalAmount: payment.finalAmount,
      tokens: payment.tokensAssigned.map(t => t.tokenNumber),
      status: payment.status,
      createdAt: payment.createdAt,
      approvedAt: payment.approvedAt
    };

    return res.status(200).json({
      success: true,
      message: 'Receipt data retrieved',
      data: receiptData
    });

  } catch (error) {
    console.error('Get Receipt Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get receipt'
    });
  }
};