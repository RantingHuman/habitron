import { addDays, format, parse } from 'date-fns';
import { Habit } from '../types/';
import { getLogStatus, isHabitScheduledForDate } from './habitUtils';
import { DATE_FORMAT_FULL } from './constants';

export const isValidReminderTime = (time: string) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

const hasValidReminder = (habit: Habit) =>
  !!habit.reminder?.enabled && isValidReminderTime(habit.reminder.time);

const needsReminderOn = (habit: Habit, date: string) => {
  if (!isHabitScheduledForDate(habit, date)) return false;

  const log = habit.completionHistory.find((entry) => entry.date === date);
  return getLogStatus(log) === 'unlogged';
};

export const isReminderDue = (habit: Habit, now: Date = new Date()) =>
  hasValidReminder(habit)
    && needsReminderOn(habit, format(now, DATE_FORMAT_FULL))
    && format(now, 'HH:mm') >= habit.reminder!.time;

export interface UpcomingReminder {
  habit: Habit;
  at: Date;
}

// iOS keeps at most 64 pending local notifications per app
export const MAX_PENDING_REMINDERS = 64;

// Reminders still to come in the next `days` days, soonest first, for scheduling with the OS
export const getUpcomingReminders = (
  habits: Habit[],
  now: Date = new Date(),
  days = 14,
  limit = MAX_PENDING_REMINDERS
): UpcomingReminder[] =>
  habits
    .filter(hasValidReminder)
    .flatMap((habit) => Array.from({ length: days }, (_, offset) => {
      const date = format(addDays(now, offset), DATE_FORMAT_FULL);
      const at = parse(`${date} ${habit.reminder!.time}`, `${DATE_FORMAT_FULL} HH:mm`, now);
      return at > now && needsReminderOn(habit, date) ? [{ habit, at }] : [];
    }).flat())
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, limit);