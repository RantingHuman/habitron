import { Habit } from "./habit";

export interface Log {
  id?: number;
  logDate: string;
  logTimestamp: number;
  type: 'manual' | 'computed';
  completed: boolean;
  habit: Habit;
}