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

let connectionAttemptInProgress = false;

const connectDB = async (): Promise<void> => {
  if (connectionAttemptInProgress || mongoose.connection.readyState === 1) return;
  connectionAttemptInProgress = true;

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not configured.');

    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database connection error.';
    console.error(`[DB] MongoDB connection failed: ${message}`);
    console.error('[DB] Retrying in 5 seconds.');
    const retry = setTimeout(() => {
      void connectDB();
    }, 5000);
    retry.unref();
  } finally {
    connectionAttemptInProgress = false;
  }
};

mongoose.connection.on('error', (err) => {
  console.error(`[DB] MongoDB error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected.');
});

export default connectDB;
