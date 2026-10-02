import { addDays, differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import { Habit, HabitReminder, HabitSchedule, LegacyHabit, Log, LogStatus, Weekday } from '../types/';
import {v4 as uuidv4} from 'uuid';
import { DATE_FORMAT_FULL, LEGACY_DAILY_FREQUENCY, HISTORY_DAYS_TO_SHOW, WEEKDAY_FREQUENCIES } from './constants';
import { getToday, getCurrentTimestamp, getLastNDates } from './dateUtils';

const isWeekday = (value: string): value is Weekday =>
  WEEKDAY_FREQUENCIES.some(({ value: weekday }) => weekday === value);

const getScheduleFromLegacyFrequency = (frequency: string[] = []): HabitSchedule => {
  if (frequency.length === 0 || frequency.includes(LEGACY_DAILY_FREQUENCY)) return { type: 'daily' };

  const days = frequency.filter(isWeekday);
  return days.length > 0 ? { type: 'weekdays', days } : { type: 'daily' };
};

const getLegacyPauseStart = (legacyHabit: LegacyHabit) => {
  // Earlier versions stored only a paused flag, so assume the pause began after the last logged day
  const lastLoggedDate = legacyHabit.completionHistory
    .map((log) => log.date)
    .reduce((latest, date) => date > latest ? date : latest, '');
  const start = lastLoggedDate
    ? format(addDays(parseISO(lastLoggedDate), 1), DATE_FORMAT_FULL)
    : legacyHabit.startDate;
  const today = getToday();
  if (start > today) return today;
  return start < legacyHabit.startDate ? legacyHabit.startDate : start;
};

// Converts a habit saved by an earlier version: `frequency` becomes a schedule, interval schedules get
// an anchor, a paused `status` becomes an open pause period, and `streak` is dropped (it is computed)
export const migrateLegacyHabit = (legacyHabit: LegacyHabit | Habit): Habit => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { frequency, streak, status, schedule: legacySchedule, pauses, ...habit } = legacyHabit as LegacyHabit;
  const schedule = legacySchedule ?? getScheduleFromLegacyFrequency(frequency);

  return {
    ...habit,
    schedule: schedule.type === 'interval'
      ? { ...schedule, anchorDate: schedule.anchorDate ?? habit.startDate }
      : schedule,
    pauses: pauses ?? (status === 'paused' ? [{ start: getLegacyPauseStart(legacyHabit as LegacyHabit) }] : [])
  };
};

export const createHabit = (
  name: string,
  description: string,
  schedule: HabitSchedule = { type: 'daily' },
  reminder?: HabitReminder
) => {
  const newHabit: Habit = {
    id: uuidv4(),
    name,
    description,
    schedule,
    pauses: [],
    reminder,
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
    completed,
    status: completed ? 'completed' : 'missed'
  };

  return newLog;
}

export const getLogStatus = (log?: Log): LogStatus | 'unlogged' => {
  if (!log) return 'unlogged';
  if (log.status) return log.status;
  return log.completed ? 'completed' : 'missed';
};

export const isHabitPausedOn = (habit: Habit, date: string) =>
  habit.pauses.some(({ start, end }) => start <= date && (!end || date < end));

export const isHabitPaused = (habit: Habit, today: string = getToday()) =>
  isHabitPausedOn(habit, today);

export const pauseHabit = (habit: Habit, today: string = getToday()): Habit => {
  if (isHabitPausedOn(habit, today)) return habit;

  // Pausing again on the day it was resumed continues the earlier pause
  const resumedToday = habit.pauses.find(({ end }) => end === today);
  const pauses = resumedToday
    ? habit.pauses.map((pause) => pause === resumedToday ? { start: pause.start } : pause)
    : [...habit.pauses, { start: today }];
  return { ...habit, pauses };
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

const isScheduleDay = (schedule: HabitSchedule, date: string) => {
  if (schedule.type === 'daily') return true;

  const currentDate = parseISO(date);
  if (schedule.type === 'weekdays') {
    const weekday = format(currentDate, 'EEEE').toLowerCase();
    return schedule.days.includes(weekday as Weekday);
  }

  const daysFromAnchor = differenceInCalendarDays(currentDate, parseISO(schedule.anchorDate));
  return ((daysFromAnchor % schedule.intervalDays) + schedule.intervalDays) % schedule.intervalDays === 0;
};

// Tapping a day cycles Open -> Done -> Skip -> Missed -> Open; null clears the log
const LOG_STATUS_CYCLE: Array<LogStatus | null> = [null, 'completed', 'skipped', 'missed'];

export const getNextLogStatus = (status: LogStatus | 'unlogged'): LogStatus | null => {
  const index = LOG_STATUS_CYCLE.indexOf(status === 'unlogged' ? null : status);
  return LOG_STATUS_CYCLE[(index + 1) % LOG_STATUS_CYCLE.length];
};

export const isHabitScheduledForDate = (habit: Habit, date: string) =>
  date >= habit.startDate
    && !isHabitPausedOn(habit, date)
    && isScheduleDay(habit.schedule, date);

// Days before the start date can still be logged, so history can be backfilled
export const canLogHabitOnDate = (habit: Habit, date: string) =>
  !isHabitPausedOn(habit, date) && isScheduleDay(habit.schedule, date);

// Keeps the interval anchor when the interval is unchanged, otherwise restarts the pattern today
export const anchorSchedule = (
  schedule: HabitSchedule,
  previousSchedule?: HabitSchedule,
  today: string = getToday()
): HabitSchedule => {
  if (schedule.type !== 'interval') return schedule;

  const keepAnchor = previousSchedule?.type === 'interval'
    && previousSchedule.intervalDays === schedule.intervalDays;
  return { ...schedule, anchorDate: keepAnchor ? previousSchedule.anchorDate : today };
};

export const getCurrentStreak = (habit: Habit, referenceDate: string = getToday()) => {
  const statusByDate = new Map(
    habit.completionHistory.map((log) => [log.date, getLogStatus(log)])
  );
  const getPreviousDate = (date: string) => format(subDays(parseISO(date), 1), DATE_FORMAT_FULL);
  let streak = 0;

  for (let date = referenceDate; date >= habit.startDate; date = getPreviousDate(date)) {
    if (!isHabitScheduledForDate(habit, date)) continue;

    const status = statusByDate.get(date) ?? 'unlogged';
    if (status === 'completed') {
      streak += 1;
    } else if (status === 'skipped') {
      continue;
    } else if (!(date === referenceDate && status === 'unlogged')) {
      // A missed or unlogged earlier day ends the streak; today stays open until the day is over
      break;
    }
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
    const level = getLogStatus(log) === 'completed' ? 1 : 0;

    return {
      date: formattedDate,
      count: level,
      level
    };
  });
}