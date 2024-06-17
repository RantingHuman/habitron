import { Habit, Log } from '../types/';
import {v4 as uuidv4} from 'uuid';
import { getToday, getCurrentTimestamp, getTimestampFromDate, getDateFromTimestamp } from './dateUtils';

export const createHabit = (name: string, description: string) => {
  const newHabit: Habit = {
    id: uuidv4(),
    name,
    description,
    frequency: [],
    streak: 0,
    startDate: getToday(),
    completionHistory: []
  };

  return newHabit;
}

export const createLog = (date?: string, type: 'manual' | 'computed' = 'manual', completed: boolean = false) => {
  const newLog: Log = {
    id: uuidv4(),
    timestamp: date ? getTimestampFromDate(date) : getCurrentTimestamp(),
    type,
    completed
  };

  return newLog;
}