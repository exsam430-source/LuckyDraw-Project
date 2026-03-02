import api from './api';

// Validate referral code
export const validateReferralCode = async (code) => {
  const response = await api.get(`/referrals/validate/${code}`);
  return response.data;
};

// Get my referral info
export const getMyReferralInfo = async () => {
  const response = await api.get('/referrals/my');
  return response.data;
};