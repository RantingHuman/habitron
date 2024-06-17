
export interface Log {
  id: string;
  timestamp: number;
  type: 'manual' | 'computed';
  completed: boolean;
}