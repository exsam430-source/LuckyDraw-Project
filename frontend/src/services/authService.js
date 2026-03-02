import api from './api';

// Register — save token internally for OTP verification
export const register = async (userData) => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  const response = await api.post('/auth/register', userData);

  // Save token immediately — needed for verify-otp API call
  const token = response.data?.data?.token;
  if (token) {
    localStorage.setItem('token', token);
  }

  return response.data;
};

// Verify OTP
export const verifyOTP = async (otp) => {
  const response = await api.post('/auth/verify-otp', { otp });
  if (response.data.data?.token) {
    localStorage.setItem('token', response.data.data.token);
  }
  if (response.data.data?.user) {
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }
  return response.data;
};

// Resend OTP
export const resendOTP = async () => {
  const response = await api.post('/auth/resend-otp');
  return response.data;
};

// Login — save token internally
export const login = async (credentials) => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  const response = await api.post('/auth/login', credentials);

  // Always save token (even for unverified users who need OTP flow)
  const token = response.data?.data?.token;
  if (token) {
    localStorage.setItem('token', token);
  }

  // Only save user if verified login (not requiresVerification)
  const user = response.data?.data?.user;
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  return response.data;
};

// Logout
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Get current user
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  if (response.data.data?.user) {
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }
  return response.data;
};

// Forgot password
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

// Reset password
export const resetPassword = async (otp, newPassword, email) => {
  const response = await api.post('/auth/reset-password', { otp, newPassword, email });
  return response.data;
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/auth/change-password', {
    currentPassword,
    newPassword
  });
  return response.data;
};