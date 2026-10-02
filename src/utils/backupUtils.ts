import { Habit, HabitSchedule, LegacyHabit, Log, Weekday } from '../types/';
import { WEEKDAY_FREQUENCIES } from './constants';
import { migrateLegacyHabit } from './habitUtils';

const BACKUP_VERSION = 2;
const LEGACY_BACKUP_VERSION = 1;

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
    && typeof value.completed === 'boolean'
    && (value.status === undefined
      || value.status === 'completed'
      || value.status === 'skipped'
      || value.status === 'missed');
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

const isReminder = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return value.enabled === true
    && typeof value.time === 'string'
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time);
};

const hasValidHabitFields = (value: Record<string, unknown>) =>
  typeof value.id === 'string'
    && typeof value.name === 'string'
    && (value.description === undefined || typeof value.description === 'string')
    && (value.status === undefined || value.status === 'active' || value.status === 'paused')
    && (value.reminder === undefined || isReminder(value.reminder))
    && typeof value.startDate === 'string'
    && Array.isArray(value.completionHistory)
    && value.completionHistory.every(isLog);

const isHabit = (value: unknown): value is Habit =>
  isRecord(value)
    && hasValidHabitFields(value)
    && isSchedule(value.schedule);

const isLegacyHabit = (value: unknown): value is LegacyHabit =>
  isRecord(value)
    && hasValidHabitFields(value)
    && Array.isArray(value.frequency)
    && value.frequency.every((item) => typeof item === 'string')
    && (value.schedule === undefined || isSchedule(value.schedule))
    && typeof value.streak === 'number';

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
    || typeof parsed.exportedAt !== 'string'
    || !Array.isArray(parsed.habits)) {
    throw new Error('The backup file is not a valid Habitron backup.');
  }

  const { habits } = parsed;
  if (parsed.version === BACKUP_VERSION && habits.every(isHabit)) {
    return habits;
  }
  if (parsed.version === LEGACY_BACKUP_VERSION && habits.every(isLegacyHabit)) {
    return habits.map(migrateLegacyHabit);
  }

  throw new Error('The backup file is not a valid Habitron backup.');
};
