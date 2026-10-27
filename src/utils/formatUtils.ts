import { format, parseISO } from 'date-fns';
import { HabitPause, HabitTarget } from '../types/';
import { getLastPausedDay } from './habitUtils';
import { getToday } from './dateUtils';

// Whole numbers as they are, others to one decimal place
export const formatAmount = (amount: number) => String(Number(amount.toFixed(1)));

export const formatTarget = ({ direction, amount }: HabitTarget, unit = '') =>
  `${direction === 'atLeast' ? 'At least' : 'At most'} ${formatAmount(amount)} ${unit}`.trim();

export const formatDayLabel = (date: string) => format(parseISO(date), 'EEE, MMM d');

const formatDayLabelWithYear = (date: string) => format(parseISO(date), 'EEE, MMM d, yyyy');

// Shows the year when the range is not all in the current year
export const formatPauseRange = (pause: HabitPause, today: string = getToday()) => {
  const lastDay = getLastPausedDay(pause);
  const year = today.slice(0, 4);
  const withYear = [pause.start, lastDay].some((date) => date !== undefined && date.slice(0, 4) !== year);
  const label = withYear ? formatDayLabelWithYear : formatDayLabel;
  return lastDay ? `${label(pause.start)} – ${label(lastDay)}` : `From ${label(pause.start)}, until resumed`;
};
