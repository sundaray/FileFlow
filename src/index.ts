import { createServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import app from './app.js';
import { config } from './config/index.js';
import { jobStore } from './jobs/job.store.js';

/**
 * Server Entry Point
 *
 * Responsibilities:
 * - Create required directories (uploads, outputs)
 * - Start HTTP server
 * - Display startup banner with configuration
 * - Handle graceful shutdown on SIGTERM/SIGINT
 * - Clean up resources (jobStore) on exit
 */

/**
 * Initialize required directories
 */
async function initializeDirectories(): Promise<void> {
  try {
    await mkdir(config.uploadsDir, { recursive: true });
    await mkdir(config.outputsDir, { recursive: true });
    console.log('Directories initialized:');
    console.log(`  - Uploads: ${config.uploadsDir}`);
    console.log(`  - Outputs: ${config.outputsDir}`);
  } catch (error) {
    console.error('Failed to create directories:', error);
    process.exit(1);
  }
}

/**
 * Display fancy startup banner with server information
 */
function displayBanner(): void {
  const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗██╗██╗     ███████╗███████╗██╗      ██████╗ ██╗    ║
║   ██╔════╝██║██║     ██╔════╝██╔════╝██║     ██╔═══██╗██║    ║
║   █████╗  ██║██║     █████╗  █████╗  ██║     ██║   ██║██║    ║
║   ██╔══╝  ██║██║     ██╔══╝  ██╔══╝  ██║     ██║   ██║██║    ║
║   ██║     ██║███████╗███████╗██║     ███████╗╚██████╔╝███████╗║
║   ╚═╝     ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝ ╚═════╝ ╚══════╝║
║                                                               ║
║              CSV Stream Processing Pipeline                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Server started successfully!

Port:           ${config.port}
CORS Origin:    ${config.corsOrigin}
Max File Size:  ${Math.round(config.maxFileSizeBytes / 1024 / 1024 / 1024)} GB
Job Retention:  ${config.jobRetentionMs / 1000 / 60} minutes

Available Endpoints:
  POST   /api/upload              - Upload CSV file for processing
  GET    /api/progress/:jobId     - Stream job progress (SSE)
  GET    /api/download/:jobId     - Download processed file
  GET    /api/jobs                - List all jobs
  GET    /api/jobs/:jobId         - Get job details
  DELETE /api/jobs/:jobId         - Delete job and files
  POST   /api/jobs/:jobId/cancel  - Cancel running job
  GET    /api/stages              - List available pipeline stages
  GET    /api/health              - Health check

Ready to process files!
`;

  console.log(banner);
}

/**
 * Graceful shutdown handler
 * Cleans up resources and closes the server
 */
function setupGracefulShutdown(server: ReturnType<typeof createServer>): void {
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
      console.log('HTTP server closed');
    });

    // Shutdown job store (cleans up jobs, closes streams, stops cleanup interval)
    console.log('Shutting down job store...');
    jobStore.shutdown();
    console.log('Job store shutdown complete');

    console.log('Graceful shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Start the server
 */
async function start(): Promise<void> {
  try {
    // Initialize directories
    await initializeDirectories();

    // Create HTTP server
    const server = createServer(app);

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    // Start listening
    server.listen(config.port, () => {
      displayBanner();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
start();
