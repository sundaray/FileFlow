import { PassThrough } from 'node:stream';
import { EventEmitter } from 'node:events';

export interface ProgressEvent {
  bytesProcessed: number;
  timestamp: number;
}

/**
 * Progress Tracker Stream
 * A PassThrough stream that tracks bytes processed and emits progress events.
 */
export class ProgressTrackerStream extends PassThrough {
  private bytesProcessed = 0;
  private readonly progressEmitter: EventEmitter;

  constructor(progressEmitter: EventEmitter) {
    super();
    this.progressEmitter = progressEmitter;
    this.setupTracking();
  }

  private setupTracking(): void {
    this.on('data', (chunk: Buffer) => {
      this.bytesProcessed += chunk.length;
      this.emitProgress();
    });
  }

  private emitProgress(): void {
    const progressEvent: ProgressEvent = {
      bytesProcessed: this.bytesProcessed,
      timestamp: Date.now(),
    };
    this.progressEmitter.emit('progress', progressEvent);
  }

  getBytesProcessed(): number {
    return this.bytesProcessed;
  }
}
