import { errorResponse } from '../utils/responseHandler.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Not authorized');
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res, 
        403, 
        `Role '${req.user.role}' is not authorized to access this route`
      );
    }

    next();
  };
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return errorResponse(res, 403, 'Admin access required');
  }
};

export const isUser = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    return errorResponse(res, 403, 'User access required');
  }
};