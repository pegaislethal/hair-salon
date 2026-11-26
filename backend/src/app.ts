import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import connectDB from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import appointmentRoutes from './routes/appointments';
import serviceRoutes from './routes/services';
import staffRoutes from './routes/staff';
import customerRoutes from './routes/customers';
import settingsRoutes from './routes/settings';
import notificationRoutes from './routes/notifications';
import galleryRoutes from './routes/gallery';
import reportRoutes from './routes/reports';
import publicRoutes from './routes/public';
import recruitmentRoutes from './routes/recruitment';

// Connect database
connectDB();

const app = express();
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
const normalizeOrigin = (value: string): string => {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : '';
  } catch {
    return '';
  }
};

const allowedOrigins = Array.from(new Set([
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
]
  .flatMap((origins) => origins?.split(',') ?? [])
  .map(normalizeOrigin)
  .filter(Boolean)
  .concat([
    'https://hair-salon-gray-mu.vercel.app',
    'https://hair-salon-chohatmap-pegas-projects-be8fc807.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ])));

app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
    next();
    return;
  }
  res.vary('Origin').status(403).json({ success: false, message: 'Origin not allowed by CORS.' });
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, message: 'Too many requests, please try again later.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' } });
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Liveness endpoints
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Salon backend is running',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, status: 'healthy' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/recruitment', recruitmentRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🌸 Iris Salon API listening at http://localhost:${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
  });
}

export default app;
