import { useState } from 'react';
import { useHabitronStore } from '../stores/';
import { Habit } from '../types/';
import { getToday } from '../utils/dateUtils';
import { formatAmount } from '../utils/formatUtils';
import {
  canCheckIn,
  getCheckIn,
  getCheckInAmount,
  getNextCheckIn,
  getRulesOn,
  isDayDone,
  isDueDay,
  isHabitPausedOn,
  isSkipped
} from '../utils/habitUtils';
import AmountDialog from './dialogs/AmountDialog';

interface HabitToggleProps {
  habit: Habit;
  date: string;
}

type DisplayStatus = 'open' | 'done' | 'partial' | 'over-limit' | 'bonus' | 'skipped' | 'missed' | 'not-due' | 'paused';

const STATUS_DISPLAY: Record<DisplayStatus, { label: string; symbol: string; classes: string }> = {
  open: { label: 'Open', symbol: '', classes: 'border-2 border-neutral-500 bg-white/40 dark:bg-slate-800/40' },
  done: { label: 'Done', symbol: '✓', classes: 'bg-orange-400 dark:bg-blue-600 text-black dark:text-white font-bold' },
  partial: { label: 'Partial', symbol: '', classes: 'border-2 border-orange-400 dark:border-blue-500 text-orange-700 dark:text-blue-300 font-bold' },
  'over-limit': { label: 'Over the limit', symbol: '', classes: 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 font-bold' },
  bonus: { label: 'Bonus', symbol: '✓', classes: 'border-2 border-orange-400 dark:border-blue-500 text-orange-600 dark:text-blue-300 font-bold' },
  skipped: { label: 'Skipped', symbol: '–', classes: 'border-2 border-dashed border-neutral-500 text-neutral-600 dark:text-neutral-300' },
  missed: { label: 'Missed', symbol: '✕', classes: 'border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-300' },
  'not-due': { label: 'Not due', symbol: '·', classes: 'text-neutral-500' },
  paused: { label: 'Paused', symbol: 'Ⅱ', classes: 'text-xs text-neutral-500' }
};

const getDisplayStatus = (habit: Habit, date: string): DisplayStatus => {
  if (isHabitPausedOn(habit, date)) return 'paused';

  const checkIn = getCheckIn(habit, date);
  if (isSkipped(checkIn)) return 'skipped';

  const isDue = isDueDay(habit, date);
  const isDone = isDayDone(habit, date);
  const target = getRulesOn(habit, date).target;
  if (!isDue) {
    if (!checkIn) return 'not-due';
    if (isDone) return 'bonus';
    // A bonus amount short of an at-least target; at-most habits are not judged on days that are not due
    return target?.direction === 'atLeast' ? 'partial' : 'not-due';
  }
  if (isDone) return 'done';
  if (checkIn) return target?.direction === 'atMost' ? 'over-limit' : 'partial';
  // A due day that has passed with no check-in is missed
  return date < getToday() ? 'missed' : 'open';
};

const HabitToggle = ({ habit, date }: HabitToggleProps) => {
  const { setCheckIn } = useHabitronStore();
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const status = getDisplayStatus(habit, date);
  const { label, symbol, classes } = STATUS_DISPLAY[status];

  // A measurable habit shows its amount; an at-most habit's empty due day counts as zero
  const isMeasurable = habit.kind === 'measurable';
  const amount = getCheckInAmount(getCheckIn(habit, date)) ?? (isMeasurable && status === 'done' ? 0 : undefined);
  const text = amount === undefined ? symbol : formatAmount(amount);
  const description = amount === undefined ? label : `${label}, ${formatAmount(amount)} ${habit.unit ?? ''}`.trim();

  const handleClick = () => {
    if (isMeasurable) setIsEditingAmount(true);
    else setCheckIn(habit.id, date, getNextCheckIn(habit, date));
  };

  return (
    <>
      <button
        type='button'
        name={`habitStatus_${habit.id}${date}`}
        aria-label={`${habit.name} on ${date}: ${description}`}
        title={description}
        disabled={!canCheckIn(habit, date)}
        onClick={handleClick}
        className={`size-8 justify-self-center rounded-full flex items-center justify-center select-none ${text.length > 2 ? 'text-[10px]' : ''} ${classes}`}
      >
        {text}
      </button>
      {isEditingAmount && <AmountDialog habit={habit} date={date} onClose={() => setIsEditingAmount(false)} />}
    </>
  );

};

export default HabitToggle;
