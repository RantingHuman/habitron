import { CheckIn, Habit, HabitPause, HabitRules, HabitSchedule, Weekday } from '../types/';
import { WEEKDAY_FREQUENCIES } from './constants';

const BACKUP_VERSION = 4;

export interface HabitronBackup {
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  habits: Habit[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isWeekday = (value: string): value is Weekday =>
  WEEKDAY_FREQUENCIES.some(({ value: weekday }) => weekday === value);

const isDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isAscending = (dates: string[]) => dates.every((date, index) => index === 0 || dates[index - 1] < date);

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

const isRules = (value: unknown): value is HabitRules =>
  isRecord(value) && isDate(value.effectiveFrom) && isSchedule(value.schedule);

const isPause = (value: unknown): value is HabitPause =>
  isRecord(value)
    && isDate(value.start)
    && (value.end === undefined || (isDate(value.end) && value.end > value.start));

const isCheckIn = (value: unknown): value is CheckIn =>
  isRecord(value) && isDate(value.date) && (value.status === 'done' || value.status === 'skipped');

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
    && (value.reminder === undefined || isReminder(value.reminder))
    && typeof value.startDate === 'string';

const isHabit = (value: unknown): value is Habit =>
  isRecord(value)
    && hasValidHabitFields(value)
    && Array.isArray(value.rules)
    && value.rules.length > 0
    && value.rules.every(isRules)
    && isAscending(value.rules.map(({ effectiveFrom }) => effectiveFrom))
    && Array.isArray(value.pauses)
    && value.pauses.every(isPause)
    && (value.archivedOn === undefined || isDate(value.archivedOn))
    && Array.isArray(value.checkIns)
    && value.checkIns.every(isCheckIn)
    && new Set(value.checkIns.map(({ date }) => date)).size === value.checkIns.length;

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

  throw new Error('The backup file is not a valid Habitron backup.');
};
