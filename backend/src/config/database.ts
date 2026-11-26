import dotenv from 'dotenv';
import dns from 'node:dns';
import mongoose from 'mongoose';

dotenv.config();

const configuredDnsServers = process.env.MONGODB_DNS_SERVERS
  ?.split(',')
  .map((server) => server.trim())
  .filter(Boolean);

if (configuredDnsServers?.length) {
  dns.setServers(configuredDnsServers);
}

let connectionPromise: Promise<void> | null = null;

const sanitizeDatabaseError = (message: string): string => message
  .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[redacted MongoDB URI]')
  .replace(/\b(password|secret|token)(\s*[:=]\s*)[^\s,;]+/gi, '$1$2[redacted]');

const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    const error = new Error('MONGODB_URI is not configured.');
    console.error('[DB] MongoDB connection failed: MONGODB_URI is not configured.');
    throw error;
  }

  connectionPromise = mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
    .then((conn) => {
      console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown database connection error.';
      console.error('[DB] MongoDB connection failed:', sanitizeDatabaseError(message));
      console.error('[DB] Retrying MongoDB connection in 5 seconds.');
      const retry = setTimeout(() => {
        void connectDB().catch(() => {
          console.error('[DB] Background retry failed; database-backed requests will retry on demand.');
        });
      }, 5000);
      retry.unref();
      throw error;
    })
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
};

mongoose.connection.on('error', (err) => {
  console.error('[DB] MongoDB error:', sanitizeDatabaseError(err.message));
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected.');
});

export default connectDB;
