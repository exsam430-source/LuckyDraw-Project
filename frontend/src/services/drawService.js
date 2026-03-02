import api from './api';

// Get public draws
export const getPublicDraws = async (params) => {
  const response = await api.get('/draws', { params });
  return response.data;
};

// Get draw by ID
export const getDrawById = async (drawId) => {
  const response = await api.get(`/draws/${drawId}`);
  return response.data;
};

// Get public prizes
export const getPublicPrizes = async (drawId) => {
  const response = await api.get(`/prizes/public/${drawId}`);
  return response.data;
};

// Get winning tokens
export const getWinningTokens = async (drawId) => {
  const response = await api.get(`/tokens/draw/${drawId}/winners`);
  return response.data;
};

// Get live draw state
export const getLiveDrawState = async (drawId) => {
  const response = await api.get(`/draws/${drawId}/live`);
  return response.data;
};

// Get active payment accounts (for user payment form)
export const getActivePaymentAccounts = async () => {
  const response = await api.get('/payment-accounts/active');
  return response.data;
};