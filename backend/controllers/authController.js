import User from '../models/User.js';
import Referral from '../models/Referral.js';
import { generateJWT } from '../utils/generateToken.js';
import { sendOTP } from '../utils/sendSMS.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { fullName, email, contactNumber, password, currentLocation, referralCode } = req.body;

    const userExists = await User.findOne({
      $or: [{ email }, { contactNumber }]
    });

    if (userExists) {
      if (userExists.email === email) {
        return errorResponse(res, 400, 'Email already registered');
      }
      return errorResponse(res, 400, 'Contact number already registered');
    }

    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referrer) {
        return errorResponse(res, 400, 'Invalid referral code');
      }
    }

    const user = await User.create({
      fullName,
      email,
      contactNumber,
      password,
      currentLocation: currentLocation || {},
      referredBy: referrer ? referrer._id : null
    });

    const otp = user.generateOTP();
    await user.save();

    if (referrer) {
      await Referral.create({
        referrer: referrer._id,
        referred: user._id,
        referralCode: referralCode.toUpperCase(),
        status: 'pending'
      });
    }

    const smsResult = await sendOTP(contactNumber, otp);
    const token = generateJWT(user._id, user.role);

    const responseData = {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        contactNumber: user.contactNumber,
        isVerified: user.isVerified,
        referralCode: user.referralCode
      },
      token,
      message: 'OTP sent to your phone number'
    };

    if (process.env.NODE_ENV === 'development') {
      responseData.otp = otp;
      responseData.smsStatus = smsResult.success ? 'sent' : 'failed';
    }

    return successResponse(res, 201, 'Registration successful. Please verify your phone number.', responseData);
  } catch (error) {
    console.error('Register Error:', error);
    return errorResponse(res, 500, 'Registration failed', error.message);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Private (requires token)
export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).select('+otp.code +otp.expiresAt');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    if (user.isVerified) {
      return errorResponse(res, 400, 'User already verified');
    }

    if (!user.verifyOTP(otp)) {
      return errorResponse(res, 400, 'Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = generateJWT(user._id, user.role);

    return successResponse(res, 200, 'Phone number verified successfully', {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        contactNumber: user.contactNumber,
        isVerified: user.isVerified,
        referralCode: user.referralCode,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return errorResponse(res, 500, 'OTP verification failed');
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Private
export const resendOTP = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    if (user.isVerified) {
      return errorResponse(res, 400, 'User already verified');
    }

    const otp = user.generateOTP();
    await user.save();

    const smsResult = await sendOTP(user.contactNumber, otp);

    const responseData = {
      message: 'OTP sent successfully'
    };

    if (process.env.NODE_ENV === 'development') {
      responseData.otp = otp;
      responseData.smsStatus = smsResult.success ? 'sent' : 'failed';
    }

    return successResponse(res, 200, 'OTP resent successfully', responseData);
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return errorResponse(res, 500, 'Failed to resend OTP');
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    if (!user.isActive) {
      return errorResponse(res, 401, 'Account is deactivated. Contact support.');
    }

    if (!user.isVerified) {
      const otp = user.generateOTP();
      await user.save();
      await sendOTP(user.contactNumber, otp);

      const token = generateJWT(user._id, user.role);

      const responseData = {
        requiresVerification: true,
        token,
        contactNumber: user.contactNumber,
        message: 'Please verify your phone number'
      };

      if (process.env.NODE_ENV === 'development') {
        responseData.otp = otp;
      }

      return successResponse(res, 200, 'Verification required', responseData);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateJWT(user._id, user.role);

    return successResponse(res, 200, 'Login successful', {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        contactNumber: user.contactNumber,
        role: user.role,
        referralCode: user.referralCode,
        referralPoints: user.referralPoints,
        isVerified: user.isVerified
      },
      token
    });
  } catch (error) {
    console.error('Login Error:', error);
    return errorResponse(res, 500, 'Login failed');
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('referredBy', 'fullName referralCode');

    return successResponse(res, 200, 'User profile retrieved', { user });
  } catch (error) {
    console.error('Get Me Error:', error);
    return errorResponse(res, 500, 'Failed to get profile');
  }
};

// @desc    Forgot password - send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email, contactNumber } = req.body;

    if (!email && !contactNumber) {
      return errorResponse(res, 400, 'Please provide email or contact number');
    }

    const query = email ? { email } : { contactNumber };
    const user = await User.findOne(query);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const otp = user.generateOTP();
    await user.save();

    const smsResult = await sendOTP(user.contactNumber, otp);

    const responseData = {
      message: 'Password reset OTP sent',
      email: user.email // send back so frontend can pass it to reset
    };

    if (process.env.NODE_ENV === 'development') {
      responseData.otp = otp;
    }

    return successResponse(res, 200, 'Password reset OTP sent', responseData);
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return errorResponse(res, 500, 'Failed to process request');
  }
};

// @desc    Reset password (NOW PUBLIC — no auth middleware needed)
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword, email, contactNumber } = req.body;

    if (!otp || !newPassword) {
      return errorResponse(res, 400, 'OTP and new password are required');
    }

    if (!email && !contactNumber) {
      return errorResponse(res, 400, 'Email or contact number is required');
    }

    const query = email ? { email } : { contactNumber };
    const user = await User.findOne(query).select('+otp.code +otp.expiresAt');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    if (!user.verifyOTP(otp)) {
      return errorResponse(res, 400, 'Invalid or expired OTP');
    }

    user.password = newPassword;
    user.otp = undefined;
    await user.save();

    return successResponse(res, 200, 'Password reset successful');
  } catch (error) {
    console.error('Reset Password Error:', error);
    return errorResponse(res, 500, 'Failed to reset password');
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 400, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, 'Password changed successfully');
  } catch (error) {
    console.error('Change Password Error:', error);
    return errorResponse(res, 500, 'Failed to change password');
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    return successResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Logout failed');
  }
};