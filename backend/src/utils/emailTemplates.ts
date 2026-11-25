const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

const layout = (title: string, intro: string, content: string): string => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f7f4ef;font-family:Arial,Helvetica,sans-serif;color:#262626;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f4ef;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e9e4dc;">
<tr><td align="center" style="background:#18181b;padding:28px 20px;"><div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#f4d58d;">Iris Hair Cut &amp; Salon</div><div style="margin-top:6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#d4d4d8;">Luxury Beauty &amp; Style</div></td></tr>
<tr><td style="padding:32px 28px;"><h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#18181b;">${escapeHtml(title)}</h1><p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#52525b;">${intro}</p>${content}</td></tr>
<tr><td style="background:#fafafa;padding:18px 28px;text-align:center;border-top:1px solid #eee;"><p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">Iris Hair Cut &amp; Salon<br>Thank you for choosing Iris.</p></td></tr>
</table></td></tr></table></body></html>`;

const details = (rows: Array<[string, unknown]>): string => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">${rows.map(([label, value]) => `<tr><td style="padding:10px 12px;border-bottom:1px solid #eeeeee;font-size:13px;color:#71717a;width:36%;">${escapeHtml(label)}</td><td style="padding:10px 12px;border-bottom:1px solid #eeeeee;font-size:14px;font-weight:bold;color:#18181b;">${escapeHtml(value)}</td></tr>`).join('')}</table>`;

export interface AppointmentEmailData {
  customerName: string;
  bookingRef: string;
  serviceName: string;
  date: string;
  time: string;
  price?: number;
  reason?: string;
  previousDate?: string;
  previousTime?: string;
  barberName?: string;
}

export const bookingPendingTemplate = (data: AppointmentEmailData): string => layout(
  'Your booking request is pending',
  `Hi ${escapeHtml(data.customerName)}, we have received your request. It will remain <strong>PENDING</strong> until a Super Admin or authorized admin accepts it.`,
  details([
    ['Booking reference', data.bookingRef],
    ['Service', data.serviceName],
    ['Barber', data.barberName || 'Lycan'],
    ['Requested date', data.date],
    ['Requested time', data.time],
    ['Status', 'PENDING'],
    ['Price', data.price ? `NPR ${data.price}` : 'As listed'],
  ])
);

export const bookingConfirmationTemplate = (data: AppointmentEmailData): string => layout(
  'Appointment confirmed',
  `Hi ${escapeHtml(data.customerName)}, your appointment has been accepted and confirmed.`,
  details([['Booking reference', data.bookingRef], ['Service', data.serviceName], ['Date', data.date], ['Time', data.time], ['Price', data.price ? `NPR ${data.price}` : 'As listed'], ['Status', 'CONFIRMED']])
);

export const bookingAlternativeTemplate = (data: AppointmentEmailData & {
  suggestedDate: string;
  suggestedTime: string;
}): string => layout(
  'Alternative appointment time suggested',
  `Hi ${escapeHtml(data.customerName)}, your requested time is unavailable. Please review the suggested alternative below and accept it or contact our salon team to discuss another time.`,
  details([
    ['Booking reference', data.bookingRef],
    ['Service', data.serviceName],
    ['Requested date', data.date],
    ['Requested time', data.time],
    ['Suggested date', data.suggestedDate],
    ['Suggested time', data.suggestedTime],
    ['Barber', data.barberName || 'Lycan'],
    ['Status', 'RESCHEDULE REQUESTED'],
  ])
);

export const bookingSuggestionResponseTemplate = (data: AppointmentEmailData & {
  response: 'accepted' | 'rejected';
  suggestedDate: string;
  suggestedTime: string;
}): string => layout(
  data.response === 'accepted' ? 'Alternative time accepted' : 'Alternative time declined',
  data.response === 'accepted'
    ? `Hi ${escapeHtml(data.customerName)}, your alternative appointment time has been accepted and confirmed.`
    : `Hi ${escapeHtml(data.customerName)}, we’ve recorded that you declined the suggested appointment time. Our salon team will review your request.`,
  details([
    ['Booking reference', data.bookingRef],
    ['Service', data.serviceName],
    ['Suggested date', data.suggestedDate],
    ['Suggested time', data.suggestedTime],
    ['Response', data.response.toUpperCase()],
  ])
);

export const bookingSuggestionResponseAdminTemplate = (data: AppointmentEmailData & {
  response: 'accepted' | 'rejected';
  suggestedDate: string;
  suggestedTime: string;
}): string => layout(
  'Customer response to alternative time',
  `${escapeHtml(data.customerName)} ${data.response === 'accepted' ? 'accepted' : 'declined'} the suggested appointment time.`,
  details([
    ['Booking reference', data.bookingRef],
    ['Service', data.serviceName],
    ['Suggested date', data.suggestedDate],
    ['Suggested time', data.suggestedTime],
    ['Customer response', data.response.toUpperCase()],
  ])
);

export const bookingRejectionTemplate = (data: AppointmentEmailData): string => layout(
  'Appointment update',
  `Hi ${escapeHtml(data.customerName)}, we are unable to accept this appointment request.`,
  details([['Booking reference', data.bookingRef], ['Service', data.serviceName], ['Requested date', data.date], ['Requested time', data.time], ['Reason', data.reason || 'Not specified']])
);

export const bookingCancellationTemplate = (data: AppointmentEmailData): string => layout(
  'Appointment cancelled',
  `Hi ${escapeHtml(data.customerName)}, this appointment has been cancelled.`,
  details([['Booking reference', data.bookingRef], ['Service', data.serviceName], ['Date', data.date], ['Time', data.time], ['Reason', data.reason || 'Cancelled']])
);

export const bookingRescheduleTemplate = (data: AppointmentEmailData): string => layout(
  'Appointment rescheduled',
  `Hi ${escapeHtml(data.customerName)}, your appointment has been moved to a new date and time. The updated request is PENDING acceptance.`,
  details([['Booking reference', data.bookingRef], ['Service', data.serviceName], ['Previous date', data.previousDate || '-'], ['Previous time', data.previousTime || '-'], ['Updated date', data.date], ['Updated time', data.time], ['Status', 'PENDING']])
);

export const appointmentReminderTemplate = (data: AppointmentEmailData & { reminderLabel: string }): string => layout(
  data.reminderLabel,
  `Hi ${escapeHtml(data.customerName)}, this is a reminder about your upcoming appointment.`,
  details([['Booking reference', data.bookingRef], ['Service', data.serviceName], ['Date', data.date], ['Time', data.time]])
);

export const newAppointmentAdminTemplate = (data: AppointmentEmailData & { customerEmail?: string; customerPhone?: string }): string => layout(
  'New appointment request',
  'A new appointment request was submitted and requires review.',
  details([
    ['Booking reference', data.bookingRef],
    ['Customer', data.customerName],
    ['Customer email', data.customerEmail || '-'],
    ['Customer phone', data.customerPhone || '-'],
    ['Service', data.serviceName],
    ['Barber', data.barberName || 'Lycan'],
    ['Date', data.date],
    ['Time', data.time],
  ])
);

export const verificationTemplate = (customerName: string, verifyUrl: string, otp?: string): string => layout(
  'Verify your email',
  `Hi ${escapeHtml(customerName)}, please verify your Iris Salon account.`,
  `<table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:6px;background:#18181b;"><a href="${escapeHtml(verifyUrl)}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">Verify email</a></td></tr></table>${otp ? `<p style="margin:18px 0 4px;font-size:13px;color:#71717a;">Your verification OTP:</p><div style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#18181b;">${escapeHtml(otp)}</div>` : ''}<p style="font-size:12px;color:#71717a;line-height:1.5;margin-top:16px;">The link and OTP expire in 24 hours.</p>`
);

export const verificationTextTemplate = (customerName: string, verifyUrl: string, otp: string): string =>
  `Hi ${customerName},\n\nVerify your Iris Salon account using this link:\n${verifyUrl}\n\nYour verification code is ${otp}. The link and code expire in 24 hours.`;

export const passwordResetTemplate = (resetUrl: string, customerName: string, otp?: string): string => layout(
  'Password reset request',
  `Hi ${escapeHtml(customerName)}, use the secure link below to reset your password.`,
  `<table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:6px;background:#18181b;"><a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">Reset password</a></td></tr></table>${otp ? `<p style="margin:18px 0 4px;font-size:13px;color:#71717a;">Your password reset OTP:</p><div style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#18181b;">${escapeHtml(otp)}</div>` : ''}<p style="font-size:12px;color:#71717a;line-height:1.5;margin-top:16px;">The link and OTP expire in 1 hour. If you did not request this, ignore this email.</p>`
);

export const jobApplicationReceiptTemplate = (data: { name: string; position: string; reference: string }): string => layout(
  'Application received',
  `Hi ${escapeHtml(data.name)}, thank you for applying to Iris Hair Cut &amp; Salon.`,
  details([['Position', data.position], ['Application reference', data.reference], ['Status', 'RECEIVED']])
);

export const newApplicationAdminTemplate = (data: { name: string; position: string; reference: string }): string => layout(
  'New job application',
  'A new recruitment application has been submitted.',
  details([['Applicant', data.name], ['Position', data.position], ['Application reference', data.reference]])
);

export const jobApplicationStatusTemplate = (data: { name: string; position: string; reference: string; status: string }): string => layout(
  'Application status update',
  `Hi ${escapeHtml(data.name)}, there is an update regarding your application.`,
  details([['Position', data.position], ['Application reference', data.reference], ['Status', data.status.toUpperCase()]])
);
