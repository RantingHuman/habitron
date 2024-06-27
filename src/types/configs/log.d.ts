
export interface Log {
  id: string;
  timestamp: number;
  date: string;
  type: 'manual' | 'computed';
  completed: boolean;
}