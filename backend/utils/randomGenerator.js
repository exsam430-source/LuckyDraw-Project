// Generate random token for draw execution
export const generateRandomToken = (min, max, exclude = []) => {
  const available = [];
  
  for (let i = min; i <= max; i++) {
    if (!exclude.includes(i)) {
      available.push(i);
    }
  }
  
  if (available.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
};

// Shuffle array (Fisher-Yates algorithm)
export const shuffleArray = (array) => {
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

// Generate unique random numbers
export const generateUniqueRandomNumbers = (count, min, max) => {
  if (max - min + 1 < count) {
    throw new Error('Range is smaller than count');
  }
  
  const numbers = new Set();
  
  while (numbers.size < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    numbers.add(num);
  }
  
  return Array.from(numbers);
};

// Generate receipt number
export const generateReceiptNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${timestamp}-${random}`;
};

// Generate referral code
export const generateReferralCode = (prefix = 'LD') => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;
  
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return code;
};

// Generate OTP
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};

// Generate random string
export const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return result;
};