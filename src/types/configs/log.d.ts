
export type LogStatus = 'completed' | 'skipped' | 'missed';

export interface Log {
  id: string;
  timestamp: number;
  date: string;
  type: 'manual' | 'computed';
  completed: boolean;
  status?: LogStatus;
}