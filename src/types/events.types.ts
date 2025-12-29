export type JobStatus = 
  | 'pending'      // Job created, not started
  | 'processing'   // Pipeline is running
  | 'completed'    // Successfully finished
  | 'failed'       // Error occurred
  | 'cancelled';   // User cancelled

export interface ProgressEvent {
  jobId: string;
  status: JobStatus;
  currentStage: string | null;
  stageIndex: number;
  totalStages: number;
  bytesRead: number;
  bytesWritten: number;
  rowsProcessed: number;
  rowsFiltered: number;    // Rows removed by filter stages
  startedAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
  completedAt: string | null;
  error: string | null;
  memoryUsageMb: number;   // Current memory usage
}
