import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { errorResponse } from '../utils/responseHandler.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Not authorized, no token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return errorResponse(res, 401, 'User not found');
    }

    if (!user.isActive) {
      return errorResponse(res, 401, 'Account is deactivated');
    }

    if (!user.isVerified) {
      return errorResponse(res, 401, 'Account not verified. Please verify your phone number');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return errorResponse(res, 401, 'Not authorized, token failed');
  }
};

// Allow unverified users (for OTP verification)
export const protectUnverified = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.error('protectUnverified: No token in request');
      return errorResponse(res, 401, 'Not authorized, no token provided');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('protectUnverified: JWT verify failed:', jwtError.message);
      console.error('protectUnverified: JWT_SECRET loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');
      return errorResponse(res, 401, 'Not authorized, token invalid');
    }

    // Use +otp.code +otp.expiresAt to include nested select:false fields
    const user = await User.findById(decoded.id).select('-password +otp.code +otp.expiresAt');

    if (!user) {
      console.error('protectUnverified: User not found for id:', decoded.id);
      return errorResponse(res, 401, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('protectUnverified Error:', error.message);
    return errorResponse(res, 401, 'Not authorized, token failed');
  }
};