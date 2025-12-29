import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestLogger } from './middleware/request-logger.middleware.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import apiRoutes from './routes/index.js';

/**
 * Express Application Configuration
 *
 * Sets up the Express app with:
 * - CORS middleware with specific headers for file uploads
 * - Request logging
 * - API routes mounted at /api
 * - Global error handler
 *
 * IMPORTANT: Does NOT use express.json() or express.raw() globally
 * because the upload route needs raw streaming access to the request body.
 */

const app: Express = express();

/**
 * CORS Configuration
 * Allows specific methods and headers required for file uploads
 * and pipeline configuration
 */
app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-filename', 'x-pipeline-config'],
    credentials: true,
  })
);

/**
 * Request Logger Middleware
 * Logs all incoming requests with timestamp, method, URL, status, and duration
 */
app.use(requestLogger);

/**
 * API Routes
 * All routes are mounted under /api prefix
 * Available endpoints:
 * - GET /api/health - Health check
 * - POST /api/upload - File upload
 * - GET /api/progress/:jobId - Job progress (SSE)
 * - GET /api/download/:jobId - File download
 * - GET /api/jobs - List all jobs
 * - GET /api/jobs/:jobId - Get job details
 * - DELETE /api/jobs/:jobId - Delete job
 * - POST /api/jobs/:jobId/cancel - Cancel job
 * - GET /api/stages - List available stages
 */
app.use('/api', apiRoutes);

/**
 * Global Error Handler
 * MUST be registered last after all other middleware and routes
 * Catches and formats all errors from the application
 */
app.use(errorHandler);

export default app;
