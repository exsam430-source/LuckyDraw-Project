import Draw from '../models/Draw.js';
import Token from '../models/Token.js';
import Prize from '../models/Prize.js';
import { deleteImage } from '../config/cloudinary.js';
import { cleanupDrawScreenshots } from '../utils/cleanupService.js';

// @desc    Create new draw (Admin)
// @route   POST /api/draws
// @access  Admin
export const createDraw = async (req, res) => {
  try {
    const {
      drawName,
      description,
      totalTokens,
      tokenPrice,
      maxTokensPerUser,
      startDate,
      endDate,
      grandPrize,
      isAutoClose
    } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    if (start < new Date()) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
    }

    const draw = await Draw.create({
      drawName,
      description,
      totalTokens,
      tokenPrice,
      maxTokensPerUser: maxTokensPerUser || 10,
      startDate: start,
      endDate: end,
      grandPrize: {
        title: grandPrize.title,
        description: grandPrize.description || '',
        value: grandPrize.value,
        image: grandPrize.image || ''
      },
      isAutoClose: isAutoClose !== undefined ? isAutoClose : true,
      createdBy: req.user._id
    });

    await Prize.create({
      draw: draw._id,
      title: grandPrize.title,
      description: grandPrize.description || '',
      prizeType: 'grand',
      value: grandPrize.value,
      prizeCategory: grandPrize.category || 'cash',
      image: grandPrize.image || '',
      position: 1
    });

    return res.status(201).json({
      success: true,
      message: 'Draw created successfully',
      data: { draw }
    });
  } catch (error) {
    console.error('Create Draw Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create draw',
      error: error.message
    });
  }
};

// @desc    Get all draws (Admin)
// @route   GET /api/draws/admin/all
// @access  Admin
export const getAllDrawsAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    const query = {};

    if (status) query.status = status;
    if (search) query.drawName = { $regex: search, $options: 'i' };

    const total = await Draw.countDocuments(query);
    const draws = await Draw.find(query)
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Draws retrieved successfully',
      data: draws,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get All Draws Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get draws' });
  }
};

// @desc    Get single draw (Admin)
// @route   GET /api/draws/admin/:id
// @access  Admin
export const getDrawByIdAdmin = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id)
      .populate('createdBy', 'fullName email');

    if (!draw) {
      return res.status(404).json({ success: false, message: 'Draw not found' });
    }

    const prizes = await Prize.find({ draw: draw._id })
      .select('-assignedToken')
      .sort({ position: 1 });

    const tokenStats = await Token.aggregate([
      { $match: { draw: draw._id } },
      {
        $group: {
          _id: null,
          totalSold: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
        }
      }
    ]);

    const stats = tokenStats[0] || { totalSold: 0, uniqueUsers: [] };

    return res.status(200).json({
      success: true,
      message: 'Draw retrieved successfully',
      data: {
        draw,
        prizes,
        statistics: {
          tokensSold: stats.totalSold,
          remainingTokens: draw.totalTokens - stats.totalSold,
          totalParticipants: stats.uniqueUsers.length
        }
      }
    });
  } catch (error) {
    console.error('Get Draw By ID Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get draw' });
  }
};

// @desc    Update draw (Admin)
// @route   PUT /api/draws/:id
// @access  Admin
export const updateDraw = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);

    if (!draw) {
      return res.status(404).json({ success: false, message: 'Draw not found' });
    }

    if (draw.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot update completed draw' });
    }

    if (req.body.totalTokens && req.body.totalTokens < draw.tokensSold) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce total tokens below sold count (${draw.tokensSold})`
      });
    }

    const updatableFields = [
      'drawName', 'description', 'totalTokens', 'tokenPrice',
      'maxTokensPerUser', 'startDate', 'endDate', 'status',
      'grandPrize', 'isAutoClose'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        draw[field] = req.body[field];
      }
    });

    await draw.save();

    return res.status(200).json({
      success: true,
      message: 'Draw updated successfully',
      data: { draw }
    });
  } catch (error) {
    console.error('Update Draw Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update draw' });
  }
};

// @desc    Delete draw (Admin)
// @route   DELETE /api/draws/:id
// @access  Admin
export const deleteDraw = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);

    if (!draw) {
      return res.status(404).json({ success: false, message: 'Draw not found' });
    }

    if (draw.tokensSold > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete draw with sold tokens. Cancel it instead.'
      });
    }

    await Prize.deleteMany({ draw: draw._id });
    await Draw.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: 'Draw deleted successfully' });
  } catch (error) {
    console.error('Delete Draw Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete draw' });
  }
};

// @desc    Get public draws (User)
// @route   GET /api/draws
// @access  Public/User
export const getPublicDraws = async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 10 } = req.query;

    const query = { status: { $in: ['upcoming', 'active'] } };

    if (status && status !== 'all') {
      query.status = status;
    }

    const total = await Draw.countDocuments(query);
    const draws = await Draw.find(query)
      .select('-createdBy')
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Draws retrieved successfully',
      data: draws,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Public Draws Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get draws' });
  }
};

// @desc    Get single draw details (User)
// @route   GET /api/draws/:id
// @access  Public/User
export const getDrawById = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id).select('-createdBy');

    if (!draw) {
      return res.status(404).json({ success: false, message: 'Draw not found' });
    }

    const prizes = await Prize.find({ draw: draw._id })
      .select('-assignedToken')
      .sort({ position: 1 });

    return res.status(200).json({
      success: true,
      message: 'Draw retrieved successfully',
      data: { draw, prizes }
    });
  } catch (error) {
    console.error('Get Draw By ID Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get draw' });
  }
};

// @desc    Change draw status (Admin)
// @route   PATCH /api/draws/:id/status
// @access  Admin
export const changeDrawStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['upcoming', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const draw = await Draw.findById(req.params.id);

    if (!draw) {
      return res.status(404).json({ success: false, message: 'Draw not found' });
    }

    draw.status = status;

    if (status === 'completed') {
      draw.drawExecutedAt = new Date();
    }

    await draw.save();

    // AUTO-CLEANUP when status is set to completed
    if (status === 'completed') {
      try {
        const cleanupResult = await cleanupDrawScreenshots(draw._id);
        console.log('Status-change cleanup result:', cleanupResult);
      } catch (cleanupError) {
        console.error('Status-change cleanup failed (non-blocking):', cleanupError);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Draw status changed to ${status}`,
      data: { draw }
    });
  } catch (error) {
    console.error('Change Draw Status Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to change status' });
  }
};
// @desc    Get live draw state (polling by users)
// @route   GET /api/draws/:id/live
// @access  Public
export const getLiveDrawState = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id)
      .select('drawName status isLive drawnHistory grandPrize tokensSold totalTokens');

    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });

    return res.status(200).json({
      success: true,
      data: {
        isLive: draw.isLive,
        status: draw.status,
        drawName: draw.drawName,
        drawnHistory: draw.drawnHistory || [],
        tokensSold: draw.tokensSold,
        totalTokens: draw.totalTokens
      }
    });
  } catch (error) {
    console.error('Get Live Draw State Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get live state' });
  }
};