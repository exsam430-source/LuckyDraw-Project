import User from '../models/User.js';
import Referral from '../models/Referral.js';
import Payment from '../models/Payment.js';

// @desc    Get my referral info
// @route   GET /api/referrals/my
// @access  User
export const getMyReferralInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const referrals = await Referral.find({ referrer: req.user._id })
      .populate('referred', 'fullName createdAt')
      .sort({ createdAt: -1 });

    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter(r => r.status === 'rewarded').length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
    const totalPointsEarned = referrals.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0);

    const pointsValue = (user.referralPoints / 100) * 20;

    // FIXED: put everything the frontend expects inside `stats`
    return res.status(200).json({
      success: true,
      message: 'Referral info retrieved',
      data: {
        stats: {
          referralCode: user.referralCode,
          totalReferrals,
          completedReferrals,
          pendingReferrals,
          totalPointsEarned,
          currentPoints: user.referralPoints,
          pointsValue: `Rs ${pointsValue.toFixed(2)}`
        },
        referrals: referrals.map(r => ({
          id: r._id,
          referredUser: r.referred?.fullName || 'Unknown',
          status: r.status,
          pointsAwarded: r.pointsAwarded,
          joinedAt: r.createdAt,
          completedAt: r.completedAt
        })),
        rules: {
          pointsPerReferral: 100,
          pointsValue: '100 points = Rs 20',
          howToEarn: 'Share your referral code. When someone joins and makes their first purchase, you earn 100 points!'
        }
      }
    });
  } catch (error) {
    console.error('Get Referral Info Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get referral info'
    });
  }
};

// @desc    Validate referral code
// @route   GET /api/referrals/validate/:code
// @access  Public
export const validateReferralCode = async (req, res) => {
  try {
    const { code } = req.params;

    const user = await User.findOne({
      referralCode: code.toUpperCase(),
      isActive: true,
      isVerified: true
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Valid referral code',
      data: {
        valid: true,
        referrerName: user.fullName.split(' ')[0]
      }
    });
  } catch (error) {
    console.error('Validate Referral Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to validate code' });
  }
};

// @desc    Get all referrals (Admin)
// @route   GET /api/referrals/admin/all
// @access  Admin
export const getAllReferrals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const total = await Referral.countDocuments(query);
    const referrals = await Referral.find(query)
      .populate('referrer', 'fullName email contactNumber')
      .populate('referred', 'fullName email contactNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const stats = await Referral.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPoints: { $sum: '$pointsAwarded' }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Referrals retrieved',
      data: referrals,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get All Referrals Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get referrals' });
  }
};

// @desc    Get top referrers (Admin)
// @route   GET /api/referrals/admin/top
// @access  Admin
export const getTopReferrers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topReferrers = await User.find({ totalReferrals: { $gt: 0 } })
      .select('fullName email contactNumber totalReferrals referralPoints referralCode')
      .sort({ totalReferrals: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Top referrers retrieved',
      data: topReferrers
    });
  } catch (error) {
    console.error('Get Top Referrers Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get top referrers' });
  }
};

// @desc    Manually award referral points (Admin)
// @route   POST /api/referrals/admin/award
// @access  Admin
export const awardReferralPoints = async (req, res) => {
  try {
    const { userId, points, reason } = req.body;

    if (!userId || !points) {
      return res.status(400).json({
        success: false,
        message: 'User ID and points are required'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.referralPoints += points;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `${points} points awarded to ${user.fullName}`,
      data: {
        userId: user._id,
        fullName: user.fullName,
        newBalance: user.referralPoints,
        reason
      }
    });
  } catch (error) {
    console.error('Award Points Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to award points' });
  }
};