import { Router, Response } from 'express';
import Notification from '../models/Notification';
import { authenticate, isSuperAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';
import EmailDelivery from '../models/EmailDelivery';
import { retryEmailDelivery } from '../config/email';

const router = Router();

// @route   GET /api/notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter: any = { recipient: req.user!.id };
    if (unreadOnly === 'true') filter.isRead = false;
    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user!.id, isRead: false }),
    ]);
    res.json({ success: true, data: notifications, unreadCount, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user!.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) { res.status(404).json({ success: false, message: 'Notification not found.' }); return; }
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ recipient: req.user!.id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.get('/email-deliveries', authenticate, isSuperAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deliveries = await EmailDelivery.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load email deliveries.' });
  }
});

router.post('/email-deliveries/:id/retry', authenticate, isSuperAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const deliveryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await retryEmailDelivery(deliveryId);
  res.json({ success: result.success, data: { id: deliveryId, providerMessageId: result.providerMessageId }, message: result.success ? 'Email retry accepted.' : 'Email retry failed.', error: result.success ? undefined : result.error });
});

export default router;
