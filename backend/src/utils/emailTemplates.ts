// Email templates for Iris Salon notifications

export const bookingConfirmationTemplate = (data: {
  customerName: string;
  bookingRef: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
}): string => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 30px; text-align: center; color: white; }
  .body { padding: 30px; }
  .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
  .footer { background: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #888; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>🌸 Iris Hair Cut and Salon</h1>
    <p>Appointment Confirmed!</p>
  </div>
  <div class="body">
    <p>Hi <strong>${data.customerName}</strong>,</p>
    <p>Your appointment has been confirmed. Here are the details:</p>
    <div class="detail-row"><span>Booking Reference</span><strong>${data.bookingRef}</strong></div>
    <div class="detail-row"><span>Service</span><strong>${data.serviceName}</strong></div>
    <div class="detail-row"><span>Date</span><strong>${data.date}</strong></div>
    <div class="detail-row"><span>Time</span><strong>${data.time}</strong></div>
    <div class="detail-row"><span>Price</span><strong>NPR ${data.price}</strong></div>
    <p style="margin-top:20px;">Please arrive 5 minutes early. If you need to cancel, please do so at least 2 hours in advance.</p>
    <p>See you soon! 💇‍♀️</p>
  </div>
  <div class="footer">
    <p>Iris Hair Cut and Salon | Kathmandu, Nepal</p>
  </div>
</div>
</body>
</html>
`;

export const bookingRejectionTemplate = (data: {
  customerName: string;
  bookingRef: string;
  serviceName: string;
  reason: string;
}): string => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
<div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:8px;">
  <h2 style="color:#8B5CF6;">🌸 Iris Hair Cut and Salon</h2>
  <p>Hi <strong>${data.customerName}</strong>,</p>
  <p>Unfortunately, we were unable to accommodate your appointment request (<strong>${data.bookingRef}</strong>) for <strong>${data.serviceName}</strong>.</p>
  <p><strong>Reason:</strong> ${data.reason}</p>
  <p>We apologize for the inconvenience. Please try booking for another time slot.</p>
  <p>Thank you for choosing Iris Salon!</p>
</div>
</body>
</html>
`;

export const passwordResetTemplate = (resetUrl: string, customerName: string): string => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
<div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:8px;">
  <h2 style="color:#8B5CF6;">🌸 Iris Hair Cut and Salon — Password Reset</h2>
  <p>Hi <strong>${customerName}</strong>,</p>
  <p>You requested a password reset. Click the button below to reset your password:</p>
  <a href="${resetUrl}" style="display:inline-block;background:#8B5CF6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">Reset Password</a>
  <p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>
</div>
</body>
</html>
`;
