import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import { CheckIn, CheckInStatus, Habit, HabitPause, HabitReminder, HabitRules, HabitSchedule, Weekday } from '../types/';
import {v4 as uuidv4} from 'uuid';
import { DATE_FORMAT_FULL, HISTORY_DAYS_TO_SHOW } from './constants';
import { getToday, getLastNDates } from './dateUtils';

export const createHabit = (
  name: string,
  description: string,
  schedule: HabitSchedule = { type: 'daily' },
  reminder?: HabitReminder
) => {
  const today = getToday();
  const newHabit: Habit = {
    id: uuidv4(),
    name,
    description,
    rules: [{ effectiveFrom: today, schedule }],
    pauses: [],
    reminder,
    startDate: today,
    checkIns: []
  };

  return newHabit;
}

// Rules

// The rules in force on a date; the first version also covers days before it took effect
export const getRulesOn = (habit: Habit, date: string): HabitRules =>
  habit.rules.reduce((rules, version) => version.effectiveFrom <= date ? version : rules, habit.rules[0]);

export const getCurrentRules = (habit: Habit): HabitRules => habit.rules[habit.rules.length - 1];

const isSameSchedule = (a: HabitSchedule, b: HabitSchedule) => {
  if (a.type === 'weekdays' && b.type === 'weekdays') {
    return a.days.length === b.days.length && a.days.every((day) => b.days.includes(day));
  }
  if (a.type === 'interval' && b.type === 'interval') return a.intervalDays === b.intervalDays;
  return a.type === b.type;
};

// A schedule change applies from today; earlier days keep the schedule they had (docs/adr/0001)
export const changeSchedule = (habit: Habit, schedule: HabitSchedule, today: string = getToday()): Habit => {
  const current = getCurrentRules(habit);
  if (isSameSchedule(current.schedule, schedule)) return habit;

  // A version that has not had a full day yet is replaced rather than kept
  const changedToday = current.effectiveFrom >= today;
  const earlier = changedToday ? habit.rules.slice(0, -1) : habit.rules;
  const previous = earlier[earlier.length - 1];

  if (!previous) return { ...habit, rules: [{ effectiveFrom: current.effectiveFrom, schedule }] };
  // Changing back on the same day undoes today's change
  if (changedToday && isSameSchedule(previous.schedule, schedule)) return { ...habit, rules: earlier };
  return { ...habit, rules: [...earlier, { effectiveFrom: today, schedule }] };
};

const isScheduleDay = ({ schedule, effectiveFrom }: HabitRules, date: string) => {
  if (schedule.type === 'daily') return true;

  const currentDate = parseISO(date);
  if (schedule.type === 'weekdays') {
    const weekday = format(currentDate, 'EEEE').toLowerCase();
    return schedule.days.includes(weekday as Weekday);
  }

  const daysFromAnchor = differenceInCalendarDays(currentDate, parseISO(effectiveFrom));
  return ((daysFromAnchor % schedule.intervalDays) + schedule.intervalDays) % schedule.intervalDays === 0;
};

// Pauses

export const isHabitPausedOn = (habit: Habit, date: string) =>
  habit.pauses.some(({ start, end }) => start <= date && (!end || date < end));

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

export const pauseHabit = (habit: Habit, today: string = getToday()): Habit => {
  if (isHabitPausedOn(habit, today)) return habit;
  return { ...habit, pauses: mergePauses([...habit.pauses, { start: today }]) };
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
    && isScheduleDay(getRulesOn(habit, date), date);

export const isDueDay = (habit: Habit, date: string) =>
  date >= habit.startDate && wouldBeDue(habit, date);

// Check-ins

export const getCheckIn = (habit: Habit, date: string): CheckIn | undefined =>
  habit.checkIns.find((checkIn) => checkIn.date === date);

// Archived habits are read-only and paused days take no check-ins. Any other day can: a day that is
// not due takes a bonus check-in, and a day before the start date backfills history
export const canCheckIn = (habit: Habit, date: string) =>
  !isHabitArchived(habit) && !isHabitPausedOn(habit, date);

// Records a check-in, or clears it with null; checking in before the start date moves it back
export const setCheckIn = (habit: Habit, date: string, status: CheckInStatus | null): Habit => {
  const checkIns = habit.checkIns.filter((checkIn) => checkIn.date !== date);
  if (!status) return { ...habit, checkIns };

  const startDate = date < habit.startDate ? date : habit.startDate;
  return { ...habit, startDate, checkIns: [...checkIns, { date, status }] };
};

// Tapping a day cycles Open -> Done -> Skip -> Open; a day that would not be due cannot be skipped
export const getNextCheckInStatus = (habit: Habit, date: string): CheckInStatus | null => {
  const status = getCheckIn(habit, date)?.status;
  if (!status) return 'done';
  if (status === 'done' && wouldBeDue(habit, date)) return 'skipped';
  return null;
};

// Progress

export const getCurrentStreak = (habit: Habit, referenceDate: string = getToday()) => {
  const statusByDate = new Map(habit.checkIns.map(({ date, status }) => [date, status]));
  const getPreviousDate = (date: string) => format(subDays(parseISO(date), 1), DATE_FORMAT_FULL);
  let streak = 0;

  for (let date = referenceDate; date >= habit.startDate; date = getPreviousDate(date)) {
    if (!isDueDay(habit, date)) continue;

    const status = statusByDate.get(date);
    if (status === 'done') {
      streak += 1;
    } else if (status === 'skipped') {
      continue;
    } else if (date !== referenceDate) {
      // A missed earlier day ends the streak; today stays open until the day is over
      break;
    }
  }

  return streak;
}

export const getActivityCalendarData = (habit: Habit) => {
  const statusByDate = new Map(habit.checkIns.map(({ date, status }) => [date, status]));

  return getLastNDates(HISTORY_DAYS_TO_SHOW + 1).map((date) => {
    const formattedDate = format(date, DATE_FORMAT_FULL);
    const level = statusByDate.get(formattedDate) === 'done' ? 1 : 0;

    return {
      date: formattedDate,
      count: level,
      level
    };
  });
}
