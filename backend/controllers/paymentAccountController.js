import PaymentAccount from '../models/PaymentAccount.js';
import { deleteImage } from '../config/cloudinary.js';

// @desc    Create payment account
// @route   POST /api/payment-accounts
// @access  Admin
export const createPaymentAccount = async (req, res) => {
  try {
    const { accountType, accountName, accountNumber, isActive, isPrimary } = req.body;

    if (isPrimary === true || isPrimary === 'true') {
      await PaymentAccount.updateMany({}, { isPrimary: false });
    }

    const account = await PaymentAccount.create({
      accountType,
      accountName,
      accountNumber,
      qrCode: req.file?.path || '',
      qrCodePublicId: req.file?.filename || '',
      isActive: isActive !== undefined ? (isActive === true || isActive === 'true') : true,
      isPrimary: isPrimary === true || isPrimary === 'true'
    });

    return res.status(201).json({
      success: true,
      message: 'Payment account created successfully',
      data: { account }
    });
  } catch (error) {
    console.error('Create Payment Account Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment account'
    });
  }
};

// @desc    Get all payment accounts
// @route   GET /api/payment-accounts
// @access  Admin
export const getAllPaymentAccounts = async (req, res) => {
  try {
    const accounts = await PaymentAccount.find().sort({ isPrimary: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Payment accounts retrieved',
      data: accounts
    });
  } catch (error) {
    console.error('Get Payment Accounts Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment accounts'
    });
  }
};

// @desc    Update payment account
// @route   PUT /api/payment-accounts/:id
// @access  Admin
export const updatePaymentAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Payment account not found'
      });
    }

    const { accountType, accountName, accountNumber, isActive, isPrimary } = req.body;

    if (isPrimary === true || isPrimary === 'true') {
      await PaymentAccount.updateMany({ _id: { $ne: account._id } }, { isPrimary: false });
    }

    if (accountType) account.accountType = accountType;
    if (accountName) account.accountName = accountName;
    if (accountNumber) account.accountNumber = accountNumber;
    if (isActive !== undefined) account.isActive = isActive === true || isActive === 'true';
    if (isPrimary !== undefined) account.isPrimary = isPrimary === true || isPrimary === 'true';

    // Handle new QR code upload
    if (req.file) {
      // Delete old QR code from Cloudinary
      if (account.qrCodePublicId) {
        await deleteImage(account.qrCodePublicId);
      }
      account.qrCode = req.file.path;
      account.qrCodePublicId = req.file.filename;
    }

    await account.save();

    return res.status(200).json({
      success: true,
      message: 'Payment account updated',
      data: { account }
    });
  } catch (error) {
    console.error('Update Payment Account Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment account'
    });
  }
};

// @desc    Delete payment account
// @route   DELETE /api/payment-accounts/:id
// @access  Admin
export const deletePaymentAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Payment account not found'
      });
    }

    if (account.isPrimary) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete primary account. Set another account as primary first.'
      });
    }

    // Delete QR code from Cloudinary
    if (account.qrCodePublicId) {
      await deleteImage(account.qrCodePublicId);
    }

    await PaymentAccount.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Payment account deleted'
    });
  } catch (error) {
    console.error('Delete Payment Account Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete payment account'
    });
  }
};

// @desc    Set primary account
// @route   PATCH /api/payment-accounts/:id/primary
// @access  Admin
export const setPrimaryAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Payment account not found'
      });
    }

    if (!account.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set inactive account as primary'
      });
    }

    await PaymentAccount.updateMany({}, { isPrimary: false });

    account.isPrimary = true;
    await account.save();

    return res.status(200).json({
      success: true,
      message: 'Primary account updated',
      data: { account }
    });
  } catch (error) {
    console.error('Set Primary Account Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to set primary account'
    });
  }
};

// @desc    Get active payment accounts (for users)
// @route   GET /api/payment-accounts/active
// @access  Public
export const getActivePaymentAccounts = async (req, res) => {
  try {
    const accounts = await PaymentAccount.find({ isActive: true })
      .select('-qrCodePublicId')
      .sort({ isPrimary: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Active payment accounts retrieved',
      data: accounts
    });
  } catch (error) {
    console.error('Get Active Payment Accounts Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment accounts'
    });
  }
};