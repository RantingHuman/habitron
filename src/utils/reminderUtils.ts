import { format } from 'date-fns';
import { Habit } from '../types/';
import { getLogStatus, isHabitScheduledForDate } from './habitUtils';

export const isValidReminderTime = (time: string) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

export const isReminderDue = (habit: Habit, now: Date = new Date()) => {
  const reminder = habit.reminder;
  if (!reminder?.enabled || !isValidReminderTime(reminder.time)) return false;

  const date = format(now, 'yyyy-MM-dd');
  if (!isHabitScheduledForDate(habit, date)) return false;

  const log = habit.completionHistory.find((entry) => entry.date === date);
  if (getLogStatus(log) !== 'unlogged') return false;

  return format(now, 'HH:mm') >= reminder.time;
};