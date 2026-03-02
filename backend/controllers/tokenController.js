import Token from '../models/Token.js';
import Draw from '../models/Draw.js';
import User from '../models/User.js';
import Prize from '../models/Prize.js';

// @desc    Get all tokens for a draw (Admin)
// @route   GET /api/tokens/draw/:drawId
// @access  Admin
export const getTokensByDraw = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;

    const query = { draw: req.params.drawId };
    if (status) query.status = status;

    const total = await Token.countDocuments(query);
    const tokens = await Token.find(query)
      .populate('user', 'fullName email contactNumber')
      .populate('prize', 'title value prizeType')
      .sort({ tokenNumber: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Tokens retrieved successfully',
      data: tokens,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get Tokens Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get tokens'
    });
  }
};

// @desc    Get token details (Admin)
// @route   GET /api/tokens/:id
// @access  Admin
export const getTokenById = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate('user', 'fullName email contactNumber')
      .populate('draw', 'drawName status grandPrize')
      .populate('payment', 'receiptNumber finalAmount')
      .populate('prize', 'title value prizeType');

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token retrieved successfully',
      data: { token }
    });

  } catch (error) {
    console.error('Get Token Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get token'
    });
  }
};



export const getMyTokens = async (req, res) => {
  try {
    const { drawId, filter, page = 1, limit = 20 } = req.query;

    const query = { user: req.user._id };
    if (drawId) query.draw = drawId;

    // Get all tokens first (we'll filter by draw status after populate)
    const allTokens = await Token.find(query)
      .populate('draw', 'drawName status grandPrize drawExecutedAt')
      .populate('prize', 'title value prizeType')
      .sort({ createdAt: -1 })
      .lean();

    // Filter based on draw status
    let filteredTokens = allTokens;
    
    if (filter === 'active') {
      // Active = draw status is 'active' or 'upcoming'
      filteredTokens = allTokens.filter(token => 
        token.draw?.status === 'active' || token.draw?.status === 'upcoming'
      );
    } else if (filter === 'ended') {
      // Ended = draw status is 'completed' or 'cancelled'
      filteredTokens = allTokens.filter(token => 
        token.draw?.status === 'completed' || token.draw?.status === 'cancelled'
      );
    }

    // Paginate the filtered results
    const total = filteredTokens.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTokens = filteredTokens.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      message: 'Tokens retrieved successfully',
      data: paginatedTokens,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get My Tokens Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get tokens'
    });
  }
};

// @desc    Get user's tokens for specific draw
// @route   GET /api/tokens/my/draw/:drawId
// @access  User
export const getMyTokensForDraw = async (req, res) => {
  try {
    const tokens = await Token.find({
      user: req.user._id,
      draw: req.params.drawId
    })
      .populate('prize', 'title value prizeType')
      .sort({ tokenNumber: 1 });

    const draw = await Draw.findById(req.params.drawId)
      .select('drawName status grandPrize tokensSold totalTokens maxTokensPerUser');

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tokens retrieved successfully',
      data: {
        tokens,
        draw,
        tokenCount: tokens.length,
        canBuyMore: tokens.length < draw.maxTokensPerUser,
        maxCanBuy: draw.maxTokensPerUser - tokens.length
      }
    });

  } catch (error) {
    console.error('Get My Tokens For Draw Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get tokens'
    });
  }
};

// @desc    Get token ownership summary for draw (Admin)
// @route   GET /api/tokens/draw/:drawId/summary
// @access  Admin
export const getTokenSummary = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.drawId);

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    // Get token distribution by user
    const userDistribution = await Token.aggregate([
      { $match: { draw: draw._id } },
      {
        $group: {
          _id: '$user',
          tokenCount: { $sum: 1 },
          tokens: { $push: '$tokenNumber' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          fullName: '$userInfo.fullName',
          email: '$userInfo.email',
          contactNumber: '$userInfo.contactNumber',
          tokenCount: 1,
          tokens: 1
        }
      },
      { $sort: { tokenCount: -1 } }
    ]);

    // Get sold token numbers
    const soldTokens = await Token.find({ draw: draw._id })
      .select('tokenNumber')
      .sort({ tokenNumber: 1 });

    const soldTokenNumbers = soldTokens.map(t => t.tokenNumber);

    // Calculate available token numbers
    const allTokenNumbers = Array.from({ length: draw.totalTokens }, (_, i) => i + 1);
    const availableTokenNumbers = allTokenNumbers.filter(n => !soldTokenNumbers.includes(n));

    return res.status(200).json({
      success: true,
      message: 'Token summary retrieved',
      data: {
        draw: {
          id: draw._id,
          name: draw.drawName,
          totalTokens: draw.totalTokens,
          tokensSold: draw.tokensSold,
          remainingTokens: draw.totalTokens - draw.tokensSold
        },
        userDistribution,
        soldTokenNumbers,
        availableTokenNumbers: availableTokenNumbers.slice(0, 100),
        totalAvailable: availableTokenNumbers.length
      }
    });

  } catch (error) {
    console.error('Get Token Summary Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get summary'
    });
  }
};

// @desc    Get winning tokens for a draw
// @route   GET /api/tokens/draw/:drawId/winners
// @access  Public
export const getWinningTokens = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.drawId);

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    if (draw.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Draw results not yet available'
      });
    }

    const winningTokens = await Token.find({
      draw: draw._id,
      isWinner: true
    })
      .populate('user', 'fullName')
      .populate('prize', 'title value prizeType')
      .sort({ 'prize.prizeType': 1 });

    return res.status(200).json({
      success: true,
      message: 'Winning tokens retrieved',
      data: {
        draw: {
          id: draw._id,
          name: draw.drawName,
          executedAt: draw.drawExecutedAt
        },
        winners: winningTokens.map(t => ({
          tokenNumber: t.tokenNumber,
          winnerName: t.user.fullName,
          prize: t.prize
        }))
      }
    });

  } catch (error) {
    console.error('Get Winning Tokens Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get winners'
    });
  }
};