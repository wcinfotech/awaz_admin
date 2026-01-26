import twilio from 'twilio';
import config from '../config/config.js';

const sendOTPSMS = async ({ mobileNumber, otp, otpExpiresAt }) => {
  try {
    const client = twilio(config.twilio.accountSid, config.twilio.authToken);
    const message = await client.messages.create({
      body: `Your OTP is ${otp}. It will expire at ${otpExpiresAt}.`,
      from: config.twilio.fromNumber,
      to: mobileNumber,
    });
    console.log(`SMS successfully sent to ${mobileNumber}`);
    return message;
  } catch (error) {
    console.error(`Failed to send SMS to ${mobileNumber}:`, error);
    throw error;
  }
};

export default {
  sendOTPSMS,
};