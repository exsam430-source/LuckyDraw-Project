import User from '../models/User.js';
import Draw from '../models/Draw.js';
import Token from '../models/Token.js';
import Payment from '../models/Payment.js';
import Prize from '../models/Prize.js';
import Referral from '../models/Referral.js';
import { sendWinnerNotification } from '../utils/smsService.js';
import { cleanupDrawScreenshots } from '../utils/cleanupService.js';

// ─── Dashboard (unchanged) ───
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, activeUsers, totalDraws, activeDraws, completedDraws,
      totalTokensSold, pendingPayments, approvedPayments, totalReferrals
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true, isVerified: true }),
      Draw.countDocuments(),
      Draw.countDocuments({ status: 'active' }),
      Draw.countDocuments({ status: 'completed' }),
      Token.countDocuments(),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'approved' }),
      Referral.countDocuments({ status: 'rewarded' })
    ]);

    const revenueData = await Payment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, totalRevenue: { $sum: '$finalAmount' }, totalTransactions: { $sum: 1 } } }
    ]);
    const revenue = revenueData[0] || { totalRevenue: 0, totalTransactions: 0 };

    const recentPayments = await Payment.find()
      .populate('user', 'fullName').populate('draw', 'drawName')
      .sort({ createdAt: -1 }).limit(5);

    const recentUsers = await User.find({ role: 'user' })
      .select('fullName email createdAt isVerified')
      .sort({ createdAt: -1 }).limit(5);

    return res.status(200).json({
      success: true, message: 'Dashboard stats retrieved',
      data: {
        users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
        draws: { total: totalDraws, active: activeDraws, completed: completedDraws, upcoming: totalDraws - activeDraws - completedDraws },
        tokens: { totalSold: totalTokensSold },
        payments: { pending: pendingPayments, approved: approvedPayments },
        revenue: { total: revenue.totalRevenue, transactions: revenue.totalTransactions },
        referrals: { completed: totalReferrals },
        recentPayments, recentUsers
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get dashboard stats' });
  }
};

// ─── Users (unchanged) ───
export const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, isVerified, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query).select('-password').sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit));

    return res.status(200).json({
      success: true, message: 'Users retrieved successfully', data: users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get users' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('referredBy', 'fullName referralCode');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [tokenCount, paymentCount, totalSpent, referralCount] = await Promise.all([
      Token.countDocuments({ user: user._id }),
      Payment.countDocuments({ user: user._id, status: 'approved' }),
      Payment.aggregate([{ $match: { user: user._id, status: 'approved' } }, { $group: { _id: null, total: { $sum: '$finalAmount' } } }]),
      Referral.countDocuments({ referrer: user._id, status: 'rewarded' })
    ]);

    return res.status(200).json({
      success: true, message: 'User retrieved successfully',
      data: { user, statistics: { totalTokens: tokenCount, totalPayments: paymentCount, totalSpent: totalSpent[0]?.total || 0, successfulReferrals: referralCount } }
    });
  } catch (error) {
    console.error('Get User By ID Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get user' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { isActive, isVerified, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.user._id.toString() === user._id.toString() && role && role !== user.role) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }
    if (isActive !== undefined) user.isActive = isActive;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (role) user.role = role;
    await user.save();
    return res.status(200).json({ success: true, message: 'User status updated', data: { user } });
  } catch (error) {
    console.error('Update User Status Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

// ─── Execute / Finalize Draw ───
export const executeDraw = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
    if (draw.status === 'completed') return res.status(400).json({ success: false, message: 'Draw already executed' });
    if (draw.tokensSold === 0) return res.status(400).json({ success: false, message: 'No tokens sold for this draw' });

    // Mark all non-winning tokens as lost
    await Token.updateMany(
      { draw: draw._id, isWinner: false },
      { status: 'lost' }
    );

    draw.status = 'completed';
    draw.isLive = false;
    draw.drawExecutedAt = new Date();
    await draw.save();

    try { await cleanupDrawScreenshots(draw._id); }
    catch (err) { console.error('Auto-cleanup failed:', err); }

    // Gather winners from prizes
    const awardedPrizes = await Prize.find({ draw: draw._id, isAwarded: true })
      .populate('winner', 'fullName contactNumber')
      .populate('winningToken', 'tokenNumber');

    const winners = awardedPrizes.map(p => ({
      tokenNumber: p.winningToken?.tokenNumber || p.assignedToken,
      userName: p.winner?.fullName || 'Unknown',
      prize: { title: p.title, value: p.value, type: p.prizeType }
    }));

    const drawnHistory = draw.drawnHistory || [];

    return res.status(200).json({
      success: true, message: 'Draw finalized successfully',
      data: {
        draw: { id: draw._id, name: draw.drawName, executedAt: draw.drawExecutedAt },
        winnersCount: winners.length,
        winners,
        drawnHistory,
        totalDrawn: drawnHistory.length
      }
    });
  } catch (error) {
    console.error('Execute Draw Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to execute draw' });
  }
};

// ─────────────────────────────────────────────────
// NEW: Unified roll — works with OR without prize
// ─────────────────────────────────────────────────
export const rollDraw = async (req, res) => {
  try {
    const { prizeId } = req.body;                       // optional
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
    if (draw.status === 'completed') return res.status(400).json({ success: false, message: 'Draw already completed' });

    // All sold tokens
    const soldTokens = await Token.find({ draw: draw._id })
      .select('tokenNumber user')
      .populate('user', 'fullName');

    if (soldTokens.length === 0) {
      return res.status(400).json({ success: false, message: 'No tokens sold for this draw' });
    }

    // Already-drawn token numbers
    const drawnNumbers = (draw.drawnHistory || []).map(d => d.tokenNumber);

    // Available = sold but not yet drawn
    const availableSold = soldTokens.filter(t => !drawnNumbers.includes(t.tokenNumber));

    // Full animation pool (all available sold tokens)
    const animationPool = availableSold.map(t => t.tokenNumber);

    // ────── PRIZE ROLL ──────
    if (prizeId) {
      const prize = await Prize.findById(prizeId).select('+assignedToken');
      if (!prize) return res.status(404).json({ success: false, message: 'Prize not found' });
      if (prize.isAwarded) return res.status(400).json({ success: false, message: 'Prize already awarded' });
      if (!prize.assignedToken) {
        return res.status(400).json({ success: false, message: 'No token assigned to this prize. Go to Prize Management and assign one first.' });
      }
      if (drawnNumbers.includes(prize.assignedToken)) {
        return res.status(400).json({ success: false, message: `Token #${prize.assignedToken} was already drawn. Reassign a different token to this prize.` });
      }

      // Check if assigned token was sold
      const targetDoc = soldTokens.find(t => t.tokenNumber === prize.assignedToken);

      // Build pool — must include target for animation to land on it
      const pool = animationPool.length > 0 ? [...animationPool] : [];
      if (!pool.includes(prize.assignedToken)) pool.push(prize.assignedToken);

      return res.status(200).json({
        success: true, message: 'Roll data ready',
        data: {
          targetToken: prize.assignedToken,
          animationPool: pool,
          isSold: !!targetDoc,
          buyerName: targetDoc?.user?.fullName || null,
          prize: { id: prize._id, title: prize.title, value: prize.value, type: prize.prizeType },
          isPrizeRoll: true
        }
      });
    }

    // ────── REGULAR ROLL (no prize) ──────
    // Exclude tokens assigned to unawarded prizes so they aren't
    // accidentally burned in a regular draw
    const unawardedPrizes = await Prize.find({
      draw: draw._id,
      isAwarded: false,
      assignedToken: { $ne: null }
    }).select('+assignedToken');

    const reservedTokens = unawardedPrizes.map(p => p.assignedToken).filter(Boolean);

    const regularPool = availableSold.filter(
      t => !reservedTokens.includes(t.tokenNumber)
    );

    if (regularPool.length === 0 && availableSold.length === 0) {
      return res.status(400).json({ success: false, message: 'All sold tokens have been drawn' });
    }

    if (regularPool.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Only prize-assigned tokens remain. Select a prize and roll for it.'
      });
    }

    const randomToken = regularPool[Math.floor(Math.random() * regularPool.length)];

    return res.status(200).json({
      success: true, message: 'Roll data ready',
      data: {
        targetToken: randomToken.tokenNumber,
        animationPool,                                   // full pool for realistic animation
        isSold: true,
        buyerName: randomToken.user?.fullName || null,
        prize: null,
        isPrizeRoll: false
      }
    });
  } catch (error) {
    console.error('Roll Draw Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate roll data' });
  }
};

// ──────────────────────────────────────
// Confirm drawn token (both types)
// ──────────────────────────────────────
export const confirmDrawnToken = async (req, res) => {
  try {
    const { tokenNumber, prizeId, isPrizeRoll, isSold, buyerName } = req.body;
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });

    // Prevent duplicates
    const alreadyDrawn = (draw.drawnHistory || []).some(d => d.tokenNumber === tokenNumber);
    if (alreadyDrawn) {
      return res.status(400).json({ success: false, message: 'This token was already recorded' });
    }

    let prizeTitle = '';
    let prizeValue = 0;

    // Award prize if this is a prize roll and token was sold
    if (isPrizeRoll && prizeId && isSold) {
      const prize = await Prize.findById(prizeId).select('+assignedToken');
      if (prize && !prize.isAwarded) {
        prizeTitle = prize.title;
        prizeValue = prize.value;

        const token = await Token.findOne({ draw: draw._id, tokenNumber });
        if (token) {
          prize.winningToken = token._id;
          prize.winner = token.user;
          prize.isAwarded = true;
          prize.awardedAt = new Date();
          await prize.save();

          token.isWinner = true;
          token.status = 'won';
          token.prize = prize._id;
          await token.save();

          // SMS
          try {
            const winnerUser = await User.findById(token.user).select('contactNumber');
            if (winnerUser) {
              await sendWinnerNotification(winnerUser.contactNumber, {
                tokenNumber, prize: prize.title, drawName: draw.drawName
              });
            }
          } catch (smsErr) { console.error('Winner SMS Error:', smsErr); }
        }
      }
    }

    // Also record un-sold prize rolls (no winner, but still tracked)
    if (isPrizeRoll && prizeId && !isSold) {
      const prize = await Prize.findById(prizeId);
      if (prize) { prizeTitle = prize.title; prizeValue = prize.value; }
    }

    if (!draw.drawnHistory) draw.drawnHistory = [];
    draw.drawnHistory.push({
      tokenNumber,
      prize: prizeId || null,
      prizeTitle,
      prizeValue,
      hasPrize: !!isPrizeRoll && !!prizeId,
      isSold: !!isSold,
      buyerName: buyerName || '',
      drawnAt: new Date()
    });
    await draw.save();

    return res.status(200).json({
      success: true,
      message: isPrizeRoll ? '🏆 Winner recorded!' : 'Token draw recorded',
      data: { drawnHistory: draw.drawnHistory }
    });
  } catch (error) {
    console.error('Confirm Drawn Token Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record result' });
  }
};

// ──────────────────────────
// Get draw results for PDF
// ──────────────────────────
export const getDrawResults = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id)
      .select('drawName status drawnHistory drawExecutedAt tokensSold totalTokens tokenPrice');

    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });

    const drawnHistory = draw.drawnHistory || [];

    const allDrawn = drawnHistory.map((d, i) => ({
      order: i + 1,
      tokenNumber: d.tokenNumber,
      buyerName: d.isSold ? (d.buyerName || 'Unknown') : 'Not Purchased',
      isSold: d.isSold,
      hasPrize: d.hasPrize,
      prizeTitle: d.prizeTitle || '',
      prizeValue: d.prizeValue || 0,
      drawnAt: d.drawnAt
    }));

    const winners = drawnHistory
      .filter(d => d.hasPrize)
      .map((d, i) => ({
        order: i + 1,
        tokenNumber: d.tokenNumber,
        buyerName: d.isSold ? (d.buyerName || 'Unknown') : 'Not Purchased',
        prizeTitle: d.prizeTitle,
        prizeValue: d.prizeValue,
        isSold: d.isSold,
        drawnAt: d.drawnAt
      }));

    return res.status(200).json({
      success: true,
      data: {
        draw: {
          name: draw.drawName,
          status: draw.status,
          executedAt: draw.drawExecutedAt,
          tokensSold: draw.tokensSold,
          totalTokens: draw.totalTokens,
          tokenPrice: draw.tokenPrice
        },
        allDrawn,
        winners,
        summary: {
          totalDrawn: allDrawn.length,
          totalWinners: winners.filter(w => w.isSold).length,
          totalPrizes: winners.length
        }
      }
    });
  } catch (error) {
    console.error('Get Draw Results Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get results' });
  }
};

// ─── Toggle live mode (unchanged) ───
export const toggleLiveDraw = async (req, res) => {
  try {
    const { isLive } = req.body;
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
    draw.isLive = isLive;
    await draw.save();
    return res.status(200).json({ success: true, message: `Draw is now ${isLive ? 'LIVE' : 'offline'}`, data: { isLive: draw.isLive } });
  } catch (error) {
    console.error('Toggle Live Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle live mode' });
  }
};

// ─── Cleanup (unchanged) ───
export const cleanupDrawData = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
    if (draw.status !== 'completed') return res.status(400).json({ success: false, message: 'Cleanup only for completed draws' });
    const result = await cleanupDrawScreenshots(draw._id);
    return res.status(200).json({ success: true, message: 'Cleanup completed', data: result });
  } catch (error) {
    console.error('Cleanup Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to run cleanup' });
  }
};

// ─── Create Admin (unchanged) ───
export const createAdminUser = async (req, res) => {
  try {
    const { fullName, email, contactNumber, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { contactNumber }] });
    if (existing) return res.status(400).json({ success: false, message: 'User with this email or contact already exists' });

    const admin = await User.create({ fullName, email, contactNumber, password, role: 'admin', isVerified: true, isActive: true });
    return res.status(201).json({ success: true, message: 'Admin created', data: { id: admin._id, fullName: admin.fullName, email: admin.email, role: admin.role } });
  } catch (error) {
    console.error('Create Admin Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create admin' });
  }
};