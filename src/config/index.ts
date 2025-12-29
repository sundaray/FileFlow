import { join } from 'node:path';

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  uploadsDir: join(process.cwd(), 'uploads'),
  outputsDir: join(process.cwd(), 'outputs'),
  maxFileSizeBytes: 10 * 1024 * 1024 * 1024, // 10 GB
  jobRetentionMs: 60 * 60 * 1000, // 1 hour
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
} as const;
