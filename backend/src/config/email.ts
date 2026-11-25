import nodemailer, { type Transporter } from 'nodemailer';
import EmailDelivery from '../models/EmailDelivery';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  deduplicationKey?: string;
  type?: string;
}

export interface SendEmailResult {
  success: boolean;
  deliveryId?: string;
  providerMessageId?: string;
  error?: string;
  skippedDuplicate?: boolean;
}

const safeErrorMessage = (error: unknown): string => {
  const rawMessage = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : 'Gmail SMTP delivery failed';
  const credentials = [
    process.env.EMAIL_USER?.trim(),
    process.env.EMAIL_APP_PASSWORD?.replace(/\s/g, ''),
  ].filter((value): value is string => Boolean(value));
  const redactedMessage = credentials.reduce(
    (message, credential) => message.split(credential).join('[redacted]'),
    rawMessage
  );
  return redactedMessage
    .replace(/(password|pass|auth(?:entication)?)\s*[:=]\s*[^,\s]+/gi, '$1=[redacted]')
    .slice(0, 500);
};

let smtpTransporter: Transporter | undefined;

const getSmtpTransporter = (user: string, appPassword: string): Transporter => {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass: appPassword },
    });
  }
  return smtpTransporter;
};

const htmlToText = (html: string): string => html
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<\/td\s*>/gi, '\t')
  .replace(/<\/(p|div|tr|h[1-6])\s*>/gi, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#0?39;/gi, "'")
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export const sendEmail = async (options: SendEmailOptions): Promise<SendEmailResult> => {
  const originalRecipient = options.to.trim();
  const recipient = originalRecipient;
  const user = process.env.EMAIL_USER?.trim();
  const appPassword = process.env.EMAIL_APP_PASSWORD?.replace(/\s/g, '');
  const from = process.env.EMAIL_FROM?.trim();

  if (!user) {
    return recordFailure(options, 'EMAIL_USER is not configured.', recipient);
  }
  if (!appPassword || appPassword.length !== 16) {
    return recordFailure(options, 'EMAIL_APP_PASSWORD must be a 16-character Gmail app password.', recipient);
  }
  if (!from) {
    return recordFailure(options, 'EMAIL_FROM is not configured.', recipient);
  }
  if (!recipient) {
    return recordFailure(options, 'No email recipient is configured.', recipient);
  }

  if (options.deduplicationKey) {
    try {
      const existing = await EmailDelivery.findOne({ deduplicationKey: options.deduplicationKey });
      if (existing?.status === 'sent') {
        console.info('[EMAIL] Skipped duplicate email already sent', { messageId: existing.providerMessageId });
        return { success: true, deliveryId: existing._id.toString(), providerMessageId: existing.providerMessageId, skippedDuplicate: true };
      }
    } catch (error) {
      console.error('[EMAIL] Delivery deduplication check failed', { error: safeErrorMessage(error) });
    }
  }

  let delivery: (typeof EmailDelivery.prototype & { _id: { toString(): string }; status: string; providerMessageId?: string; error?: string; save(): Promise<unknown> }) | null = null;
  try {
    delivery = options.deduplicationKey
      ? await EmailDelivery.findOneAndUpdate(
          { deduplicationKey: options.deduplicationKey },
          {
            $set: { recipient, subject: options.subject, type: options.type || 'general', status: 'pending', lastAttemptAt: new Date(), html: options.html, text: options.text },
            $inc: { attempts: 1 },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        )
      : await EmailDelivery.create({ recipient, subject: options.subject, type: options.type || 'general', status: 'pending', attempts: 1, lastAttemptAt: new Date(), html: options.html, text: options.text });
  } catch (error) {
    console.error('[EMAIL] Delivery record could not be created', { error: safeErrorMessage(error) });
  }

  try {
    const result = await getSmtpTransporter(user, appPassword).sendMail({
      from,
      to: recipient,
      subject: options.subject,
      html: options.html,
      text: options.text || htmlToText(options.html),
    });

    if (result.rejected.length > 0 || result.accepted.length === 0) {
      const message = 'Gmail SMTP did not accept the message recipient.';
      if (delivery) {
        delivery.status = 'failed';
        delivery.error = message;
        try {
          await delivery.save();
        } catch (saveError) {
          console.error('[EMAIL] Failed to save email delivery status', { error: safeErrorMessage(saveError) });
        }
      }
      console.error('[EMAIL] Gmail SMTP delivery failed', {
        subject: options.subject,
        type: options.type || 'general',
        responseCode: result.responseCode,
        error: message,
      });
      return { success: false, deliveryId: delivery?._id.toString(), error: message };
    }

    const providerMessageId = result.messageId;
    if (!providerMessageId) {
      const message = 'Gmail SMTP did not return a message ID.';
      if (delivery) {
        delivery.status = 'failed';
        delivery.error = message;
        try {
          await delivery.save();
        } catch (saveError) {
          console.error('[EMAIL] Failed to save email delivery status', { error: safeErrorMessage(saveError) });
        }
      }
      console.error('[EMAIL] Gmail SMTP delivery failed', { subject: options.subject, type: options.type || 'general', error: message });
      return { success: false, deliveryId: delivery?._id.toString(), error: message };
    }

    if (delivery) {
      delivery.status = 'sent';
      delivery.providerMessageId = providerMessageId;
      delivery.error = undefined;
      try {
        await delivery.save();
      } catch (saveError) {
        console.error('[EMAIL] Failed to save email delivery status', { error: safeErrorMessage(saveError) });
      }
    }
    console.info('[EMAIL] Gmail SMTP accepted message', {
      messageId: providerMessageId,
      type: options.type || 'general',
      deliveryId: delivery?._id.toString(),
    });
    return { success: true, deliveryId: delivery?._id.toString(), providerMessageId };
  } catch (error) {
    const message = safeErrorMessage(error);
    if (delivery) {
      delivery.status = 'failed';
      delivery.error = message;
      try {
        await delivery.save();
      } catch (saveError) {
        console.error('[EMAIL] Failed to save email delivery status', { error: safeErrorMessage(saveError) });
      }
    }
    console.error('[EMAIL] Gmail SMTP delivery failed', { subject: options.subject, type: options.type || 'general', error: message });
    return { success: false, deliveryId: delivery?._id.toString(), error: message };
  }
};

const recordFailure = async (options: SendEmailOptions, message: string, recipient: string): Promise<SendEmailResult> => {
  let deliveryId: string | undefined;
  try {
    const delivery = await EmailDelivery.create({
      deduplicationKey: options.deduplicationKey,
      recipient,
      subject: options.subject,
      type: options.type || 'general',
      status: 'failed',
      attempts: 1,
      lastAttemptAt: new Date(),
      error: message,
    });
    deliveryId = delivery._id.toString();
  } catch (error) {
    console.error('[EMAIL] Delivery failure record could not be created', { error: safeErrorMessage(error) });
  }
  console.error('[EMAIL] Delivery not attempted', { subject: options.subject, type: options.type || 'general', error: message });
  return { success: false, deliveryId, error: message };
};

export const retryEmailDelivery = async (deliveryId: string): Promise<SendEmailResult> => {
  const delivery = await EmailDelivery.findById(deliveryId);
  if (!delivery) return { success: false, error: 'Email delivery record not found.' };
  if (!delivery.subject) return { success: false, error: 'Email delivery cannot be retried.' };
  const result = await sendEmail({
    to: delivery.recipient,
    subject: delivery.subject,
    html: delivery.html || '<p>Iris Hair Cut and Salon notification.</p>',
    text: delivery.text,
    deduplicationKey: delivery.deduplicationKey,
    type: delivery.type,
  });
  return result;
};
