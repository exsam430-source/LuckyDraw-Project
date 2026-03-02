import api from './api';

// ==================== DASHBOARD ====================
export const getAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

// ==================== USERS ====================
export const getAllUsers = async (params) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

export const updateUserStatus = async (userId, data) => {
  const response = await api.patch(`/admin/users/${userId}/status`, data);
  return response.data;
};

export const createAdminUser = async (userData) => {
  const response = await api.post('/admin/create-admin', userData);
  return response.data;
};

// ==================== DRAWS ====================
export const getAllDrawsAdmin = async (params) => {
  const response = await api.get('/draws/admin/all', { params });
  return response.data;
};

export const getDrawByIdAdmin = async (drawId) => {
  const response = await api.get(`/draws/admin/${drawId}`);
  return response.data;
};

export const createDraw = async (drawData) => {
  const response = await api.post('/draws', drawData);
  return response.data;
};

export const updateDraw = async (drawId, drawData) => {
  const response = await api.put(`/draws/${drawId}`, drawData);
  return response.data;
};

export const deleteDraw = async (drawId) => {
  const response = await api.delete(`/draws/${drawId}`);
  return response.data;
};

export const changeDrawStatus = async (drawId, status) => {
  const response = await api.patch(`/draws/${drawId}/status`, { status });
  return response.data;
};

export const executeDraw = async (drawId) => {
  const response = await api.post(`/admin/draws/${drawId}/execute`);
  return response.data;
};

export const generateRandomToken = async (drawId, excludeTokens = []) => {
  const response = await api.post(`/admin/draws/${drawId}/random-token`, { excludeTokens });
  return response.data;
};

// ==================== PAYMENTS ====================
export const getAllPaymentsAdmin = async (params) => {
  const response = await api.get('/payments/admin/all', { params });
  return response.data;
};

export const getPaymentByIdAdmin = async (paymentId) => {
  const response = await api.get(`/payments/admin/${paymentId}`);
  return response.data;
};

export const approvePayment = async (paymentId) => {
  const response = await api.post(`/payments/${paymentId}/approve`);
  return response.data;
};

export const rejectPayment = async (paymentId, reason) => {
  const response = await api.post(`/payments/${paymentId}/reject`, { reason });
  return response.data;
};

// ==================== PRIZES ====================
export const getPrizesByDraw = async (drawId) => {
  const response = await api.get(`/prizes/draw/${drawId}`);
  return response.data;
};

export const createPrize = async (prizeData) => {
  const response = await api.post('/prizes', prizeData);
  return response.data;
};

export const updatePrize = async (prizeId, prizeData) => {
  const response = await api.put(`/prizes/${prizeId}`, prizeData);
  return response.data;
};

export const deletePrize = async (prizeId) => {
  const response = await api.delete(`/prizes/${prizeId}`);
  return response.data;
};

export const assignTokenToPrize = async (prizeId, tokenNumber) => {
  const response = await api.post(`/prizes/${prizeId}/assign-token`, { tokenNumber });
  return response.data;
};

// ==================== TOKENS ====================
export const getTokensByDraw = async (drawId, params) => {
  const response = await api.get(`/tokens/draw/${drawId}`, { params });
  return response.data;
};

export const getTokenSummary = async (drawId) => {
  const response = await api.get(`/tokens/draw/${drawId}/summary`);
  return response.data;
};

// ==================== REFERRALS ====================
export const getAllReferrals = async (params) => {
  const response = await api.get('/referrals/admin/all', { params });
  return response.data;
};

export const getTopReferrers = async (limit = 10) => {
  const response = await api.get(`/referrals/admin/top?limit=${limit}`);
  return response.data;
};

export const awardReferralPoints = async (userId, points, reason) => {
  const response = await api.post('/referrals/admin/award', { userId, points, reason });
  return response.data;
};

// ==================== REPORTS ====================
export const getDrawReport = async (drawId) => {
  const response = await api.get(`/reports/draw/${drawId}`);
  return response.data;
};

export const getParticipantsList = async (drawId, params) => {
  const response = await api.get(`/reports/draw/${drawId}/participants`, { params });
  return response.data;
};

export const getRevenueReport = async (params) => {
  const response = await api.get('/reports/revenue', { params });
  return response.data;
};

export const getUserActivityReport = async (days = 30) => {
  const response = await api.get(`/reports/users/activity?days=${days}`);
  return response.data;
};

// ==================== LIVE DRAW ====================
export const rollDraw = async (drawId, prizeId = null) => {
  const { data } = await api.post(`/admin/draws/${drawId}/roll`, {
    prizeId: prizeId || undefined
  });
  return data;
};
export const confirmDrawnToken = async (drawId, payload) => {
  const { data } = await api.post(`/admin/draws/${drawId}/confirm-draw`, payload);
  return data;
};

export const toggleLiveDraw = async (drawId, isLive) => {
  const response = await api.post(`/admin/draws/${drawId}/toggle-live`, { isLive });
  return response.data;
};

export const getDrawResults = async (drawId) => {
  const { data } = await api.get(`/admin/draws/${drawId}/results`);
  return data;
};