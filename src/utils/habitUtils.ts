import { differenceInCalendarDays, format, isBefore, parseISO, subDays } from 'date-fns';
import { Habit, HabitReminder, HabitSchedule, LegacyHabit, Log, LogStatus, Weekday } from '../types/';
import {v4 as uuidv4} from 'uuid';
import { DATE_FORMAT_FULL, LEGACY_DAILY_FREQUENCY, HISTORY_DAYS_TO_SHOW, WEEKDAY_FREQUENCIES } from './constants';
import { getToday, getCurrentTimestamp, getLastNDates } from './dateUtils';

const isWeekday = (value: string): value is Weekday =>
  WEEKDAY_FREQUENCIES.some(({ value: weekday }) => weekday === value);

const getScheduleFromLegacyFrequency = (frequency: string[] = []): HabitSchedule => {
  if (frequency.length === 0 || frequency.includes(LEGACY_DAILY_FREQUENCY)) return { type: 'daily' };

  const days = frequency.filter(isWeekday);
  return days.length > 0 ? { type: 'weekdays', days } : { type: 'daily' };
};

// Converts a habit saved before schedules existed; `streak` is dropped because it is always computed
export const migrateLegacyHabit = (legacyHabit: LegacyHabit | Habit): Habit => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { frequency, streak, ...habit } = legacyHabit as LegacyHabit;
  return {
    ...habit,
    schedule: habit.schedule ?? getScheduleFromLegacyFrequency(frequency)
  };
};

export const createHabit = (
  name: string,
  description: string,
  schedule: HabitSchedule = { type: 'daily' },
  reminder?: HabitReminder
) => {
  const newHabit: Habit = {
    id: uuidv4(),
    name,
    description,
    schedule,
    reminder,
    startDate: getToday(),
    completionHistory: []
  };

  return newHabit;
}

export const createLog = (date?: string, type: 'manual' | 'computed' = 'manual', completed: boolean = false) => {
  const newLog: Log = {
    id: uuidv4(),
    timestamp: getCurrentTimestamp(),
    date: date || getToday(),
    type,
    completed,
    status: completed ? 'completed' : 'missed'
  };

  return newLog;
}

export const getLogStatus = (log?: Log): LogStatus | 'unlogged' => {
  if (!log) return 'unlogged';
  if (log.status) return log.status;
  return log.completed ? 'completed' : 'missed';
};

export const isHabitScheduledForDate = (habit: Habit, date: string) => {
  if (habit.status === 'paused') return false;

  const currentDate = parseISO(date);
  const startDate = parseISO(habit.startDate);
  if (isBefore(currentDate, startDate)) return false;

  const { schedule } = habit;
  if (schedule.type === 'daily') return true;

  if (schedule.type === 'weekdays') {
    const weekday = format(currentDate, 'EEEE').toLowerCase();
    return schedule.days.includes(weekday as Weekday);
  }

  return differenceInCalendarDays(currentDate, startDate) % schedule.intervalDays === 0;
}

export const getCurrentStreak = (habit: Habit, referenceDate: string = getToday()) => {
  const completedDates = new Set(
    habit.completionHistory
      .filter((log) => getLogStatus(log) === 'completed')
      .map((log) => log.date)
  );
  const startDate = parseISO(habit.startDate);
  let currentDate = parseISO(referenceDate);
  let streak = 0;

  if (
    isHabitScheduledForDate(habit, referenceDate) &&
    !completedDates.has(referenceDate)
  ) {
    currentDate = subDays(currentDate, 1);
  }

  while (!isBefore(currentDate, startDate)) {
    const date = format(currentDate, DATE_FORMAT_FULL);
    if (isHabitScheduledForDate(habit, date)) {
      if (!completedDates.has(date)) break;
      streak += 1;
    }
    currentDate = subDays(currentDate, 1);
  }

  return streak;
}

export const getActivityCalendarData = (habit: Habit) => {
  const logsByDate = new Map(
    habit.completionHistory.map((log) => [log.date, log])
  );

  return getLastNDates(HISTORY_DAYS_TO_SHOW + 1).map((date) => {
    const formattedDate = format(date, DATE_FORMAT_FULL);
    const log = logsByDate.get(formattedDate);
    const level = getLogStatus(log) === 'completed' ? 1 : 0;

    return {
      date: formattedDate,
      count: level,
      level
    };
  });
}