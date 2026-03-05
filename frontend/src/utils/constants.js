export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Lucky Draw';

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

export const PAYMENT_METHODS = {
  EASYPAISA: 'easypaisa',
  JAZZCASH: 'jazzcash'
};

export const DRAW_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const TOKEN_STATUS = {
  ACTIVE: 'active',
  WON: 'won',
  LOST: 'lost'
};