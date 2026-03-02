import Draw from '../models/Draw.js';
import Token from '../models/Token.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Prize from '../models/Prize.js';
import { 
  generateDrawReportPDF, 
  generateWinnersListPDF,
  generatePaymentReceiptPDF 
} from '../utils/pdfGenerator.js';

// @desc    Get draw report (Admin)
// @route   GET /api/reports/draw/:drawId
// @access  Admin
export const getDrawReport = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.drawId)
      .populate('createdBy', 'fullName');

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    // Get statistics
    const [
      tokenStats,
      paymentStats,
      participantCount,
      prizes
    ] = await Promise.all([
      Token.aggregate([
        { $match: { draw: draw._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Payment.aggregate([
        { $match: { draw: draw._id, status: 'approved' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalAmount' },
            totalPayments: { $sum: 1 },
            totalTokens: { $sum: '$numberOfTokens' }
          }
        }
      ]),
      Token.distinct('user', { draw: draw._id }),
      Prize.find({ draw: draw._id })
        .populate('winner', 'fullName contactNumber')
        .sort({ position: 1 })
    ]);

    const payment = paymentStats[0] || { totalRevenue: 0, totalPayments: 0, totalTokens: 0 };

    // Get winners
    const winners = prizes
      .filter(p => p.isAwarded)
      .map(p => ({
        position: p.position,
        prizeType: p.prizeType,
        prizeTitle: p.title,
        prizeValue: p.value,
        winnerName: p.winner?.fullName || 'Unknown',
        winnerContact: p.winner?.contactNumber || 'N/A',
        tokenNumber: p.assignedToken,
        awardedAt: p.awardedAt
      }));

    const report = {
      draw: {
        id: draw._id,
        name: draw.drawName,
        description: draw.description,
        status: draw.status,
        totalTokens: draw.totalTokens,
        tokensSold: draw.tokensSold,
        tokenPrice: draw.tokenPrice,
        startDate: draw.startDate,
        endDate: draw.endDate,
        executedAt: draw.drawExecutedAt,
        createdBy: draw.createdBy?.fullName
      },
      statistics: {
        totalParticipants: participantCount.length,
        totalRevenue: payment.totalRevenue,
        totalPayments: payment.totalPayments,
        tokenStats: tokenStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      },
      prizes: prizes.map(p => ({
        title: p.title,
        type: p.prizeType,
        value: p.value,
        isAwarded: p.isAwarded
      })),
      winners,
      generatedAt: new Date()
    };

    return res.status(200).json({
      success: true,
      message: 'Draw report generated',
      data: report
    });

  } catch (error) {
    console.error('Get Draw Report Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
};

// @desc    Get participants list (Admin)
// @route   GET /api/reports/draw/:drawId/participants
// @access  Admin
export const getParticipantsList = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const draw = await Draw.findById(req.params.drawId);

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    // Get unique participants with their token counts
    const participants = await Token.aggregate([
      { $match: { draw: draw._id } },
      {
        $group: {
          _id: '$user',
          tokenCount: { $sum: 1 },
          tokens: { $push: '$tokenNumber' },
          totalSpent: { $sum: '$price' }
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
          tokens: 1,
          totalSpent: 1
        }
      },
      { $sort: { tokenCount: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    const total = await Token.distinct('user', { draw: draw._id });

    return res.status(200).json({
      success: true,
      message: 'Participants list retrieved',
      data: {
        drawName: draw.drawName,
        participants
      },
      pagination: {
        total: total.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total.length / limit)
      }
    });

  } catch (error) {
    console.error('Get Participants List Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get participants'
    });
  }
};

// @desc    Get winners list (Admin/Public for completed draws)
// @route   GET /api/reports/draw/:drawId/winners
// @access  Admin/Public
export const getWinnersList = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.drawId);

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    // For non-completed draws, only admin can see
    if (draw.status !== 'completed' && req.user?.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Draw results not available yet'
      });
    }

    const winners = await Token.find({
      draw: draw._id,
      isWinner: true
    })
      .populate('user', 'fullName contactNumber')
      .populate('prize', 'title value prizeType position')
      .sort({ 'prize.position': 1 });

    const winnersData = winners.map(w => ({
      tokenNumber: w.tokenNumber,
      winner: {
        name: w.user.fullName,
        contact: req.user?.role === 'admin' ? w.user.contactNumber : '***' + w.user.contactNumber.slice(-4)
      },
      prize: {
        title: w.prize.title,
        value: w.prize.value,
        type: w.prize.prizeType
      }
    }));

    // Separate grand prize and others
    const grandPrizeWinner = winnersData.find(w => w.prize.type === 'grand');
    const otherWinners = winnersData.filter(w => w.prize.type !== 'grand');

    return res.status(200).json({
      success: true,
      message: 'Winners list retrieved',
      data: {
        draw: {
          id: draw._id,
          name: draw.drawName,
          executedAt: draw.drawExecutedAt
        },
        grandPrizeWinner,
        otherWinners,
        totalWinners: winnersData.length
      }
    });

  } catch (error) {
    console.error('Get Winners List Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get winners'
    });
  }
};

// @desc    Get revenue report (Admin)
// @route   GET /api/reports/revenue
// @access  Admin
export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchStage = { status: 'approved' };
    
    if (startDate || endDate) {
      matchStage.approvedAt = {};
      if (startDate) matchStage.approvedAt.$gte = new Date(startDate);
      if (endDate) matchStage.approvedAt.$lte = new Date(endDate);
    }

    let groupFormat;
    switch (groupBy) {
      case 'month':
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$approvedAt' } };
        break;
      case 'week':
        groupFormat = { $dateToString: { format: '%Y-W%V', date: '$approvedAt' } };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$approvedAt' } };
    }

    const revenueData = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$finalAmount' },
          transactions: { $sum: 1 },
          tokens: { $sum: '$numberOfTokens' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get totals
    const totals = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalTransactions: { $sum: 1 },
          totalTokens: { $sum: '$numberOfTokens' }
        }
      }
    ]);

    // Revenue by draw
    const revenueByDraw = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$draw',
          revenue: { $sum: '$finalAmount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'draws',
          localField: '_id',
          foreignField: '_id',
          as: 'drawInfo'
        }
      },
      { $unwind: '$drawInfo' },
      {
        $project: {
          drawId: '$_id',
          drawName: '$drawInfo.drawName',
          revenue: 1,
          transactions: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Revenue by payment method
    const revenueByMethod = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$finalAmount' },
          transactions: { $sum: 1 }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Revenue report generated',
      data: {
        totals: totals[0] || { totalRevenue: 0, totalTransactions: 0, totalTokens: 0 },
        timeline: revenueData,
        byDraw: revenueByDraw,
        byPaymentMethod: revenueByMethod,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Present',
          groupBy
        }
      }
    });

  } catch (error) {
    console.error('Get Revenue Report Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate revenue report'
    });
  }
};

// @desc    Download draw report as PDF (Admin)
// @route   GET /api/reports/draw/:drawId/download
// @access  Admin
export const downloadDrawReport = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.drawId);

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    // Get winners
    const winners = await Token.find({
      draw: draw._id,
      isWinner: true
    })
      .populate('user', 'fullName')
      .populate('prize', 'title value');

    // Calculate revenue
    const revenueData = await Payment.aggregate([
      { $match: { draw: draw._id, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);

    const participants = await Token.distinct('user', { draw: draw._id });

    const reportData = {
      drawName: draw.drawName,
      totalTokens: draw.totalTokens,
      tokensSold: draw.tokensSold,
      tokenPrice: draw.tokenPrice,
      totalRevenue: revenueData[0]?.total || 0,
      totalParticipants: participants.length,
      winners: winners.map(w => ({
        tokenNumber: w.tokenNumber,
        userName: w.user.fullName,
        prize: w.prize.title
      }))
    };

    const pdfBuffer = await generateDrawReportPDF(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=draw-report-${draw._id}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Download Report Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate PDF'
    });
  }
};

// @desc    Get user activity report (Admin)
// @route   GET /api/reports/users/activity
// @access  Admin
export const getUserActivityReport = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // New registrations
    const newUsers = await User.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          role: 'user'
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Active buyers
    const activeBuyers = await Payment.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: 'approved'
        } 
      },
      {
        $group: {
          _id: '$user',
          purchases: { $sum: 1 },
          totalSpent: { $sum: '$finalAmount' }
        }
      },
      { $count: 'total' }
    ]);

    // Top buyers
    const topBuyers = await Payment.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$finalAmount' },
          purchases: { $sum: 1 },
          tokens: { $sum: '$numberOfTokens' }
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
          totalSpent: 1,
          purchases: 1,
          tokens: 1
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    return res.status(200).json({
      success: true,
      message: 'User activity report generated',
      data: {
        period: `Last ${days} days`,
        newRegistrations: newUsers,
        activeBuyers: activeBuyers[0]?.total || 0,
        topBuyers
      }
    });

  } catch (error) {
    console.error('User Activity Report Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
};