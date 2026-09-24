import { differenceInCalendarDays, format, isBefore, parseISO, subDays } from 'date-fns';
import { Habit, HabitSchedule, Log, Weekday } from '../types/';
import {v4 as uuidv4} from 'uuid';
import { DAILY_FREQUENCY, DATE_FORMAT_FULL, HISTORY_DAYS_TO_SHOW, WEEKDAY_FREQUENCIES } from './constants';
import { getToday, getCurrentTimestamp, getLastNDates } from './dateUtils';

const isWeekday = (value: string): value is Weekday =>
  WEEKDAY_FREQUENCIES.some(({ value: weekday }) => weekday === value);

export const getHabitSchedule = (habit: Habit): HabitSchedule => {
  if (habit.schedule) return habit.schedule;

  const frequency = habit.frequency?.length ? habit.frequency : [DAILY_FREQUENCY];
  if (frequency.includes(DAILY_FREQUENCY)) return { type: 'daily' };

  const days = frequency.filter(isWeekday);
  return days.length > 0 ? { type: 'weekdays', days } : { type: 'daily' };
};

export const getFrequencyForSchedule = (schedule: HabitSchedule): string[] => {
  if (schedule.type === 'daily') return [DAILY_FREQUENCY];
  if (schedule.type === 'weekdays') return [...schedule.days];
  return [];
};

export const createHabit = (
  name: string,
  description: string,
  schedule: HabitSchedule = { type: 'daily' }
) => {
  const newHabit: Habit = {
    id: uuidv4(),
    name,
    description,
    frequency: getFrequencyForSchedule(schedule),
    schedule,
    streak: 0,
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
    completed
  };

  return newLog;
}

export const isHabitScheduledForDate = (habit: Habit, date: string) => {
  const currentDate = parseISO(date);
  const startDate = parseISO(habit.startDate);
  if (isBefore(currentDate, startDate)) return false;

  const schedule = getHabitSchedule(habit);
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
      .filter((log) => log.completed)
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
    const level = log?.completed ? 1 : 0;

    return {
      date: formattedDate,
      count: level,
      level
    };
  });
}