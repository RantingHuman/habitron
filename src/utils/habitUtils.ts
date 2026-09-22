import { format, isBefore, parseISO, subDays } from 'date-fns';
import { Habit, Log } from '../types/';
import {v4 as uuidv4} from 'uuid';
import { DAILY_FREQUENCY, DATE_FORMAT_FULL, HISTORY_DAYS_TO_SHOW } from './constants';
import { getToday, getCurrentTimestamp, getLastNDates } from './dateUtils';

export const createHabit = (name: string, description: string, frequency: string[] = [DAILY_FREQUENCY]) => {
  const newHabit: Habit = {
    id: uuidv4(),
    name,
    description,
    frequency,
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
  const frequency = habit.frequency?.length ? habit.frequency : [DAILY_FREQUENCY];
  if (frequency.includes(DAILY_FREQUENCY)) return true;

  const weekday = format(parseISO(date), 'EEEE').toLowerCase();
  return frequency.includes(weekday);
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