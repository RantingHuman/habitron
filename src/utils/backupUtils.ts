import { CheckIn, Habit, HabitPause, HabitRules, HabitSchedule, HabitTarget, Weekday } from '../types/';
import { WEEKDAY_FREQUENCIES } from './constants';
import { MigrationChain, savedDataMigrations } from './migrationUtils';

export interface HabitronBackup {
  version: number;
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

const isAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

// An at-least target must be above zero; "at most 0" is a valid limit
const isTarget = (value: unknown): value is HabitTarget =>
  isRecord(value)
    && isAmount(value.amount)
    && (value.direction === 'atMost' || (value.direction === 'atLeast' && value.amount > 0));

// Done check-ins belong to yes/no habits and amounts to measurable habits; either can be skipped
const isCheckIn = (value: unknown, isMeasurable: boolean): value is CheckIn => {
  if (!isRecord(value) || !isDate(value.date)) return false;
  if (value.status === 'skipped') return value.amount === undefined;
  if (isMeasurable) return value.status === undefined && isAmount(value.amount);
  return value.status === 'done' && value.amount === undefined;
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
    && (value.reminder === undefined || isReminder(value.reminder))
    && typeof value.startDate === 'string';

// A measurable habit has a unit and a target in every version of its rules; a yes/no habit has neither
const hasValidMeasure = (value: Record<string, unknown>, rules: HabitRules[]) => {
  if (value.kind === 'yesNo') return value.unit === undefined && rules.every(({ target }) => target === undefined);
  return value.kind === 'measurable'
    && typeof value.unit === 'string'
    && value.unit.trim() !== ''
    && rules.every(({ target }) => isTarget(target));
};

const isHabit = (value: unknown): value is Habit =>
  isRecord(value)
    && hasValidHabitFields(value)
    && Array.isArray(value.rules)
    && value.rules.length > 0
    && value.rules.every(isRules)
    && hasValidMeasure(value, value.rules)
    && isAscending(value.rules.map(({ effectiveFrom }) => effectiveFrom))
    && Array.isArray(value.pauses)
    && value.pauses.every(isPause)
    && (value.archivedOn === undefined || isDate(value.archivedOn))
    && Array.isArray(value.checkIns)
    && value.checkIns.every((checkIn) => isCheckIn(checkIn, value.kind === 'measurable'))
    && new Set(value.checkIns.map(({ date }) => date)).size === value.checkIns.length;

export const serializeBackup = (habits: Habit[]) => {
  const backup: HabitronBackup = {
    version: savedDataMigrations.version,
    exportedAt: new Date().toISOString(),
    habits
  };

  return JSON.stringify(backup, null, 2);
};

// Older backups run through the same migrations as stored data before they're validated
export const parseBackup = (content: string, migrations: MigrationChain = savedDataMigrations): Habit[] => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('The backup file is not valid JSON.');
  }

  if (!isRecord(parsed)
    || typeof parsed.exportedAt !== 'string'
    || typeof parsed.version !== 'number'
    || !Array.isArray(parsed.habits)) {
    throw new Error('The backup file is not a valid Habitron backup.');
  }

  const { habits } = migrations.migrate({ habits: parsed.habits }, parsed.version);
  if (Array.isArray(habits) && habits.every(isHabit)) {
    return habits;
  }

  throw new Error('The backup file is not a valid Habitron backup.');
};
