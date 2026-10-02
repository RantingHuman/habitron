import { describe, expect, it } from 'vitest';
import { Habit, LegacyHabit, Log, LogStatus } from '../types/';
import { HISTORY_DAYS_TO_SHOW } from './constants';
import {
  anchorSchedule,
  canLogHabitOnDate,
  getActivityCalendarData,
  getCurrentStreak,
  getNextLogStatus,
  isHabitPausedOn,
  isHabitScheduledForDate,
  migrateLegacyHabit,
  pauseHabit,
  resumeHabit
} from './habitUtils';
import { getToday } from './dateUtils';

const makeLog = (date: string, completed = true, status?: LogStatus): Log => ({
  id: `log-${date}`,
  timestamp: Date.parse(`${date}T12:00:00Z`),
  date,
  type: 'manual',
  completed,
  ...(status && { status })
});

const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit-1',
  name: 'Test habit',
  description: '',
  schedule: { type: 'daily' },
  pauses: [],
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

  it('supports interval schedules counted from their anchor date', () => {
    const habit = makeHabit({
      schedule: { type: 'interval', intervalDays: 2, anchorDate: '2026-09-20' }
    });

    expect(isHabitScheduledForDate(habit, '2026-09-19')).toBe(false);
    expect(isHabitScheduledForDate(habit, '2026-09-20')).toBe(true);
    expect(isHabitScheduledForDate(habit, '2026-09-21')).toBe(false);
    expect(isHabitScheduledForDate(habit, '2026-09-22')).toBe(true);
  });

  it('extends interval schedules backwards from the anchor', () => {
    const habit = makeHabit({
      startDate: '2026-09-01',
      schedule: { type: 'interval', intervalDays: 3, anchorDate: '2026-09-20' }
    });

    expect(isHabitScheduledForDate(habit, '2026-09-17')).toBe(true);
    expect(isHabitScheduledForDate(habit, '2026-09-18')).toBe(false);
    expect(isHabitScheduledForDate(habit, '2026-09-19')).toBe(false);
  });

  it('is not due before the start date but can still be logged then', () => {
    const habit = makeHabit();

    expect(isHabitScheduledForDate(habit, '2026-09-18')).toBe(false);
    expect(canLogHabitOnDate(habit, '2026-09-18')).toBe(true);
  });

  it('cannot be logged on days that are paused or off-schedule', () => {
    const habit = makeHabit({
      schedule: { type: 'weekdays', days: ['monday', 'wednesday'] },
      pauses: [{ start: '2026-09-23' }]
    });

    expect(canLogHabitOnDate(habit, '2026-09-21')).toBe(true);
    expect(canLogHabitOnDate(habit, '2026-09-22')).toBe(false);
    expect(canLogHabitOnDate(habit, '2026-09-23')).toBe(false);
  });
});

describe('log status cycle', () => {
  it('cycles open, done, skip, missed, and back to open', () => {
    expect(getNextLogStatus('unlogged')).toBe('completed');
    expect(getNextLogStatus('completed')).toBe('skipped');
    expect(getNextLogStatus('skipped')).toBe('missed');
    expect(getNextLogStatus('missed')).toBeNull();
  });
});

describe('interval anchors', () => {
  const interval = (intervalDays: number, anchorDate = '2026-09-01') =>
    ({ type: 'interval', intervalDays, anchorDate }) as const;

  it('keeps the anchor when the interval is unchanged', () => {
    expect(anchorSchedule(interval(3, 'ignored'), interval(3), '2026-09-22'))
      .toEqual(interval(3, '2026-09-01'));
  });

  it('restarts the pattern today when the interval changes or is new', () => {
    expect(anchorSchedule(interval(4, 'ignored'), interval(3), '2026-09-22'))
      .toEqual(interval(4, '2026-09-22'));
    expect(anchorSchedule(interval(3, 'ignored'), { type: 'daily' }, '2026-09-22'))
      .toEqual(interval(3, '2026-09-22'));
    expect(anchorSchedule(interval(3, 'ignored'), undefined, '2026-09-22'))
      .toEqual(interval(3, '2026-09-22'));
  });

  it('leaves other schedule types unchanged', () => {
    expect(anchorSchedule({ type: 'daily' }, interval(3), '2026-09-22')).toEqual({ type: 'daily' });
  });
});

describe('pausing', () => {
  it('only pauses days from the pause onwards', () => {
    const habit = pauseHabit(makeHabit(), '2026-09-22');

    expect(habit.pauses).toEqual([{ start: '2026-09-22' }]);
    expect(isHabitScheduledForDate(habit, '2026-09-21')).toBe(true);
    expect(isHabitScheduledForDate(habit, '2026-09-22')).toBe(false);
    expect(isHabitScheduledForDate(habit, '2026-09-30')).toBe(false);
  });

  it('closes the pause on resume so later days are due again', () => {
    const habit = resumeHabit(pauseHabit(makeHabit(), '2026-09-22'), '2026-09-25');

    expect(habit.pauses).toEqual([{ start: '2026-09-22', end: '2026-09-25' }]);
    expect(isHabitPausedOn(habit, '2026-09-24')).toBe(true);
    expect(isHabitPausedOn(habit, '2026-09-25')).toBe(false);
    expect(isHabitScheduledForDate(habit, '2026-09-25')).toBe(true);
  });

  it('leaves no pause behind when paused and resumed on the same day', () => {
    const habit = resumeHabit(pauseHabit(makeHabit(), '2026-09-22'), '2026-09-22');

    expect(habit.pauses).toEqual([]);
  });

  it('continues the earlier pause when paused again on the day it was resumed', () => {
    const resumed = resumeHabit(pauseHabit(makeHabit(), '2026-09-22'), '2026-09-25');

    expect(pauseHabit(resumed, '2026-09-25').pauses).toEqual([{ start: '2026-09-22' }]);
  });

  it('ignores a pause while already paused', () => {
    const habit = pauseHabit(makeHabit(), '2026-09-22');

    expect(pauseHabit(habit, '2026-09-23')).toBe(habit);
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

  it('includes the current day once it is completed', () => {
    const habit = makeHabit({
      completionHistory: [makeLog('2026-09-21'), makeLog('2026-09-22')]
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

  it('keeps the streak through skipped days without counting them', () => {
    const habit = makeHabit({
      completionHistory: [
        makeLog('2026-09-19'),
        makeLog('2026-09-20', false, 'skipped'),
        makeLog('2026-09-21')
      ]
    });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(2);
  });

  it('keeps the streak when the current day is skipped', () => {
    const habit = makeHabit({
      completionHistory: [makeLog('2026-09-21'), makeLog('2026-09-22', false, 'skipped')]
    });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(1);
  });

  it('ends the streak at a missed or unlogged earlier day', () => {
    const missed = makeHabit({
      completionHistory: [makeLog('2026-09-19'), makeLog('2026-09-20', false), makeLog('2026-09-21')]
    });
    const unlogged = makeHabit({
      completionHistory: [makeLog('2026-09-19'), makeLog('2026-09-21')]
    });

    expect(getCurrentStreak(missed, '2026-09-22')).toBe(1);
    expect(getCurrentStreak(unlogged, '2026-09-22')).toBe(1);
  });

  it('ends the streak when the current day is marked missed', () => {
    const habit = makeHabit({
      completionHistory: [makeLog('2026-09-21'), makeLog('2026-09-22', false)]
    });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(0);
  });

  it('keeps the streak across a pause and while paused', () => {
    const habit = makeHabit({
      pauses: [{ start: '2026-09-21', end: '2026-09-24' }],
      completionHistory: [makeLog('2026-09-19'), makeLog('2026-09-20'), makeLog('2026-09-24')]
    });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(2);
    expect(getCurrentStreak(habit, '2026-09-24')).toBe(3);
  });
});

describe('legacy habit migration', () => {
  const makeLegacyHabit = (overrides: Partial<LegacyHabit> = {}): LegacyHabit => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { schedule, pauses, ...habit } = makeHabit();
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { frequency, streak, ...rest } = legacyHabit;
    expect(migrateLegacyHabit(legacyHabit)).toEqual({ ...rest, schedule: { type: 'daily' }, pauses: [] });
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

  it('anchors legacy interval schedules at the start date', () => {
    const habit = migrateLegacyHabit(makeLegacyHabit({
      frequency: [],
      schedule: { type: 'interval', intervalDays: 3 }
    }));

    expect(habit.schedule).toEqual({ type: 'interval', intervalDays: 3, anchorDate: '2026-09-19' });
  });

  it('turns a paused status into a pause starting after the last logged day', () => {
    const habit = migrateLegacyHabit(makeLegacyHabit({
      status: 'paused',
      completionHistory: [makeLog('2026-09-21'), makeLog('2026-09-20')]
    }));

    expect(habit.pauses).toEqual([{ start: '2026-09-22' }]);
    expect(habit).not.toHaveProperty('status');
  });

  it('starts a legacy pause at the start date when nothing was logged', () => {
    const habit = migrateLegacyHabit(makeLegacyHabit({ status: 'paused' }));

    expect(habit.pauses).toEqual([{ start: '2026-09-19' }]);
  });

  it('drops an active status without adding a pause', () => {
    const habit = migrateLegacyHabit(makeLegacyHabit({ status: 'active' }));

    expect(habit.pauses).toEqual([]);
    expect(habit).not.toHaveProperty('status');
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
