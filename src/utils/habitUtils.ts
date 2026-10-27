import { addDays, differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import { CheckIn, CheckInValue, Habit, HabitPause, HabitReminder, HabitRules, HabitSchedule, HabitTarget, Weekday } from '../types/';
import {v4 as uuidv4} from 'uuid';
import { DATE_FORMAT_FULL, HISTORY_DAYS_TO_SHOW } from './constants';
import { getToday, getLastNDates } from './dateUtils';

// What makes a habit measurable; without it the habit is a yes/no habit
export interface HabitMeasure {
  unit: string;
  target: HabitTarget;
}

export const createHabit = (
  name: string,
  description: string,
  schedule: HabitSchedule = { type: 'daily' },
  reminder?: HabitReminder,
  measure?: HabitMeasure
) => {
  const today = getToday();
  const newHabit: Habit = {
    id: uuidv4(),
    name,
    description,
    kind: measure ? 'measurable' : 'yesNo',
    ...(measure && { unit: measure.unit }),
    rules: [{ effectiveFrom: today, schedule, ...(measure && { target: measure.target }) }],
    pauses: [],
    reminder,
    startDate: today,
    checkIns: []
  };

  return newHabit;
}

// Rules

const getRulesIndexOn = (habit: Habit, date: string) =>
  habit.rules.reduce((found, version, index) => version.effectiveFrom <= date ? index : found, 0);

// The rules in force on a date; the first version also covers days before it took effect
export const getRulesOn = (habit: Habit, date: string): HabitRules => habit.rules[getRulesIndexOn(habit, date)];

export const getCurrentRules = (habit: Habit): HabitRules => habit.rules[habit.rules.length - 1];

const isSameSchedule = (a: HabitSchedule, b: HabitSchedule) => {
  if (a.type === 'weekdays' && b.type === 'weekdays') {
    return a.days.length === b.days.length && a.days.every((day) => b.days.includes(day));
  }
  if (a.type === 'interval' && b.type === 'interval') return a.intervalDays === b.intervalDays;
  return a.type === b.type;
};

const isSameTarget = (a?: HabitTarget, b?: HabitTarget) =>
  a?.direction === b?.direction && a?.amount === b?.amount;

export type RulesChange = Omit<HabitRules, 'effectiveFrom'>;

const isSameRules = (a: RulesChange, b: RulesChange) =>
  isSameSchedule(a.schedule, b.schedule) && isSameTarget(a.target, b.target);

const toRules = (effectiveFrom: string, { schedule, target }: RulesChange): HabitRules =>
  ({ effectiveFrom, schedule, ...(target && { target }) });

// A schedule or target change applies from today; earlier days keep the rules they had (docs/adr/0001)
export const changeRules = (habit: Habit, change: RulesChange, today: string = getToday()): Habit => {
  const current = getCurrentRules(habit);
  if (isSameRules(current, change)) return habit;

  // A version that has not had a full day yet is replaced rather than kept
  const changedToday = current.effectiveFrom >= today;
  const earlier = changedToday ? habit.rules.slice(0, -1) : habit.rules;
  const previous = earlier[earlier.length - 1];

  if (!previous) return { ...habit, rules: [toRules(current.effectiveFrom, change)] };
  // Changing back on the same day undoes today's change
  if (changedToday && isSameRules(previous, change)) return { ...habit, rules: earlier };
  return { ...habit, rules: [...earlier, toRules(today, change)] };
};

// The day a schedule took effect: the earliest of the consecutive versions that share it, so a
// target change does not restart an interval
const getScheduleAnchor = (habit: Habit, index: number) => {
  const { schedule } = habit.rules[index];
  let first = index;
  while (first > 0 && isSameSchedule(habit.rules[first - 1].schedule, schedule)) first -= 1;
  return habit.rules[first].effectiveFrom;
};

const isScheduleDay = (habit: Habit, date: string) => {
  const index = getRulesIndexOn(habit, date);
  const { schedule } = habit.rules[index];
  if (schedule.type === 'daily') return true;

  const currentDate = parseISO(date);
  if (schedule.type === 'weekdays') {
    const weekday = format(currentDate, 'EEEE').toLowerCase();
    return schedule.days.includes(weekday as Weekday);
  }

  const daysFromAnchor = differenceInCalendarDays(currentDate, parseISO(getScheduleAnchor(habit, index)));
  return ((daysFromAnchor % schedule.intervalDays) + schedule.intervalDays) % schedule.intervalDays === 0;
};

// Pauses

const isPausedIn = (pauses: HabitPause[], date: string) =>
  pauses.some(({ start, end }) => start <= date && (!end || date < end));

export const isHabitPausedOn = (habit: Habit, date: string) => isPausedIn(habit.pauses, date);

export const isHabitPaused = (habit: Habit, today: string = getToday()) =>
  isHabitPausedOn(habit, today);

// Sorts pauses and joins any that overlap or touch, so pauses never overlap
export const mergePauses = (pauses: HabitPause[]): HabitPause[] =>
  [...pauses]
    .sort((a, b) => a.start.localeCompare(b.start))
    .reduce<HabitPause[]>((merged, pause) => {
      const last = merged[merged.length - 1];
      if (!last || (last.end !== undefined && last.end < pause.start)) return [...merged, pause];

      const end = last.end === undefined || pause.end === undefined
        ? undefined
        : (pause.end > last.end ? pause.end : last.end);
      return [...merged.slice(0, -1), end === undefined ? { start: last.start } : { start: last.start, end }];
    }, []);

// A pause cannot cover days before the start date, so a range is cut to start there; undefined when
// no day of the range is left
const clampPause = (habit: Habit, { start, end }: HabitPause): HabitPause | undefined => {
  const clampedStart = start < habit.startDate ? habit.startDate : start;
  if (end === undefined) return { start: clampedStart };
  return end > clampedStart ? { start: clampedStart, end } : undefined;
};

// Pauses the days of a range, which may lie in the past or the future, and removes their check-ins.
// `end` is the first day after the range, or absent for a pause that stays open until resumed.
// Undefined when the range is rejected: it ends before it starts or before the start date
export const pauseDates = (habit: Habit, requested: HabitPause): Habit | undefined => {
  const range = clampPause(habit, requested);
  if (!range) return undefined;

  const pauses = mergePauses([...habit.pauses, range]);
  const checkIns = habit.checkIns.filter(({ date }) => !isPausedIn([range], date));
  return { ...habit, pauses, checkIns };
};

// Pauses never overlap, so a pause is identified by its first day. Removing one brings back its
// due days but not the check-ins it removed
export const removePause = (habit: Habit, pause: HabitPause): Habit =>
  ({ ...habit, pauses: habit.pauses.filter(({ start }) => start !== pause.start) });

// Follows the same rules as pausing a range; undefined when the new range is rejected
export const changePause = (habit: Habit, pause: HabitPause, range: HabitPause): Habit | undefined =>
  pauseDates(removePause(habit, pause), range);

// How many check-ins pausing a range would remove, so the user can confirm first
export const countCheckInsRemovedByPause = (habit: Habit, requested: HabitPause) => {
  const range = clampPause(habit, requested);
  return range ? habit.checkIns.filter(({ date }) => isPausedIn([range], date)).length : 0;
};

// Pauses from today until resumed
export const pauseHabit = (habit: Habit, today: string = getToday()): Habit => {
  if (isHabitPausedOn(habit, today)) return habit;
  return pauseDates(habit, { start: today }) ?? habit;
};

export const resumeHabit = (habit: Habit, today: string = getToday()): Habit => {
  const pauses = habit.pauses.flatMap((pause) => {
    if (pause.end && pause.end <= today) return [pause];
    // A pause that has not started yet (e.g. paused and resumed on the same day) leaves no trace
    if (pause.start >= today) return [];
    return [{ ...pause, end: today }];
  });
  return { ...habit, pauses };
};

// Archiving

export const isHabitArchived = (habit: Habit) => habit.archivedOn !== undefined;

export const archiveHabit = (habit: Habit, today: string = getToday()): Habit =>
  isHabitArchived(habit) ? habit : { ...habit, archivedOn: today };

// The archived period becomes a pause, so those days stay without due days after restoring
export const restoreHabit = (habit: Habit, today: string = getToday()): Habit => {
  const { archivedOn, ...restored } = habit;
  if (archivedOn === undefined) return habit;

  const pauses = archivedOn < today
    ? mergePauses([...habit.pauses, { start: archivedOn, end: today }])
    : habit.pauses;
  return { ...restored, pauses };
};

// Due days

const isArchivedOn = (habit: Habit, date: string) =>
  habit.archivedOn !== undefined && date >= habit.archivedOn;

// Whether the date would be a due day if the habit had started by then
const wouldBeDue = (habit: Habit, date: string) =>
  !isHabitPausedOn(habit, date)
    && !isArchivedOn(habit, date)
    && isScheduleDay(habit, date);

export const isDueDay = (habit: Habit, date: string) =>
  date >= habit.startDate && wouldBeDue(habit, date);

// Check-ins

export const getCheckIn = (habit: Habit, date: string): CheckIn | undefined =>
  habit.checkIns.find((checkIn) => checkIn.date === date);

export const getCheckInAmount = (checkIn?: CheckIn) =>
  checkIn && 'amount' in checkIn ? checkIn.amount : undefined;

export const isSkipped = (checkIn?: CheckIn) =>
  checkIn !== undefined && 'status' in checkIn && checkIn.status === 'skipped';

// Archived habits are read-only and paused days take no check-ins. Any other day can: a day that is
// not due takes a bonus check-in, and a day before the start date backfills history
export const canCheckIn = (habit: Habit, date: string) =>
  !isHabitArchived(habit) && !isHabitPausedOn(habit, date);

// Only a day that would be due can be skipped
export const canSkip = (habit: Habit, date: string) => wouldBeDue(habit, date);

// Records a check-in, or clears it with null; checking in before the start date moves it back
export const setCheckIn = (habit: Habit, date: string, value: CheckInValue | null): Habit => {
  const checkIns = habit.checkIns.filter((checkIn) => checkIn.date !== date);
  if (!value) return { ...habit, checkIns };

  const startDate = date < habit.startDate ? date : habit.startDate;
  return { ...habit, startDate, checkIns: [...checkIns, { date, ...value }] };
};

// Tapping a yes/no habit's day cycles Open -> Done -> Skip -> Open
export const getNextCheckIn = (habit: Habit, date: string): CheckInValue | null => {
  const checkIn = getCheckIn(habit, date);
  if (!checkIn) return { status: 'done' };
  if (!isSkipped(checkIn) && canSkip(habit, date)) return { status: 'skipped' };
  return null;
};

// Outcomes

// Whether a day meets the habit. A measurable habit meets its target in force that day; an at-most
// habit is only judged on due days, where an empty day counts as zero
export const isDayDone = (habit: Habit, date: string) => {
  const checkIn = getCheckIn(habit, date);
  if (isSkipped(checkIn)) return false;

  const { target } = getRulesOn(habit, date);
  if (!target) return checkIn !== undefined;

  const amount = getCheckInAmount(checkIn) ?? 0;
  if (target.direction === 'atLeast') return amount >= target.amount;
  return isDueDay(habit, date) && amount <= target.amount;
};

// How far a day goes towards done, from 0 to 1, with partial progress counting in proportion;
// undefined when the day is skipped
const getDayValue = (habit: Habit, date: string, checkIn?: CheckIn) => {
  if (isSkipped(checkIn)) return undefined;

  const { target } = getRulesOn(habit, date);
  if (!target) return checkIn ? 1 : 0;

  const amount = getCheckInAmount(checkIn) ?? 0;
  if (target.direction === 'atLeast') return Math.min(amount / target.amount, 1);
  return amount <= target.amount ? 1 : 0;
};

// Progress

export const getCurrentStreak = (habit: Habit, referenceDate: string = getToday()) => {
  const getPreviousDate = (date: string) => format(subDays(parseISO(date), 1), DATE_FORMAT_FULL);
  let streak = 0;

  for (let date = referenceDate; date >= habit.startDate; date = getPreviousDate(date)) {
    if (!isDueDay(habit, date)) continue;

    if (isDayDone(habit, date)) {
      streak += 1;
    } else if (isSkipped(getCheckIn(habit, date))) {
      continue;
    } else if (date !== referenceDate) {
      // A failed earlier day ends the streak; today stays open until the day is over
      break;
    }
  }

  return streak;
}

// Due days per calendar day under a schedule
const getDueFrequency = (schedule: HabitSchedule) => {
  if (schedule.type === 'daily') return 1;
  if (schedule.type === 'weekdays') return schedule.days.length / 7;
  return 1 / schedule.intervalDays;
};

// How much of the score survives each counted day. Loop's half-life of 13 * sqrt(frequency) calendar
// days, expressed in due days: 13 due days for a daily habit, about 5 for a weekly one
const getScoreMultiplier = (schedule: HabitSchedule) => {
  const frequency = getDueFrequency(schedule);
  const halfLifeInDueDays = 13 * Math.sqrt(frequency);
  return 0.5 ** (1 / halfLifeInDueDays);
};

// How established a habit is, from 0 to 1, recent days weighing most. Each due day moves the score
// towards its value: 1 when done, 0 when failed, the fraction reached for partial progress. A bonus
// check-in only ever raises it, in proportion to its value. Skips, pauses, days that are not due, and
// a today that is not yet done leave it unchanged
export const getStrengthScore = (habit: Habit, referenceDate: string = getToday()) => {
  const checkInsByDate = new Map(habit.checkIns.map((checkIn) => [checkIn.date, checkIn]));
  const getNextDate = (date: string) => format(addDays(parseISO(date), 1), DATE_FORMAT_FULL);
  let score = 0;

  for (let date = habit.startDate; date <= referenceDate; date = getNextDate(date)) {
    const checkIn = checkInsByDate.get(date);
    const value = getDayValue(habit, date, checkIn);
    if (value === undefined) continue;

    const { schedule, target } = getRulesOn(habit, date);
    const multiplier = getScoreMultiplier(schedule);

    if (isDueDay(habit, date)) {
      if (date === referenceDate && value < 1) continue;
      score = score * multiplier + value * (1 - multiplier);
    } else if (checkIn && target?.direction !== 'atMost') {
      score += (1 - score) * (1 - multiplier) * value;
    }
  }

  return score;
};

export const getActivityCalendarData = (habit: Habit) =>
  getLastNDates(HISTORY_DAYS_TO_SHOW + 1).map((date) => {
    const formattedDate = format(date, DATE_FORMAT_FULL);
    const level = isDayDone(habit, formattedDate) ? 1 : 0;

    return {
      date: formattedDate,
      count: level,
      level
    };
  });
