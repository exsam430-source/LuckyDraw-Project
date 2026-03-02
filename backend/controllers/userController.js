import User from '../models/User.js';
import Draw from '../models/Draw.js';
import Token from '../models/Token.js';
import Payment from '../models/Payment.js';
import Referral from '../models/Referral.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseHandler.js';

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('referredBy', 'fullName referralCode');

    // Get user statistics
    const totalTokens = await Token.countDocuments({ user: req.user._id });
    const totalPayments = await Payment.countDocuments({ user: req.user._id, status: 'approved' });
    const pendingPayments = await Payment.countDocuments({ user: req.user._id, status: 'pending' });
    const totalReferrals = await Referral.countDocuments({ referrer: req.user._id, status: 'rewarded' });

    return successResponse(res, 200, 'Profile retrieved successfully', {
      user,
      statistics: {
        totalTokens,
        totalPayments,
        pendingPayments,
        totalReferrals,
        referralPoints: user.referralPoints
      }
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    return errorResponse(res, 500, 'Failed to get profile');
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { fullName, currentLocation } = req.body;

    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (currentLocation) {
      user.currentLocation = {
        ...user.currentLocation,
        ...currentLocation
      };
    }

    await user.save();

    return successResponse(res, 200, 'Profile updated successfully', {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        contactNumber: user.contactNumber,
        currentLocation: user.currentLocation
      }
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    return errorResponse(res, 500, 'Failed to update profile');
  }
};

// @desc    Get available draws for user
// @route   GET /api/user/draws
// @access  Private
export const getAvailableDraws = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['upcoming', 'active'] };
    }

    const total = await Draw.countDocuments(query);
    const draws = await Draw.find(query)
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-createdBy');

    // Get user's token count for each draw
    const drawsWithUserTokens = await Promise.all(
      draws.map(async (draw) => {
        const userTokenCount = await Token.countDocuments({
          draw: draw._id,
          user: req.user._id
        });

        return {
          ...draw.toObject(),
          userTokenCount,
          canBuyMore: userTokenCount < draw.maxTokensPerUser
        };
      })
    );

    return paginatedResponse(res, 200, 'Draws retrieved successfully', drawsWithUserTokens, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get Available Draws Error:', error);
    return errorResponse(res, 500, 'Failed to get draws');
  }
};

// @desc    Get single draw details
// @route   GET /api/user/draws/:id
// @access  Private
export const getDrawDetails = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);

    if (!draw) {
      return errorResponse(res, 404, 'Draw not found');
    }

    // Get user's tokens for this draw
    const userTokens = await Token.find({
      draw: draw._id,
      user: req.user._id
    }).select('tokenNumber status createdAt');

    // Get user's payments for this draw
    const userPayments = await Payment.find({
      draw: draw._id,
      user: req.user._id
    }).select('status numberOfTokens totalAmount createdAt receiptNumber');

    return successResponse(res, 200, 'Draw details retrieved', {
      draw,
      userTokens,
      userPayments,
      userTokenCount: userTokens.length,
      canBuyMore: userTokens.length < draw.maxTokensPerUser,
      maxCanBuy: draw.maxTokensPerUser - userTokens.length
    });

  } catch (error) {
    console.error('Get Draw Details Error:', error);
    return errorResponse(res, 500, 'Failed to get draw details');
  }
};

// @desc    Get user's tokens
// @route   GET /api/user/tokens
// @access  Private
export const getMyTokens = async (req, res) => {
  try {
    const { drawId, status, page = 1, limit = 20 } = req.query;

    const query = { user: req.user._id };
    
    if (drawId) query.draw = drawId;
    if (status) query.status = status;

    const total = await Token.countDocuments(query);
    const tokens = await Token.find(query)
      .populate('draw', 'drawName status grandPrize')
      .populate('prize', 'title value prizeType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, 200, 'Tokens retrieved successfully', tokens, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get My Tokens Error:', error);
    return errorResponse(res, 500, 'Failed to get tokens');
  }
};

// @desc    Get user's payments
// @route   GET /api/user/payments
// @access  Private
export const getMyPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('draw', 'drawName tokenPrice grandPrize')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, 200, 'Payments retrieved successfully', payments, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get My Payments Error:', error);
    return errorResponse(res, 500, 'Failed to get payments');
  }
};

// @desc    Get single payment details
// @route   GET /api/user/payments/:id
// @access  Private
export const getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('draw', 'drawName tokenPrice grandPrize status')
      .populate('tokensAssigned', 'tokenNumber status');

    if (!payment) {
      return errorResponse(res, 404, 'Payment not found');
    }

    return successResponse(res, 200, 'Payment details retrieved', { payment });

  } catch (error) {
    console.error('Get Payment Details Error:', error);
    return errorResponse(res, 500, 'Failed to get payment details');
  }
};

// @desc    Get referral information
// @route   GET /api/user/referrals
// @access  Private
export const getMyReferrals = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const referrals = await Referral.find({ referrer: req.user._id })
      .populate('referred', 'fullName createdAt')
      .sort({ createdAt: -1 });

    const stats = {
      referralCode: user.referralCode,
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter(r => r.status === 'rewarded').length,
      pendingReferrals: referrals.filter(r => r.status === 'pending').length,
      totalPointsEarned: referrals.reduce((sum, r) => sum + r.pointsAwarded, 0),
      currentPoints: user.referralPoints,
      pointsValue: `Rs ${(user.referralPoints / 100) * 20}` // 100 points = Rs 20
    };

    return successResponse(res, 200, 'Referral information retrieved', {
      stats,
      referrals
    });

  } catch (error) {
    console.error('Get My Referrals Error:', error);
    return errorResponse(res, 500, 'Failed to get referrals');
  }
};

// @desc    Get user dashboard data
// @route   GET /api/user/dashboard
// @access  Private
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get counts
    const [
      activeDraws,
      myTokens,
      pendingPayments,
      approvedPayments,
      totalReferrals,
      user
    ] = await Promise.all([
      Draw.countDocuments({ status: 'active' }),
      Token.countDocuments({ user: userId }),
      Payment.countDocuments({ user: userId, status: 'pending' }),
      Payment.countDocuments({ user: userId, status: 'approved' }),
      Referral.countDocuments({ referrer: userId, status: 'rewarded' }),
      User.findById(userId).select('referralPoints referralCode')
    ]);

    // Get recent tokens
    const recentTokens = await Token.find({ user: userId })
      .populate('draw', 'drawName status')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent payments
    const recentPayments = await Payment.find({ user: userId })
      .populate('draw', 'drawName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming/active draws
    const upcomingDraws = await Draw.find({
      status: { $in: ['upcoming', 'active'] }
    })
      .sort({ startDate: 1 })
      .limit(3);

    return successResponse(res, 200, 'Dashboard data retrieved', {
      stats: {
        activeDraws,
        myTokens,
        pendingPayments,
        approvedPayments,
        totalReferrals,
        referralPoints: user.referralPoints,
        referralCode: user.referralCode
      },
      recentTokens,
      recentPayments,
      upcomingDraws
    });

  } catch (error) {
    console.error('Get Dashboard Error:', error);
    return errorResponse(res, 500, 'Failed to get dashboard data');
  }
};

// @desc    Get draw results (for completed draws)
// @route   GET /api/user/results
// @access  Private
export const getResults = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Get completed draws where user participated
    const userTokens = await Token.find({ user: req.user._id }).distinct('draw');

    const query = {
      _id: { $in: userTokens },
      status: 'completed'
    };

    const total = await Draw.countDocuments(query);
    const completedDraws = await Draw.find(query)
      .sort({ drawExecutedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get user's tokens and results for each draw
    const results = await Promise.all(
      completedDraws.map(async (draw) => {
        const tokens = await Token.find({
          draw: draw._id,
          user: req.user._id
        }).populate('prize', 'title value prizeType');

        const winningTokens = tokens.filter(t => t.isWinner);

        return {
          draw: {
            id: draw._id,
            name: draw.drawName,
            grandPrize: draw.grandPrize,
            executedAt: draw.drawExecutedAt
          },
          totalTokens: tokens.length,
          winningTokens: winningTokens.length,
          tokens: tokens.map(t => ({
            tokenNumber: t.tokenNumber,
            isWinner: t.isWinner,
            prize: t.prize
          }))
        };
      })
    );

    return paginatedResponse(res, 200, 'Results retrieved successfully', results, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get Results Error:', error);
    return errorResponse(res, 500, 'Failed to get results');
  }
};