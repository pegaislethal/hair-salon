import axios from 'axios';

export const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  const provider = process.env.SMS_PROVIDER;
  if (!provider || !process.env.SMS_API_KEY) {
    console.log('[SMS DEV MODE] Would send to:', phone, '| Message:', message);
    return false;
  }
  try {
    if (provider === 'sparrowsms') {
      const response = await axios.post('http://api.sparrowsms.com/v2/sms/', {
        token: process.env.SMS_API_KEY,
        from: process.env.SMS_SENDER_ID || 'IRIS',
        to: phone,
        text: message,
      });
      return response.data?.response_code === 200;
    }
    if (provider === 'nepalsms') {
      const response = await axios.post('https://api.nepalsms.com/api/send-sms', {
        api_key: process.env.SMS_API_KEY,
        sender_id: process.env.SMS_SENDER_ID || 'IRIS',
        phone_number: phone,
        message,
      });
      return response.data?.status === 'success';
    }
    console.warn('[SMS] Unknown provider:', provider);
    return false;
  } catch (error) {
    console.error('[SMS] Send failed:', error);
    return false;
  }
};
