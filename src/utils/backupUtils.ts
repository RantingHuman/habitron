import { Habit, HabitSchedule, Log, Weekday } from '../types/';
import { WEEKDAY_FREQUENCIES } from './constants';

const BACKUP_VERSION = 1;

export interface HabitronBackup {
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  habits: Habit[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isLog = (value: unknown): value is Log => {
  if (!isRecord(value)) return false;

  return typeof value.id === 'string'
    && typeof value.timestamp === 'number'
    && typeof value.date === 'string'
    && (value.type === 'manual' || value.type === 'computed')
    && typeof value.completed === 'boolean';
};

const isWeekday = (value: string): value is Weekday =>
  WEEKDAY_FREQUENCIES.some(({ value: weekday }) => weekday === value);

const isSchedule = (value: unknown): value is HabitSchedule => {
  if (!isRecord(value) || typeof value.type !== 'string') return false;
  if (value.type === 'daily') return true;
  if (value.type === 'weekdays') {
    return Array.isArray(value.days)
      && value.days.length > 0
      && value.days.every((day) => typeof day === 'string' && isWeekday(day));
  }
  return value.type === 'interval'
    && typeof value.intervalDays === 'number'
    && Number.isInteger(value.intervalDays)
    && value.intervalDays >= 2;
};

const isHabit = (value: unknown): value is Habit => {
  if (!isRecord(value)) return false;

  return typeof value.id === 'string'
    && typeof value.name === 'string'
    && (value.description === undefined || typeof value.description === 'string')
    && Array.isArray(value.frequency)
    && value.frequency.every((item) => typeof item === 'string')
    && (value.schedule === undefined || isSchedule(value.schedule))
    && typeof value.streak === 'number'
    && typeof value.startDate === 'string'
    && Array.isArray(value.completionHistory)
    && value.completionHistory.every(isLog);
};

export const serializeBackup = (habits: Habit[]) => {
  const backup: HabitronBackup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    habits
  };

  return JSON.stringify(backup, null, 2);
};

export const parseBackup = (content: string): Habit[] => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('The backup file is not valid JSON.');
  }

  if (!isRecord(parsed)
    || parsed.version !== BACKUP_VERSION
    || typeof parsed.exportedAt !== 'string'
    || !Array.isArray(parsed.habits)
    || !parsed.habits.every(isHabit)) {
    throw new Error('The backup file is not a valid Habitron backup.');
  }

  return parsed.habits;
};