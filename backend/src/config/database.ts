import dotenv from 'dotenv';
import dns from 'node:dns';
import mongoose from 'mongoose';
import { logSafeError } from '../utils/logSafeError';

dotenv.config();

const configuredDnsServers = process.env.MONGODB_DNS_SERVERS
  ?.split(',')
  .map((server) => server.trim())
  .filter(Boolean);

if (configuredDnsServers?.length) {
  dns.setServers(configuredDnsServers);
}

let connectionPromise: Promise<void> | null = null;
let retryAfter = 0;
let missingUriReported = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;
  if (connectionPromise) return connectionPromise;
  if (Date.now() < retryAfter) {
    throw new Error('MongoDB connection retry is pending.');
  }

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    const error = new Error('MONGODB_URI is not configured.');
    if (!missingUriReported) {
      logSafeError('DB MongoDB connection failed', error);
      missingUriReported = true;
    }
    throw error;
  }

  connectionPromise = mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      retryAfter = 0;
      console.log('[DB] MongoDB connected.');
    })
    .catch((error: unknown) => {
      logSafeError('DB MongoDB connection failed', error);
      retryAfter = Date.now() + 5000;
      if (!retryTimer) {
        retryTimer = setTimeout(() => {
          retryTimer = null;
          retryAfter = 0;
          void connectDB().catch(() => {
            console.error('[DB] Background retry failed; database-backed requests will retry on demand.');
          });
        }, 5000);
        retryTimer.unref();
      }
      throw error;
    })
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
};

mongoose.connection.on('error', (err) => {
  logSafeError('DB MongoDB error', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected.');
});

export default connectDB;
