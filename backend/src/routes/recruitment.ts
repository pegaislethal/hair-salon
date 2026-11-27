import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { body, validationResult } from 'express-validator';
import HiringSettings from '../models/HiringSettings';
import JobVacancy from '../models/JobVacancy';
import JobApplication from '../models/JobApplication';
import User from '../models/User';
import Notification from '../models/Notification';
import { authenticate, isAdminOrSubAdmin, isSuperAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';
import { uploadDocumentToCloudinary } from '../config/cloudinary';
import { sendEmail } from '../config/email';
import { jobApplicationReceiptTemplate, newApplicationAdminTemplate, jobApplicationStatusTemplate } from '../utils/emailTemplates';
import { logSafeError } from '../utils/logSafeError';

const router = Router();
const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const accepted = ['.pdf', '.doc', '.docx'].includes(extension)
      && ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype);
    if (!accepted) {
      callback(new Error('Upload a PDF, DOC, or DOCX CV.'));
      return;
    }
    callback(null, true);
  },
});

const getSettings = async () => (await HiringSettings.findOne()) || { isHiring: false };

router.get('/public', async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getSettings();
    const vacancies = settings.isHiring
      ? await JobVacancy.find({ isActive: true, $or: [{ applicationDeadline: null }, { applicationDeadline: { $gte: new Date() } }] })
        .select('_id title description requirements experience applicationDeadline isActive createdAt')
        .sort({ createdAt: -1 })
        .lean()
      : [];
    res.set('Cache-Control', 'public, max-age=0, s-maxage=15, stale-while-revalidate=60');
    res.json({ success: true, data: { isHiring: settings.isHiring, vacancies } });
  } catch (error) {
    logSafeError('RECRUITMENT Failed to load public vacancies', error);
    res.status(500).json({ success: false, message: 'Unable to load current vacancies.' });
  }
});

router.post('/apply', cvUpload.single('cv'), [
  body('vacancyId').isMongoId(),
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('email').isEmail(),
  body('phone').trim().notEmpty().isLength({ max: 30 }),
  body('experience').trim().notEmpty().isLength({ max: 2000 }),
  body('skills').optional().isString(),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  if (!req.file) { res.status(400).json({ success: false, message: 'Please attach your CV.' }); return; }
  try {
    const settings = await getSettings();
    if (!settings.isHiring) { res.status(403).json({ success: false, message: 'Applications are currently closed.' }); return; }
    const vacancy = await JobVacancy.findOne({
      _id: req.body.vacancyId,
      isActive: true,
      $or: [{ applicationDeadline: null }, { applicationDeadline: { $gte: new Date() } }],
    });
    if (!vacancy) { res.status(404).json({ success: false, message: 'This vacancy is no longer accepting applications.' }); return; }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      res.status(503).json({ success: false, message: 'CV uploads are not configured. Please contact the salon.' }); return;
    }
    const uploaded = await uploadDocumentToCloudinary(req.file.buffer, req.file.originalname);
    const skills = typeof req.body.skills === 'string'
      ? req.body.skills.split(',').map((skill: string) => skill.trim()).filter(Boolean)
      : [];
    const application = await JobApplication.create({
      vacancy: vacancy._id,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      experience: req.body.experience,
      skills,
      cvUrl: uploaded.url,
    });
    const applicationReference = `IRIS-JOB-${application._id.toString().slice(-8).toUpperCase()}`;
    await sendEmail({
      to: application.email,
      subject: `Application Received — ${vacancy.title}`,
      html: jobApplicationReceiptTemplate({ name: application.name, position: vacancy.title, reference: applicationReference }),
      deduplicationKey: `job_application:${application._id.toString()}:received`,
      type: 'job_application_received',
    });
    const admins = await User.find({ role: { $in: ['super_admin', 'sub_admin'] }, isActive: true });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        type: 'new_job_application',
        title: 'New Job Application',
        message: `${application.name} applied for ${vacancy.title}.`,
      });
      if (admin.role === 'super_admin') {
        await sendEmail({
          to: admin.email,
          subject: `New Job Application — ${vacancy.title}`,
          html: newApplicationAdminTemplate({ name: application.name, position: vacancy.title, reference: applicationReference }),
          deduplicationKey: `job_application:${application._id.toString()}:admin_new`,
          type: 'job_application_admin_new',
        });
      }
    }
    res.status(201).json({ success: true, message: 'Your application has been submitted.', data: { id: application._id } });
  } catch (error) {
    logSafeError('RECRUITMENT Failed to submit application', error);
    res.status(500).json({ success: false, message: 'Unable to submit your application.' });
  }
});

router.get('/admin/settings', authenticate, isAdminOrSubAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({ success: true, data: await getSettings() });
  } catch (error) {
    logSafeError('RECRUITMENT Failed to load hiring settings', error);
    res.status(500).json({ success: false, message: 'Unable to load hiring settings.' });
  }
});

router.put('/admin/settings', authenticate, isSuperAdmin, body('isHiring').isBoolean(), async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  try {
    const settings = await HiringSettings.findOneAndUpdate({}, { isHiring: req.body.isHiring }, { new: true, upsert: true, runValidators: true });
    res.json({ success: true, data: settings });
  } catch (error) {
    logSafeError('RECRUITMENT Failed to update hiring settings', error);
    res.status(500).json({ success: false, message: 'Unable to update hiring settings.' });
  }
});

router.get('/admin/vacancies', authenticate, isAdminOrSubAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vacancies = await JobVacancy.find().sort({ createdAt: -1 });
    res.json({ success: true, data: vacancies });
  } catch (error) {
    logSafeError('RECRUITMENT Failed to load vacancies', error);
    res.status(500).json({ success: false, message: 'Unable to load vacancies.' });
  }
});

router.post('/admin/vacancies', authenticate, isSuperAdmin, [
  body('title').trim().notEmpty().isLength({ max: 120 }),
  body('description').trim().notEmpty().isLength({ max: 5000 }),
  body('experience').trim().notEmpty().isLength({ max: 300 }),
  body('requirements').optional().isArray(),
  body('applicationDeadline').optional({ values: 'falsy' }).isISO8601(),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  try {
    const vacancy = await JobVacancy.create({
      title: req.body.title,
      description: req.body.description,
      experience: req.body.experience,
      requirements: req.body.requirements || [],
      applicationDeadline: req.body.applicationDeadline || undefined,
    });
    res.status(201).json({ success: true, data: vacancy });
  } catch (error) {
    logSafeError('RECRUITMENT Failed to create vacancy', error);
    res.status(500).json({ success: false, message: 'Unable to create vacancy.' });
  }
});

router.put('/admin/vacancies/:id', authenticate, isSuperAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fields = ['title', 'description', 'requirements', 'experience', 'applicationDeadline', 'isActive'];
    const update: Record<string, unknown> = {};
    for (const field of fields) if (req.body[field] !== undefined) update[field] = req.body[field];
    const vacancy = await JobVacancy.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!vacancy) { res.status(404).json({ success: false, message: 'Vacancy not found.' }); return; }
    res.json({ success: true, data: vacancy });
  } catch (error) {
    logSafeError('RECRUITMENT Failed to update vacancy', error);
    res.status(500).json({ success: false, message: 'Unable to update vacancy.' });
  }
});

router.patch('/admin/vacancies/:id/deactivate', authenticate, isSuperAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vacancy = await JobVacancy.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!vacancy) { res.status(404).json({ success: false, message: 'Vacancy not found.' }); return; }
    res.json({ success: true, data: vacancy });
  } catch (error) {
    logSafeError('RECRUITMENT Failed to deactivate vacancy', error);
    res.status(500).json({ success: false, message: 'Unable to deactivate vacancy.' });
  }
});

router.get('/admin/applications', authenticate, isAdminOrSubAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applications = await JobApplication.find().sort({ createdAt: -1 }).populate('vacancy', 'title').populate('reviewedBy', 'fullName');
    res.json({ success: true, data: applications });
  } catch (error) {
    logSafeError('RECRUITMENT Failed to load applications', error);
    res.status(500).json({ success: false, message: 'Unable to load applications.' });
  }
});

router.patch('/admin/applications/:id/decision', authenticate, isSuperAdmin, body('status').isIn(['shortlisted', 'accepted', 'rejected']), async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  try {
    const application = await JobApplication.findByIdAndUpdate(req.params.id, {
      status: req.body.status,
      reviewedBy: req.user!.id,
      reviewedAt: new Date(),
    }, { new: true }).populate('vacancy', 'title');
    if (!application) { res.status(404).json({ success: false, message: 'Application not found.' }); return; }
    const applicationReference = `IRIS-JOB-${application._id.toString().slice(-8).toUpperCase()}`;
    await sendEmail({
      to: application.email,
      subject: `Application Update — ${(application.vacancy as unknown as { title: string }).title}`,
      html: jobApplicationStatusTemplate({ name: application.name, position: (application.vacancy as unknown as { title: string }).title, reference: applicationReference, status: application.status }),
      deduplicationKey: `job_application:${application._id.toString()}:status:${application.status}`,
      type: 'job_application_status',
    });
    res.json({ success: true, data: application });
  } catch (error) {
    logSafeError('RECRUITMENT Failed to update application decision', error);
    res.status(500).json({ success: false, message: 'Unable to update application.' });
  }
});

export default router;
