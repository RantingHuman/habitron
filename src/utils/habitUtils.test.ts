import { describe, expect, it } from 'vitest';
import { Habit, LegacyHabit, Log } from '../types/';
import { HISTORY_DAYS_TO_SHOW } from './constants';
import {
  getActivityCalendarData,
  getCurrentStreak,
  isHabitScheduledForDate,
  migrateLegacyHabit
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
  schedule: { type: 'daily' },
  startDate: '2026-09-19',
  completionHistory: [],
  ...overrides
});

describe('habit scheduling', () => {
  it('matches selected weekdays only', () => {
    const habit = makeHabit({ schedule: { type: 'weekdays', days: ['monday', 'wednesday'] } });

    expect(isHabitScheduledForDate(habit, '2026-09-21')).toBe(true);
    expect(isHabitScheduledForDate(habit, '2026-09-22')).toBe(false);
  });

  it('supports interval schedules anchored at the habit start date', () => {
    const habit = makeHabit({
      schedule: { type: 'interval', intervalDays: 2 }
    });

    expect(isHabitScheduledForDate(habit, '2026-09-19')).toBe(true);
    expect(isHabitScheduledForDate(habit, '2026-09-20')).toBe(false);
    expect(isHabitScheduledForDate(habit, '2026-09-21')).toBe(true);
    expect(isHabitScheduledForDate(habit, '2026-09-18')).toBe(false);
  });

});

describe('legacy habit migration', () => {
  const makeLegacyHabit = (overrides: Partial<LegacyHabit> = {}): LegacyHabit => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { schedule, ...habit } = makeHabit();
    return { ...habit, frequency: [], streak: 3, ...overrides };
  };

  it('migrates a habit saved by an early version of the app', () => {
    // Taken from a real version 0 store file
    const legacyHabit: LegacyHabit = {
      id: '3f89d718-3e62-4370-bec6-ef3b3fa89cbe',
      name: '123123',
      description: '123',
      frequency: [],
      streak: 0,
      startDate: '2025-03-13',
      completionHistory: [{
        id: '208cad4a-937f-4722-8a57-77e39f8957a1',
        timestamp: 1741898848561,
        date: '2025-03-13',
        type: 'manual',
        completed: true
      }]
    };

    const { frequency, streak, ...rest } = legacyHabit;
    expect(frequency).toEqual([]);
    expect(streak).toBe(0);
    expect(migrateLegacyHabit(legacyHabit)).toEqual({ ...rest, schedule: { type: 'daily' } });
  });

  it('treats an empty or daily legacy frequency as daily', () => {
    expect(migrateLegacyHabit(makeLegacyHabit()).schedule).toEqual({ type: 'daily' });
    expect(migrateLegacyHabit(makeLegacyHabit({ frequency: ['daily'] })).schedule)
      .toEqual({ type: 'daily' });
  });

  it('converts legacy weekday frequencies into a weekday schedule', () => {
    const habit = migrateLegacyHabit(makeLegacyHabit({ frequency: ['monday', 'wednesday'] }));

    expect(habit.schedule).toEqual({ type: 'weekdays', days: ['monday', 'wednesday'] });
    expect(habit).not.toHaveProperty('frequency');
    expect(habit).not.toHaveProperty('streak');
  });

  it('keeps an existing schedule over the legacy frequency', () => {
    const habit = migrateLegacyHabit(makeLegacyHabit({
      frequency: [],
      schedule: { type: 'interval', intervalDays: 3 }
    }));

    expect(habit.schedule).toEqual({ type: 'interval', intervalDays: 3 });
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
      schedule: { type: 'weekdays', days: ['monday', 'wednesday'] },
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