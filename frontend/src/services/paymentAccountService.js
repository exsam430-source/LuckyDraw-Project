import api from './api';

// Get active payment accounts (public/user)
export const getActivePaymentAccounts = async () => {
  const response = await api.get('/payment-accounts/active');
  return response.data;
};

// Get all payment accounts (admin)
export const getAllPaymentAccounts = async () => {
  const response = await api.get('/payment-accounts');
  return response.data;
};

// Create payment account (admin)
export const createPaymentAccount = async (formData) => {
  const response = await api.post('/payment-accounts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Update payment account (admin)
export const updatePaymentAccount = async (id, formData) => {
  const response = await api.put(`/payment-accounts/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Delete payment account (admin)
export const deletePaymentAccount = async (id) => {
  const response = await api.delete(`/payment-accounts/${id}`);
  return response.data;
};

// Set primary account (admin)
export const setPrimaryAccount = async (id) => {
  const response = await api.patch(`/payment-accounts/${id}/primary`);
  return response.data;
};