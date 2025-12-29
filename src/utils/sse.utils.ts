import { Response } from 'express';

/**
 * Initialize Server-Sent Events connection by setting appropriate headers
 * @param res - Express Response object
 */
export function initializeSSE(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

/**
 * Send a named SSE event
 * @param res - Express Response object
 * @param event - Event name/type
 * @param data - Event payload data
 */
export function sendSSEEvent(res: Response, event: string, data: unknown): void {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  res.write(`event: ${event}\n`);
  res.write(`data: ${payload}\n\n`);
}

/**
 * Send a data event (generic SSE data without event name)
 * @param res - Express Response object
 * @param data - Data payload
 */
export function sendSSEData(res: Response, data: unknown): void {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  res.write(`data: ${payload}\n\n`);
}

/**
 * Send a keepalive comment to prevent connection timeout
 * @param res - Express Response object
 * @param comment - Comment text
 */
export function sendSSEComment(res: Response, comment: string): void {
  res.write(`: ${comment}\n\n`);
}
