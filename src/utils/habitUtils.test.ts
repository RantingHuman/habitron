import { describe, expect, it } from 'vitest';
import { CheckIn, CheckInStatus, Habit, HabitSchedule, HabitTarget } from '../types/';
import { HISTORY_DAYS_TO_SHOW } from './constants';
import {
  archiveHabit,
  canCheckIn,
  countCheckInsRemovedByPause,
  createHabit,
  changePause,
  changeRules,
  getActivityCalendarData,
  getCurrentStreak,
  getNextCheckIn,
  getRulesOn,
  getStrengthScore,
  isDayDone,
  isDueDay,
  isHabitPausedOn,
  mergePauses,
  pauseDates,
  pauseHabit,
  removePause,
  restoreHabit,
  resumeHabit,
  setCheckIn
} from './habitUtils';
import { getToday } from './dateUtils';
import { addDays, format, parseISO } from 'date-fns';

// 2026-09-19 is a Saturday, 2026-09-21 a Monday
const checkIn = (date: string, status: CheckInStatus = 'done'): CheckIn => ({ date, status });
const amountCheckIn = (date: string, amount: number): CheckIn => ({ date, amount });

const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit-1',
  name: 'Test habit',
  description: '',
  kind: 'yesNo',
  rules: [{ effectiveFrom: '2026-09-19', schedule: { type: 'daily' } }],
  pauses: [],
  startDate: '2026-09-19',
  checkIns: [],
  ...overrides
});

const mondayWednesday = (): HabitSchedule => ({ type: 'weekdays', days: ['monday', 'wednesday'] });
const mondayWednesdayRules = () => [{ effectiveFrom: '2026-09-19', schedule: mondayWednesday() }];

// `count` consecutive dates, `step` days apart, from `start`
const dates = (start: string, count: number, step = 1) =>
  Array.from({ length: count }, (_, index) => format(addDays(parseISO(start), index * step), 'yyyy-MM-dd'));

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
    const habit = changeRules(makeHabit(), { schedule: mondayWednesday() }, '2026-09-22');

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
    const habit = changeRules(makeHabit(), { schedule: mondayWednesday() }, '2026-09-22');

    expect(changeRules(habit, { schedule: { type: 'weekdays', days: ['wednesday', 'monday'] } }, '2026-09-25')).toBe(habit);
  });

  it('replaces a version made the same day instead of adding another', () => {
    const changed = changeRules(makeHabit(), { schedule: mondayWednesday() }, '2026-09-22');
    const habit = changeRules(changed, { schedule: { type: 'interval', intervalDays: 2 } }, '2026-09-22');

    expect(habit.rules).toHaveLength(2);
    expect(habit.rules[1]).toEqual({ effectiveFrom: '2026-09-22', schedule: { type: 'interval', intervalDays: 2 } });
  });

  it('undoes a same-day change when the schedule is changed back', () => {
    const changed = changeRules(makeHabit(), { schedule: mondayWednesday() }, '2026-09-22');

    expect(changeRules(changed, { schedule: { type: 'daily' } }, '2026-09-22').rules)
      .toEqual([{ effectiveFrom: '2026-09-19', schedule: { type: 'daily' } }]);
  });

  it('replaces the only version of a habit created today', () => {
    const habit = changeRules(makeHabit(), { schedule: mondayWednesday() }, '2026-09-19');

    expect(habit.rules).toEqual([{ effectiveFrom: '2026-09-19', schedule: mondayWednesday() }]);
  });

  it('starts a changed interval on the day of the change', () => {
    const habit = changeRules(makeHabit(), { schedule: { type: 'interval', intervalDays: 3 } }, '2026-09-22');

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
    const done = setCheckIn(makeHabit(), '2026-09-21', { status: 'done' });
    const skipped = setCheckIn(done, '2026-09-21', { status: 'skipped' });

    expect(skipped.checkIns).toEqual([checkIn('2026-09-21', 'skipped')]);
    expect(setCheckIn(skipped, '2026-09-21', null).checkIns).toEqual([]);
  });

  it('moves the start date back when a day before it is checked in', () => {
    expect(setCheckIn(makeHabit(), '2026-09-15', { status: 'done' }).startDate).toBe('2026-09-15');
    expect(setCheckIn(makeHabit(), '2026-09-25', { status: 'done' }).startDate).toBe('2026-09-19');
  });

  it('cycles a due day through open, done, skip, and back to open', () => {
    const habit = makeHabit();

    expect(getNextCheckIn(habit, '2026-09-21')).toEqual({ status: 'done' });
    expect(getNextCheckIn(setCheckIn(habit, '2026-09-21', { status: 'done' }), '2026-09-21')).toEqual({ status: 'skipped' });
    expect(getNextCheckIn(setCheckIn(habit, '2026-09-21', { status: 'skipped' }), '2026-09-21')).toBeNull();
  });

  it('cycles a day that is not due between open and a bonus check-in only', () => {
    const habit = makeHabit({ rules: mondayWednesdayRules() });

    expect(getNextCheckIn(habit, '2026-09-22')).toEqual({ status: 'done' });
    expect(getNextCheckIn(setCheckIn(habit, '2026-09-22', { status: 'done' }), '2026-09-22')).toBeNull();
  });

  it('allows skipping a schedule day before the start date', () => {
    const habit = setCheckIn(makeHabit(), '2026-09-14', { status: 'done' });

    expect(getNextCheckIn(habit, '2026-09-14')).toEqual({ status: 'skipped' });
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

  it('keeps a planned pause when resuming from the current one', () => {
    const planned = makeHabit({ pauses: [{ start: '2026-10-01', end: '2026-12-20' }, { start: '2026-12-20', end: '2027-01-01' }] });
    const habit = resumeHabit(planned, '2026-11-10');

    expect(isDueDay(habit, '2026-11-10')).toBe(true);
    expect(dates('2026-12-20', 12).some((date) => isDueDay(habit, date))).toBe(false);
    expect(isDueDay(habit, '2027-01-01')).toBe(true);
  });

  it('keeps a planned pause when resuming while not paused', () => {
    const planned = makeHabit({ pauses: [{ start: '2026-12-20', end: '2027-01-01' }] });

    expect(isDueDay(resumeHabit(planned, '2026-11-10'), '2026-12-24')).toBe(false);
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

describe('pausing dates', () => {
  it('pauses only the days in the range, past or future', () => {
    const habit = pauseDates(makeHabit(), { start: '2026-09-22', end: '2026-09-25' })!;

    expect(isDueDay(habit, '2026-09-21')).toBe(true);
    expect(isDueDay(habit, '2026-09-22')).toBe(false);
    expect(isDueDay(habit, '2026-09-24')).toBe(false);
    expect(canCheckIn(habit, '2026-09-24')).toBe(false);
    expect(isDueDay(habit, '2026-09-25')).toBe(true);
  });

  it('removes the check-ins on paused days and keeps the others', () => {
    const habit = makeHabit({ checkIns: dates('2026-09-19', 8).map((date) => checkIn(date)) });
    const paused = pauseDates(habit, { start: '2026-09-22', end: '2026-09-25' })!;

    expect(paused.checkIns.map(({ date }) => date)).toEqual(
      ['2026-09-19', '2026-09-20', '2026-09-21', '2026-09-25', '2026-09-26']
    );
    // The pause neither builds nor breaks the streak
    expect(getCurrentStreak(paused, '2026-09-26')).toBe(5);
  });

  it('removes every later check-in when the pause has no end', () => {
    const habit = makeHabit({ checkIns: dates('2026-09-19', 5).map((date) => checkIn(date)) });
    const paused = pauseDates(habit, { start: '2026-09-21' })!;

    expect(paused.checkIns.map(({ date }) => date)).toEqual(['2026-09-19', '2026-09-20']);
    expect(isDueDay(paused, '2026-12-01')).toBe(false);
  });

  it('cuts a range that starts before the start date to begin on the start date', () => {
    const habit = makeHabit({ startDate: '2026-09-19' });
    const paused = pauseDates(habit, { start: '2026-09-10', end: '2026-09-21' })!;
    // A backfilled check-in from before the start date moves the start date back
    const backfilled = setCheckIn(paused, '2026-09-15', { status: 'done' });

    expect(isDueDay(paused, '2026-09-20')).toBe(false);
    expect(isDueDay(paused, '2026-09-21')).toBe(true);
    expect(canCheckIn(paused, '2026-09-15')).toBe(true);
    expect(isDueDay(backfilled, '2026-09-16')).toBe(true);
  });

  it('rejects a range that ends before the start date', () => {
    const habit = makeHabit({ startDate: '2026-09-19' });

    expect(pauseDates(habit, { start: '2026-09-10', end: '2026-09-19' })).toBeUndefined();
    expect(pauseDates(habit, { start: '2026-09-10', end: '2026-09-15' })).toBeUndefined();
  });

  it('rejects a range that ends before it starts', () => {
    expect(pauseDates(makeHabit(), { start: '2026-09-25', end: '2026-09-22' })).toBeUndefined();
    expect(pauseDates(makeHabit(), { start: '2026-09-25', end: '2026-09-25' })).toBeUndefined();
  });

  it('merges a range with the pauses it overlaps or touches', () => {
    const habit = makeHabit({ pauses: [{ start: '2026-09-22', end: '2026-09-25' }] });
    const paused = pauseDates(habit, { start: '2026-09-25', end: '2026-09-27' })!;

    expect(isDueDay(paused, '2026-09-21')).toBe(true);
    expect(dates('2026-09-22', 5).some((date) => isDueDay(paused, date))).toBe(false);
    expect(isDueDay(paused, '2026-09-27')).toBe(true);
  });

  it('counts the check-ins a range would remove', () => {
    const habit = makeHabit({ checkIns: dates('2026-09-19', 8).map((date) => checkIn(date, 'skipped')) });

    expect(countCheckInsRemovedByPause(habit, { start: '2026-09-22', end: '2026-09-25' })).toBe(3);
    expect(countCheckInsRemovedByPause(habit, { start: '2026-09-24' })).toBe(3);
    expect(countCheckInsRemovedByPause(habit, { start: '2026-09-10', end: '2026-09-21' })).toBe(2);
    expect(countCheckInsRemovedByPause(habit, { start: '2026-09-28', end: '2026-10-01' })).toBe(0);
    expect(countCheckInsRemovedByPause(habit, { start: '2026-09-10', end: '2026-09-15' })).toBe(0);
  });

  it('removes the check-in for today when paused now', () => {
    const habit = makeHabit({ checkIns: [checkIn('2026-09-21'), checkIn('2026-09-22')] });
    const paused = pauseHabit(habit, '2026-09-22');

    expect(paused.checkIns.map(({ date }) => date)).toEqual(['2026-09-21']);
    expect(countCheckInsRemovedByPause(habit, { start: '2026-09-22' })).toBe(1);
  });
});

describe('changing and removing pauses', () => {
  const doneEveryDay = () => makeHabit({ checkIns: dates('2026-09-19', 8).map((date) => checkIn(date)) });
  const pausedMidWeek = () => pauseDates(doneEveryDay(), { start: '2026-09-22', end: '2026-09-25' })!;

  it('brings back the due days of a removed pause but not its check-ins', () => {
    const habit = removePause(pausedMidWeek(), { start: '2026-09-22', end: '2026-09-25' });

    expect(isDueDay(habit, '2026-09-23')).toBe(true);
    expect(canCheckIn(habit, '2026-09-23')).toBe(true);
    expect(isDayDone(habit, '2026-09-23')).toBe(false);
    expect(getCurrentStreak(habit, '2026-09-26')).toBe(2);
    expect(getStrengthScore(habit, '2026-09-26')).toBeLessThan(getStrengthScore(pausedMidWeek(), '2026-09-26'));
  });

  it('brings back the due days a shortened pause no longer covers, without their check-ins', () => {
    const habit = changePause(pausedMidWeek(), { start: '2026-09-22', end: '2026-09-25' },
      { start: '2026-09-22', end: '2026-09-23' })!;

    expect(isDueDay(habit, '2026-09-22')).toBe(false);
    expect(isDueDay(habit, '2026-09-23')).toBe(true);
    expect(isDayDone(habit, '2026-09-23')).toBe(false);
  });

  it('removes the check-ins on days a lengthened pause newly covers', () => {
    const before = pausedMidWeek();
    const range = { start: '2026-09-20', end: '2026-09-25' };
    const habit = changePause(before, { start: '2026-09-22', end: '2026-09-25' }, range)!;

    expect(countCheckInsRemovedByPause(before, range)).toBe(2);
    expect(habit.checkIns.map(({ date }) => date)).toEqual(['2026-09-19', '2026-09-25', '2026-09-26']);
    expect(isDueDay(habit, '2026-09-20')).toBe(false);
  });

  it('merges a changed pause with another pause it now overlaps', () => {
    const twoPauses = pauseDates(pausedMidWeek(), { start: '2026-09-28', end: '2026-09-30' })!;
    const habit = changePause(twoPauses, { start: '2026-09-28', end: '2026-09-30' },
      { start: '2026-09-24', end: '2026-10-02' })!;
    const resumed = removePause(habit, { start: '2026-09-22', end: '2026-10-02' });

    expect(dates('2026-09-22', 10).some((date) => isDueDay(habit, date))).toBe(false);
    // The two became one pause, so removing it brings back every day
    expect(dates('2026-09-22', 10).every((date) => isDueDay(resumed, date))).toBe(true);
  });

  it('rejects a change to a range that ends before the start date', () => {
    expect(changePause(pausedMidWeek(), { start: '2026-09-22', end: '2026-09-25' },
      { start: '2026-09-10', end: '2026-09-12' })).toBeUndefined();
  });

  it('can turn a closed pause into one that stays open', () => {
    const habit = changePause(pausedMidWeek(), { start: '2026-09-22', end: '2026-09-25' }, { start: '2026-09-22' })!;

    expect(isDueDay(habit, '2026-10-30')).toBe(false);
    expect(habit.checkIns.map(({ date }) => date)).toEqual(['2026-09-19', '2026-09-20', '2026-09-21']);
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
    const habit = changeRules(makeHabit({
      checkIns: [checkIn('2026-09-19'), checkIn('2026-09-20'), checkIn('2026-09-21'), checkIn('2026-09-23')]
    }), { schedule: mondayWednesday() }, '2026-09-22');

    expect(getCurrentStreak(habit, '2026-09-24')).toBe(4);
  });
});

describe('strength score', () => {
  const DAILY_HALF_LIFE = 13;

  it('starts at zero', () => {
    expect(getStrengthScore(makeHabit(), '2026-09-25')).toBe(0);
  });

  it('reaches one half after a half-life of done days', () => {
    const doneDays = dates('2026-09-19', DAILY_HALF_LIFE);
    const habit = makeHabit({ checkIns: doneDays.map((date) => checkIn(date)) });

    expect(getStrengthScore(habit, doneDays[doneDays.length - 1])).toBeCloseTo(0.5, 10);
  });

  it('is lowered by a missed day but not by an open today', () => {
    const doneDays = dates('2026-09-19', DAILY_HALF_LIFE);
    const habit = makeHabit({ checkIns: doneDays.map((date) => checkIn(date)) });
    const [today, tomorrow] = dates('2026-10-02', 2);

    expect(getStrengthScore(habit, today)).toBeCloseTo(0.5, 10);
    expect(getStrengthScore(habit, tomorrow)).toBeCloseTo(0.5 * 0.5 ** (1 / DAILY_HALF_LIFE), 10);
  });

  it('is unchanged by skips and pauses', () => {
    const withoutGap = makeHabit({ checkIns: [checkIn('2026-09-19'), checkIn('2026-09-20')] });
    const skipped = makeHabit({
      checkIns: [checkIn('2026-09-19'), checkIn('2026-09-20', 'skipped'), checkIn('2026-09-21')]
    });
    const paused = makeHabit({
      pauses: [{ start: '2026-09-20', end: '2026-09-25' }],
      checkIns: [checkIn('2026-09-19'), checkIn('2026-09-25')]
    });

    expect(getStrengthScore(skipped, '2026-09-21')).toBeCloseTo(getStrengthScore(withoutGap, '2026-09-20'), 10);
    expect(getStrengthScore(paused, '2026-09-25')).toBeCloseTo(getStrengthScore(withoutGap, '2026-09-20'), 10);
  });

  it('is raised by bonus check-ins', () => {
    const withoutBonus = makeHabit({ rules: mondayWednesdayRules(), checkIns: [checkIn('2026-09-21')] });
    const withBonus = setCheckIn(withoutBonus, '2026-09-22', { status: 'done' });

    expect(getStrengthScore(withBonus, '2026-09-22')).toBeGreaterThan(getStrengthScore(withoutBonus, '2026-09-22'));
  });

  it('decays per due day, with a shorter half-life for habits that are due less often', () => {
    const weeklyHalfLife = DAILY_HALF_LIFE * Math.sqrt(1 / 7);
    const mondays = dates('2026-09-21', 5, 7);
    const habit = makeHabit({
      rules: [{ effectiveFrom: '2026-09-19', schedule: { type: 'weekdays', days: ['monday'] } }],
      checkIns: mondays.map((date) => checkIn(date))
    });

    expect(getStrengthScore(habit, mondays[4])).toBeCloseTo(1 - 0.5 ** (5 / weeklyHalfLife), 10);
  });
});

describe('measurable habits', () => {
  const atLeast = (amount: number): HabitTarget => ({ direction: 'atLeast', amount });
  const atMost = (amount: number): HabitTarget => ({ direction: 'atMost', amount });
  const makeMeasurable = (target: HabitTarget, overrides: Partial<Habit> = {}) => makeHabit({
    kind: 'measurable',
    unit: 'glasses',
    rules: [{ effectiveFrom: '2026-09-19', schedule: { type: 'daily' }, target }],
    ...overrides
  });
  const multiplier = 0.5 ** (1 / 13);

  it('is created with a unit and a target', () => {
    const habit = createHabit('Water', '', { type: 'daily' }, undefined, { unit: 'glasses', target: atLeast(8) });

    expect(habit.kind).toBe('measurable');
    expect(habit.unit).toBe('glasses');
    expect(habit.rules[0].target).toEqual(atLeast(8));
    expect(createHabit('Read', '').kind).toBe('yesNo');
  });

  it('is done on a day whose amount meets an at-least target', () => {
    const habit = makeMeasurable(atLeast(8), {
      checkIns: [amountCheckIn('2026-09-19', 8), amountCheckIn('2026-09-20', 5)]
    });

    expect(isDayDone(habit, '2026-09-19')).toBe(true);
    expect(isDayDone(habit, '2026-09-20')).toBe(false);
    expect(isDayDone(habit, '2026-09-21')).toBe(false);
  });

  it('counts an empty due day of an at-most habit as zero, so it is done', () => {
    const habit = makeMeasurable(atMost(2), {
      checkIns: [amountCheckIn('2026-09-20', 2), amountCheckIn('2026-09-21', 3)]
    });

    expect(isDayDone(habit, '2026-09-19')).toBe(true);
    expect(isDayDone(habit, '2026-09-20')).toBe(true);
    expect(isDayDone(habit, '2026-09-21')).toBe(false);
  });

  it('does not judge an at-most habit on days that are not due', () => {
    const habit = makeMeasurable(atMost(2), {
      rules: [{ effectiveFrom: '2026-09-19', schedule: mondayWednesday(), target: atMost(2) }],
      checkIns: [amountCheckIn('2026-09-22', 1)]
    });

    expect(isDayDone(habit, '2026-09-22')).toBe(false);
    expect(isDayDone(habit, '2026-09-20')).toBe(false);
  });

  it('is not done on a skipped day', () => {
    const habit = makeMeasurable(atMost(2), { checkIns: [checkIn('2026-09-20', 'skipped')] });

    expect(isDayDone(habit, '2026-09-20')).toBe(false);
  });

  it('judges each day by the target it had', () => {
    const habit = changeRules(
      makeMeasurable(atLeast(8), { checkIns: [amountCheckIn('2026-09-20', 6), amountCheckIn('2026-09-23', 6)] }),
      { schedule: { type: 'daily' }, target: atLeast(6) },
      '2026-09-22'
    );

    expect(habit.rules.map(({ target }) => target)).toEqual([atLeast(8), atLeast(6)]);
    expect(isDayDone(habit, '2026-09-20')).toBe(false);
    expect(isDayDone(habit, '2026-09-23')).toBe(true);
  });

  it('keeps an interval\'s due days when only the target changes', () => {
    const habit = changeRules(
      makeMeasurable(atLeast(8), {
        rules: [{ effectiveFrom: '2026-09-19', schedule: { type: 'interval', intervalDays: 2 }, target: atLeast(8) }]
      }),
      { schedule: { type: 'interval', intervalDays: 2 }, target: atLeast(6) },
      '2026-09-22'
    );

    expect(isDueDay(habit, '2026-09-22')).toBe(false);
    expect(isDueDay(habit, '2026-09-23')).toBe(true);
  });

  it('breaks the streak on partial progress or an amount over the limit, but not today', () => {
    const partial = makeMeasurable(atLeast(8), {
      checkIns: [amountCheckIn('2026-09-19', 8), amountCheckIn('2026-09-20', 5), amountCheckIn('2026-09-21', 8),
        amountCheckIn('2026-09-22', 3)]
    });
    const overLimit = makeMeasurable(atMost(2), { checkIns: [amountCheckIn('2026-09-20', 4)] });

    expect(getCurrentStreak(partial, '2026-09-22')).toBe(1);
    expect(getCurrentStreak(overLimit, '2026-09-22')).toBe(2);
  });

  it('builds a streak on the empty days of an at-most habit', () => {
    expect(getCurrentStreak(makeMeasurable(atMost(2)), '2026-09-22')).toBe(4);
  });

  it('counts partial progress as that fraction of a done day in the score', () => {
    const habit = makeMeasurable(atLeast(8), { checkIns: [amountCheckIn('2026-09-19', 4)] });

    expect(getStrengthScore(habit, '2026-09-20')).toBeCloseTo(0.5 * (1 - multiplier), 10);
  });

  it('lowers the score for an amount over the limit like a missed day', () => {
    const overLimit = makeMeasurable(atMost(2), { checkIns: [amountCheckIn('2026-09-20', 5)] });
    const missedYesNo = makeHabit({ checkIns: [checkIn('2026-09-19'), checkIn('2026-09-21')] });

    expect(getStrengthScore(overLimit, '2026-09-21')).toBeCloseTo(getStrengthScore(missedYesNo, '2026-09-21'), 10);
  });

  it('raises the score by a bonus amount in proportion, and never lowers it', () => {
    const weekdayMultiplier = 0.5 ** (1 / (13 * Math.sqrt(2 / 7)));
    const base = makeMeasurable(atLeast(8), {
      rules: [{ effectiveFrom: '2026-09-19', schedule: mondayWednesday(), target: atLeast(8) }],
      checkIns: [amountCheckIn('2026-09-21', 8)]
    });
    const before = getStrengthScore(base, '2026-09-22');

    expect(getStrengthScore(setCheckIn(base, '2026-09-22', { amount: 4 }), '2026-09-22'))
      .toBeCloseTo(before + (1 - before) * (1 - weekdayMultiplier) * 0.5, 10);
    expect(getStrengthScore(setCheckIn(base, '2026-09-22', { amount: 0 }), '2026-09-22')).toBeCloseTo(before, 10);
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
