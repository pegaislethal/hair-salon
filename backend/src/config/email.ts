import nodemailer from 'nodemailer';

export const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[EMAIL] SMTP not configured — emails will be logged only');
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('[EMAIL DEV MODE] Would send to:', options.to, '| Subject:', options.subject);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error('[EMAIL] Send failed:', error);
    return false;
  }
};
