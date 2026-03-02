import api from './api';

// Create payment — sends FormData with screenshot file
export const createPayment = async (formData) => {
  // formData is already a FormData instance from the component
  // api.js interceptor will auto-detect FormData and remove Content-Type
  // so browser sets multipart/form-data with correct boundary for multer
  const response = await api.post('/payments', formData);
  return response.data;
};

// Get my payments
export const getMyPayments = async (params) => {
  const response = await api.get('/payments/my', { params });
  return response.data;
};

// Get payment receipt
export const getPaymentReceipt = async (paymentId) => {
  const response = await api.get(`/payments/${paymentId}/receipt`);
  return response.data;
};