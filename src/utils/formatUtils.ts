import { format, parseISO } from 'date-fns';
import { HabitTarget } from '../types/';

// Whole numbers as they are, others to one decimal place
export const formatAmount = (amount: number) => String(Number(amount.toFixed(1)));

export const formatTarget = ({ direction, amount }: HabitTarget, unit = '') =>
  `${direction === 'atLeast' ? 'At least' : 'At most'} ${formatAmount(amount)} ${unit}`.trim();

export const formatDayLabel = (date: string) => format(parseISO(date), 'EEE, MMM d');
