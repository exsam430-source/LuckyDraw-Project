import twilio from 'twilio';

let client = null;

const getClient = () => {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      return null;
    }
    client = twilio(sid, token);
  }
  return client;
};

const formatPhoneNumber = (phone) => {
  let formatted = phone.replace(/\s+/g, '').replace(/-/g, '');
  if (formatted.startsWith('0')) {
    formatted = '+92' + formatted.substring(1);
  } else if (!formatted.startsWith('+')) {
    formatted = '+92' + formatted;
  }
  return formatted;
};

export const sendSMS = async (to, message) => {
  // Skip SMS entirely in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 [DEV] SMS skipped → To: ${to}`);
    console.log(`📱 [DEV] Message: ${message}`);
    return { success: true, dev: true };
  }

  try {
    const twilioClient = getClient();
    if (!twilioClient) {
      console.warn('⚠️ Twilio not configured — SMS skipped');
      return { success: false, error: 'Twilio not configured' };
    }

    const formattedNumber = formatPhoneNumber(to);

    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });

    console.log(`✅ SMS sent to ${formattedNumber}: ${response.sid}`);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error(`❌ SMS Error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const sendOTP = async (phoneNumber, otp) => {
  const message = `Your ${process.env.APP_NAME || 'LuckyDraw'} verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  return await sendSMS(phoneNumber, message);
};

export const sendPaymentConfirmation = async (phoneNumber, data) => {
  const message = `${process.env.APP_NAME || 'LuckyDraw'}: Your payment of Rs ${data.amount} for ${data.drawName} has been approved. Tokens assigned: ${data.tokens}. Good luck!`;
  return await sendSMS(phoneNumber, message);
};

export const sendWinnerNotification = async (phoneNumber, data) => {
  const message = `🎉 Congratulations! Your token #${data.tokenNumber} won "${data.prize}" in ${data.drawName}! Contact us to claim your prize.`;
  return await sendSMS(phoneNumber, message);
};

export const sendDrawReminder = async (phoneNumber, data) => {
  const message = `${process.env.APP_NAME || 'LuckyDraw'}: Reminder! The draw "${data.drawName}" will be executed on ${data.drawDate}. Your tokens: ${data.tokens}. Good luck!`;
  return await sendSMS(phoneNumber, message);
};