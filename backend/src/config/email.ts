import { Resend } from 'resend';
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
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Resend delivery failed';
};

export const sendEmail = async (options: SendEmailOptions): Promise<SendEmailResult> => {
  const originalRecipient = options.to.trim();
  const testRecipient = (process.env.EMAIL_TEST_RECIPIENT || process.env.ADMIN_EMAIL || '').trim();
  const testMode = (process.env.RESEND_TEST_MODE || 'true').trim().toLowerCase() !== 'false';
  const recipient = testMode && testRecipient ? testRecipient : originalRecipient;
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey) {
    return recordFailure(options, 'RESEND_API_KEY is not configured.', recipient);
  }
  if (!from) {
    return recordFailure(options, 'EMAIL_FROM must be configured with a sender on a verified Resend domain.', recipient);
  }
  if (!recipient) {
    return recordFailure(options, 'No verified email recipient is configured.', recipient);
  }
  if (from.toLowerCase().includes('onboarding@resend.dev')) {
    console.warn('[EMAIL] Resend onboarding sender is configured; delivery is limited to eligible test recipients.');
  }

  if (options.deduplicationKey) {
    try {
      const existing = await EmailDelivery.findOne({ deduplicationKey: options.deduplicationKey });
      if (existing?.status === 'sent') {
        console.info('[EMAIL] Skipped duplicate email already sent', {
          providerMessageId: existing.providerMessageId,
          type: options.type || 'general',
        });
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
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: [recipient],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      const message = safeErrorMessage(result.error);
      if (delivery) {
        delivery.status = 'failed';
        delivery.error = message;
        try {
          await delivery.save();
        } catch (saveError) {
          console.error('[EMAIL] Failed to save email delivery status', { error: safeErrorMessage(saveError) });
        }
      }
      console.error('[EMAIL] Resend delivery failed', { subject: options.subject, type: options.type || 'general', error: message });
      return { success: false, deliveryId: delivery?._id.toString(), error: message };
    }

    const providerMessageId = result.data?.id;
    if (!providerMessageId) {
      const message = 'Resend did not return a message ID.';
      if (delivery) {
        delivery.status = 'failed';
        delivery.error = message;
        try {
          await delivery.save();
        } catch (saveError) {
          console.error('[EMAIL] Failed to save email delivery status', { error: safeErrorMessage(saveError) });
        }
      }
      console.error('[EMAIL] Resend delivery failed', { subject: options.subject, type: options.type || 'general', error: message });
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
    console.info('[EMAIL] Resend accepted message', {
      providerMessageId,
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
    console.error('[EMAIL] Resend delivery failed', { subject: options.subject, type: options.type || 'general', error: message });
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
