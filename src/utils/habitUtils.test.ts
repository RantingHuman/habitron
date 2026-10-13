import { describe, expect, it } from 'vitest';
import { CheckIn, CheckInStatus, Habit, HabitSchedule } from '../types/';
import { HISTORY_DAYS_TO_SHOW } from './constants';
import {
  archiveHabit,
  canCheckIn,
  changeSchedule,
  getActivityCalendarData,
  getCurrentStreak,
  getNextCheckInStatus,
  getRulesOn,
  isDueDay,
  isHabitPausedOn,
  mergePauses,
  pauseHabit,
  restoreHabit,
  resumeHabit,
  setCheckIn
} from './habitUtils';
import { getToday } from './dateUtils';

// 2026-09-19 is a Saturday, 2026-09-21 a Monday
const checkIn = (date: string, status: CheckInStatus = 'done'): CheckIn => ({ date, status });

const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit-1',
  name: 'Test habit',
  description: '',
  rules: [{ effectiveFrom: '2026-09-19', schedule: { type: 'daily' } }],
  pauses: [],
  startDate: '2026-09-19',
  checkIns: [],
  ...overrides
});

const mondayWednesday = (): HabitSchedule => ({ type: 'weekdays', days: ['monday', 'wednesday'] });
const mondayWednesdayRules = () => [{ effectiveFrom: '2026-09-19', schedule: mondayWednesday() }];

describe('due days', () => {
  it('matches selected weekdays only', () => {
    const habit = makeHabit({ rules: mondayWednesdayRules() });

    expect(isDueDay(habit, '2026-09-21')).toBe(true);
    expect(isDueDay(habit, '2026-09-22')).toBe(false);
  });

  it('counts interval schedules in both directions from the day their rules took effect', () => {
    const habit = makeHabit({
      startDate: '2026-09-01',
      rules: [{ effectiveFrom: '2026-09-20', schedule: { type: 'interval', intervalDays: 3 } }]
    });

    expect(isDueDay(habit, '2026-09-17')).toBe(true);
    expect(isDueDay(habit, '2026-09-19')).toBe(false);
    expect(isDueDay(habit, '2026-09-20')).toBe(true);
    expect(isDueDay(habit, '2026-09-23')).toBe(true);
  });

  it('has no due days before the start date', () => {
    expect(isDueDay(makeHabit(), '2026-09-18')).toBe(false);
  });

  it('has no due days from the day the habit is archived', () => {
    const habit = makeHabit({ archivedOn: '2026-09-22' });

    expect(isDueDay(habit, '2026-09-21')).toBe(true);
    expect(isDueDay(habit, '2026-09-22')).toBe(false);
  });
});

describe('rule versions', () => {
  it('applies a schedule change from today, keeping earlier days on the old schedule', () => {
    const habit = changeSchedule(makeHabit(), mondayWednesday(), '2026-09-22');

    expect(habit.rules).toEqual([
      { effectiveFrom: '2026-09-19', schedule: { type: 'daily' } },
      { effectiveFrom: '2026-09-22', schedule: mondayWednesday() }
    ]);
    // Sunday was due under the daily schedule, the next Sunday is not
    expect(isDueDay(habit, '2026-09-20')).toBe(true);
    expect(isDueDay(habit, '2026-09-27')).toBe(false);
  });

  it('uses the first rules for days before they took effect', () => {
    const habit = makeHabit({ startDate: '2026-09-01' });

    expect(getRulesOn(habit, '2026-09-01')).toBe(habit.rules[0]);
  });

  it('ignores a change to the same schedule, in any weekday order', () => {
    const habit = changeSchedule(makeHabit(), mondayWednesday(), '2026-09-22');

    expect(changeSchedule(habit, { type: 'weekdays', days: ['wednesday', 'monday'] }, '2026-09-25')).toBe(habit);
  });

  it('replaces a version made the same day instead of adding another', () => {
    const changed = changeSchedule(makeHabit(), mondayWednesday(), '2026-09-22');
    const habit = changeSchedule(changed, { type: 'interval', intervalDays: 2 }, '2026-09-22');

    expect(habit.rules).toHaveLength(2);
    expect(habit.rules[1]).toEqual({ effectiveFrom: '2026-09-22', schedule: { type: 'interval', intervalDays: 2 } });
  });

  it('undoes a same-day change when the schedule is changed back', () => {
    const changed = changeSchedule(makeHabit(), mondayWednesday(), '2026-09-22');

    expect(changeSchedule(changed, { type: 'daily' }, '2026-09-22').rules)
      .toEqual([{ effectiveFrom: '2026-09-19', schedule: { type: 'daily' } }]);
  });

  it('replaces the only version of a habit created today', () => {
    const habit = changeSchedule(makeHabit(), mondayWednesday(), '2026-09-19');

    expect(habit.rules).toEqual([{ effectiveFrom: '2026-09-19', schedule: mondayWednesday() }]);
  });

  it('starts a changed interval on the day of the change', () => {
    const habit = changeSchedule(makeHabit(), { type: 'interval', intervalDays: 3 }, '2026-09-22');

    expect(isDueDay(habit, '2026-09-22')).toBe(true);
    expect(isDueDay(habit, '2026-09-23')).toBe(false);
    expect(isDueDay(habit, '2026-09-25')).toBe(true);
  });
});

describe('check-ins', () => {
  it('can be made on due days, days that are not due, and days before the start date', () => {
    const habit = makeHabit({ rules: mondayWednesdayRules() });

    expect(canCheckIn(habit, '2026-09-21')).toBe(true);
    expect(canCheckIn(habit, '2026-09-22')).toBe(true);
    expect(canCheckIn(habit, '2026-09-14')).toBe(true);
  });

  it('cannot be made on paused days or for an archived habit', () => {
    const paused = makeHabit({ pauses: [{ start: '2026-09-23' }] });
    const archived = makeHabit({ archivedOn: '2026-09-25' });

    expect(canCheckIn(paused, '2026-09-23')).toBe(false);
    expect(canCheckIn(archived, '2026-09-21')).toBe(false);
  });

  it('replaces and clears the check-in for a day', () => {
    const done = setCheckIn(makeHabit(), '2026-09-21', 'done');
    const skipped = setCheckIn(done, '2026-09-21', 'skipped');

    expect(skipped.checkIns).toEqual([checkIn('2026-09-21', 'skipped')]);
    expect(setCheckIn(skipped, '2026-09-21', null).checkIns).toEqual([]);
  });

  it('moves the start date back when a day before it is checked in', () => {
    expect(setCheckIn(makeHabit(), '2026-09-15', 'done').startDate).toBe('2026-09-15');
    expect(setCheckIn(makeHabit(), '2026-09-25', 'done').startDate).toBe('2026-09-19');
  });

  it('cycles a due day through open, done, skip, and back to open', () => {
    const habit = makeHabit();

    expect(getNextCheckInStatus(habit, '2026-09-21')).toBe('done');
    expect(getNextCheckInStatus(setCheckIn(habit, '2026-09-21', 'done'), '2026-09-21')).toBe('skipped');
    expect(getNextCheckInStatus(setCheckIn(habit, '2026-09-21', 'skipped'), '2026-09-21')).toBeNull();
  });

  it('cycles a day that is not due between open and a bonus check-in only', () => {
    const habit = makeHabit({ rules: mondayWednesdayRules() });

    expect(getNextCheckInStatus(habit, '2026-09-22')).toBe('done');
    expect(getNextCheckInStatus(setCheckIn(habit, '2026-09-22', 'done'), '2026-09-22')).toBeNull();
  });

  it('allows skipping a schedule day before the start date', () => {
    const habit = setCheckIn(makeHabit(), '2026-09-14', 'done');

    expect(getNextCheckInStatus(habit, '2026-09-14')).toBe('skipped');
  });
});

describe('pausing', () => {
  it('only pauses days from the pause onwards', () => {
    const habit = pauseHabit(makeHabit(), '2026-09-22');

    expect(habit.pauses).toEqual([{ start: '2026-09-22' }]);
    expect(isDueDay(habit, '2026-09-21')).toBe(true);
    expect(isDueDay(habit, '2026-09-22')).toBe(false);
    expect(isDueDay(habit, '2026-09-30')).toBe(false);
  });

  it('closes the pause on resume so later days are due again', () => {
    const habit = resumeHabit(pauseHabit(makeHabit(), '2026-09-22'), '2026-09-25');

    expect(habit.pauses).toEqual([{ start: '2026-09-22', end: '2026-09-25' }]);
    expect(isHabitPausedOn(habit, '2026-09-24')).toBe(true);
    expect(isHabitPausedOn(habit, '2026-09-25')).toBe(false);
    expect(isDueDay(habit, '2026-09-25')).toBe(true);
  });

  it('leaves no pause behind when paused and resumed on the same day', () => {
    expect(resumeHabit(pauseHabit(makeHabit(), '2026-09-22'), '2026-09-22').pauses).toEqual([]);
  });

  it('continues the earlier pause when paused again on the day it was resumed', () => {
    const resumed = resumeHabit(pauseHabit(makeHabit(), '2026-09-22'), '2026-09-25');

    expect(pauseHabit(resumed, '2026-09-25').pauses).toEqual([{ start: '2026-09-22' }]);
  });

  it('ignores a pause while already paused', () => {
    const habit = pauseHabit(makeHabit(), '2026-09-22');

    expect(pauseHabit(habit, '2026-09-23')).toBe(habit);
  });

  it('merges overlapping and touching pauses and keeps separate ones apart', () => {
    expect(mergePauses([
      { start: '2026-09-10', end: '2026-09-12' },
      { start: '2026-09-01', end: '2026-09-05' },
      { start: '2026-09-11', end: '2026-09-15' },
      { start: '2026-09-15', end: '2026-09-16' },
      { start: '2026-09-20' },
      { start: '2026-09-25', end: '2026-09-27' }
    ])).toEqual([
      { start: '2026-09-01', end: '2026-09-05' },
      { start: '2026-09-10', end: '2026-09-16' },
      { start: '2026-09-20' }
    ]);
  });
});

describe('archiving', () => {
  it('records the day the habit was archived, once', () => {
    const habit = archiveHabit(makeHabit(), '2026-09-22');

    expect(habit.archivedOn).toBe('2026-09-22');
    expect(archiveHabit(habit, '2026-09-25')).toBe(habit);
  });

  it('turns the archived period into a pause when restored', () => {
    const habit = restoreHabit(archiveHabit(makeHabit(), '2026-09-22'), '2026-09-25');

    expect(habit).not.toHaveProperty('archivedOn');
    expect(habit.pauses).toEqual([{ start: '2026-09-22', end: '2026-09-25' }]);
    expect(isDueDay(habit, '2026-09-24')).toBe(false);
    expect(isDueDay(habit, '2026-09-25')).toBe(true);
  });

  it('leaves no pause behind when archived and restored on the same day', () => {
    expect(restoreHabit(archiveHabit(makeHabit(), '2026-09-22'), '2026-09-22').pauses).toEqual([]);
  });

  it('stays paused when a paused habit is archived and restored', () => {
    const paused = pauseHabit(makeHabit(), '2026-09-20');
    const habit = restoreHabit(archiveHabit(paused, '2026-09-22'), '2026-09-25');

    expect(habit.pauses).toEqual([{ start: '2026-09-20' }]);
  });
});

describe('current streaks', () => {
  it('counts done due days before an unfinished current day', () => {
    const habit = makeHabit({ checkIns: [checkIn('2026-09-20'), checkIn('2026-09-21')] });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(2);
  });

  it('includes the current day once it is done', () => {
    const habit = makeHabit({ checkIns: [checkIn('2026-09-21'), checkIn('2026-09-22')] });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(2);
  });

  it('passes over days that are not due', () => {
    const habit = makeHabit({
      rules: mondayWednesdayRules(),
      checkIns: [checkIn('2026-09-21')]
    });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(1);
  });

  it('does not count bonus check-ins', () => {
    const habit = makeHabit({
      rules: mondayWednesdayRules(),
      checkIns: [checkIn('2026-09-21'), checkIn('2026-09-22')]
    });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(1);
  });

  it('keeps the streak through skipped days without counting them', () => {
    const habit = makeHabit({
      checkIns: [checkIn('2026-09-19'), checkIn('2026-09-20', 'skipped'), checkIn('2026-09-21')]
    });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(2);
  });

  it('keeps the streak when the current day is skipped', () => {
    const habit = makeHabit({ checkIns: [checkIn('2026-09-21'), checkIn('2026-09-22', 'skipped')] });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(1);
  });

  it('ends the streak at a missed day', () => {
    const habit = makeHabit({ checkIns: [checkIn('2026-09-19'), checkIn('2026-09-21')] });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(1);
  });

  it('keeps the streak across a pause and while paused', () => {
    const habit = makeHabit({
      pauses: [{ start: '2026-09-21', end: '2026-09-24' }],
      checkIns: [checkIn('2026-09-19'), checkIn('2026-09-20'), checkIn('2026-09-24')]
    });

    expect(getCurrentStreak(habit, '2026-09-22')).toBe(2);
    expect(getCurrentStreak(habit, '2026-09-24')).toBe(3);
  });

  it('judges each day by the schedule it had', () => {
    // Daily until Tuesday 22nd, then Mondays and Wednesdays: the 23rd and 21st/20th/19th all count
    const habit = changeSchedule(makeHabit({
      checkIns: [checkIn('2026-09-19'), checkIn('2026-09-20'), checkIn('2026-09-21'), checkIn('2026-09-23')]
    }), mondayWednesday(), '2026-09-22');

    expect(getCurrentStreak(habit, '2026-09-24')).toBe(4);
  });
});

describe('activity calendar data', () => {
  it('returns a complete history window when nothing is checked in', () => {
    const data = getActivityCalendarData(makeHabit());

    expect(data).toHaveLength(HISTORY_DAYS_TO_SHOW + 1);
    expect(new Set(data.map((activity) => activity.date)).size).toBe(data.length);
    expect(data.every((activity) => activity.level === 0)).toBe(true);
  });

  it('maps a done current day to an active calendar entry', () => {
    const today = getToday();
    const data = getActivityCalendarData(makeHabit({ checkIns: [checkIn(today)] }));

    expect(data[data.length - 1]).toEqual({ date: today, count: 1, level: 1 });
  });
});
