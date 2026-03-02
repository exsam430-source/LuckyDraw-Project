import api from './api';

// Get user dashboard
export const getUserDashboard = async () => {
  const response = await api.get('/user/dashboard');
  return response.data;
};

// Get user profile
export const getUserProfile = async () => {
  const response = await api.get('/user/profile');
  return response.data;
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  const response = await api.put('/user/profile', profileData);
  return response.data;
};

// Get available draws
export const getAvailableDraws = async (params) => {
  const response = await api.get('/user/draws', { params });
  return response.data;
};

// Get draw details — combines public draw + user's tokens
export const getDrawDetails = async (drawId) => {
  const token = localStorage.getItem('token');

  if (token) {
    // Logged in — fetch draw info AND user's tokens in parallel
    const [drawRes, tokensRes] = await Promise.all([
      api.get(`/draws/${drawId}`),
      api.get(`/tokens/my/draw/${drawId}`).catch(() => ({
        data: {
          success: true,
          data: {
            tokens: [],
            draw: null,
            tokenCount: 0,
            canBuyMore: true,
            maxCanBuy: 10
          }
        }
      }))
    ]);

    const draw = drawRes.data.data?.draw || drawRes.data.data;
    const tokenData = tokensRes.data.data || {};

    return {
      data: {
        draw,
        userTokens: tokenData.tokens || [],
        userPayments: [],
        canBuyMore: tokenData.canBuyMore ?? true,
        maxCanBuy: tokenData.maxCanBuy ?? (draw?.maxTokensPerUser || 10)
      }
    };
  } else {
    // Not logged in — just fetch public draw info
    const drawRes = await api.get(`/draws/${drawId}`);
    const draw = drawRes.data.data?.draw || drawRes.data.data;

    return {
      data: {
        draw,
        userTokens: [],
        userPayments: [],
        canBuyMore: false,
        maxCanBuy: 0
      }
    };
  }
};

// Get my tokens
export const getMyTokens = async (params) => {
  const response = await api.get('/tokens/my', { params });
  return response.data;
};

// Get my payments
export const getMyPayments = async (params) => {
  const response = await api.get('/payments/my', { params });
  return response.data;
};

// Get payment details
export const getPaymentDetails = async (paymentId) => {
  const response = await api.get(`/payments/${paymentId}/receipt`);
  return response.data;
};

// Get referral info
export const getMyReferrals = async () => {
  const response = await api.get('/user/referrals');
  return response.data;
};

// Get results
export const getResults = async (params) => {
  const response = await api.get('/user/results', { params });
  return response.data;
};