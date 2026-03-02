import Prize from '../models/Prize.js';
import Draw from '../models/Draw.js';
import Token from '../models/Token.js';
import { deleteImage } from '../config/cloudinary.js';

// @desc    Add prize to draw (Admin)
// @route   POST /api/prizes
// @access  Admin
export const createPrize = async (req, res) => {
  try {
    const {
      drawId,
      title,
      description,
      prizeType,
      value,
      prizeCategory,
      image,
      position
    } = req.body;

    // Check if draw exists
    const draw = await Draw.findById(drawId);
    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    // Check if draw is still modifiable
    if (draw.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add prizes to completed draw'
      });
    }

    // For grand prize, check if one already exists
    if (prizeType === 'grand') {
      const existingGrand = await Prize.findOne({ draw: drawId, prizeType: 'grand' });
      if (existingGrand) {
        return res.status(400).json({
          success: false,
          message: 'Grand prize already exists for this draw'
        });
      }
    }

    const prize = await Prize.create({
      draw: drawId,
      title,
      description: description || '',
      prizeType,
      value,
      prizeCategory: prizeCategory || 'cash',
      image: image || '',
      position: position || 1
    });

    return res.status(201).json({
      success: true,
      message: 'Prize added successfully',
      data: { prize }
    });

  } catch (error) {
    console.error('Create Prize Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create prize'
    });
  }
};

// @desc    Get all prizes for a draw (Admin)
// @route   GET /api/prizes/draw/:drawId
// @access  Admin
export const getPrizesByDraw = async (req, res) => {
  try {
    const prizes = await Prize.find({ draw: req.params.drawId })
      .populate('winner', 'fullName contactNumber email')
      .populate('winningToken', 'tokenNumber')
      .sort({ position: 1 });

    return res.status(200).json({
      success: true,
      message: 'Prizes retrieved successfully',
      data: prizes
    });

  } catch (error) {
    console.error('Get Prizes Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get prizes'
    });
  }
};

// @desc    Update prize (Admin)
// @route   PUT /api/prizes/:id
// @access  Admin
export const updatePrize = async (req, res) => {
  try {
    const prize = await Prize.findById(req.params.id);

    if (!prize) {
      return res.status(404).json({
        success: false,
        message: 'Prize not found'
      });
    }

    if (prize.isAwarded) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update awarded prize'
      });
    }

    const updatableFields = ['title', 'description', 'value', 'prizeCategory', 'image', 'position'];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        prize[field] = req.body[field];
      }
    });

    await prize.save();

    return res.status(200).json({
      success: true,
      message: 'Prize updated successfully',
      data: { prize }
    });

  } catch (error) {
    console.error('Update Prize Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update prize'
    });
  }
};

// @desc    Delete prize (Admin)
// @route   DELETE /api/prizes/:id
// @access  Admin
export const deletePrize = async (req, res) => {
  try {
    const prize = await Prize.findById(req.params.id);

    if (!prize) {
      return res.status(404).json({
        success: false,
        message: 'Prize not found'
      });
    }

    if (prize.isAwarded) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete awarded prize'
      });
    }

    if (prize.prizeType === 'grand') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete grand prize. Update it instead.'
      });
    }

    // Delete image from cloudinary if exists
    if (prize.image) {
      await deleteImage(prize.image);
    }

    await Prize.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Prize deleted successfully'
    });

  } catch (error) {
    console.error('Delete Prize Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete prize'
    });
  }
};

// @desc    Assign token to prize secretly (Admin)
// @route   POST /api/prizes/:id/assign-token
// @access  Admin
export const assignTokenToPrize = async (req, res) => {
  try {
    const { tokenNumber } = req.body;

    const prize = await Prize.findById(req.params.id);

    if (!prize) {
      return res.status(404).json({
        success: false,
        message: 'Prize not found'
      });
    }

    // Get the draw
    const draw = await Draw.findById(prize.draw);

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    // Validate token number
    if (tokenNumber < 1 || tokenNumber > draw.totalTokens) {
      return res.status(400).json({
        success: false,
        message: `Token number must be between 1 and ${draw.totalTokens}`
      });
    }

    // Check if token is already assigned to another prize
    const existingAssignment = await Prize.findOne({
      draw: draw._id,
      assignedToken: tokenNumber,
      _id: { $ne: prize._id }
    }).select('+assignedToken');

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'This token is already assigned to another prize'
      });
    }

    // Update prize with assigned token (hidden field)
    await Prize.findByIdAndUpdate(
      prize._id,
      { assignedToken: tokenNumber },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Token assigned to prize successfully'
      // Note: Not returning the assigned token for security
    });

  } catch (error) {
    console.error('Assign Token Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign token'
    });
  }
};

// @desc    Get public prizes for a draw (User)
// @route   GET /api/prizes/public/:drawId
// @access  Public
export const getPublicPrizes = async (req, res) => {
  try {
    const prizes = await Prize.find({ draw: req.params.drawId })
      .select('-assignedToken -winner -winningToken')
      .sort({ position: 1 });

    return res.status(200).json({
      success: true,
      message: 'Prizes retrieved successfully',
      data: prizes
    });

  } catch (error) {
    console.error('Get Public Prizes Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get prizes'
    });
  }
};