import { describe, expect, it } from 'vitest';
import { Habit, Log } from '../types/';
import { DAILY_FREQUENCY, HISTORY_DAYS_TO_SHOW } from './constants';
import {
  getActivityCalendarData,
  getCurrentStreak,
  isHabitScheduledForDate
} from './habitUtils';
import { getToday } from './dateUtils';

const makeLog = (date: string, completed = true): Log => ({
  id: `log-${date}`,
  timestamp: Date.parse(`${date}T12:00:00Z`),
  date,
  type: 'manual',
  completed
});

const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit-1',
  name: 'Test habit',
  description: '',
  frequency: [DAILY_FREQUENCY],
  streak: 0,
  startDate: '2026-09-19',
  completionHistory: [],
  ...overrides
});

describe('habit scheduling', () => {
  it('treats an empty legacy frequency as daily', () => {
    const habit = makeHabit({ frequency: [] });

    expect(isHabitScheduledForDate(habit, '2026-09-22')).toBe(true);
  });

  it('matches selected weekdays only', () => {
    const habit = makeHabit({ frequency: ['monday', 'wednesday'] });

    expect(isHabitScheduledForDate(habit, '2026-09-21')).toBe(true);
    expect(isHabitScheduledForDate(habit, '2026-09-22')).toBe(false);
  });
});

describe('current streaks', () => {
  it('counts completed daily dates before an unfinished current day', () => {
    const habit = makeHabit({
      completionHistory: [
        makeLog('2026-09-20'),
        makeLog('2026-09-21')
      ]
    });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(2);
  });

  it('skips non-scheduled weekdays when calculating a streak', () => {
    const habit = makeHabit({
      frequency: ['monday', 'wednesday'],
      completionHistory: [makeLog('2026-09-21')]
    });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(1);
  });
});

describe('activity calendar data', () => {
  it('returns a complete history window when no dates are logged', () => {
    const data = getActivityCalendarData(makeHabit());

    expect(data).toHaveLength(HISTORY_DAYS_TO_SHOW + 1);
    expect(new Set(data.map((activity) => activity.date)).size).toBe(data.length);
    expect(data.every((activity) => activity.level === 0)).toBe(true);
  });

  it('maps a completed current-day log to an active calendar entry', () => {
    const today = getToday();
    const data = getActivityCalendarData(
      makeHabit({ completionHistory: [makeLog(today)] })
    );

    expect(data[data.length - 1]).toEqual({ date: today, count: 1, level: 1 });
  });
});