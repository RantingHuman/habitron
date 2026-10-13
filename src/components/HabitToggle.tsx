import { useHabitronStore } from '../stores/';
import { Habit } from '../types/';
import { getToday } from '../utils/dateUtils';
import { canCheckIn, getCheckIn, getNextCheckInStatus, isDueDay, isHabitPausedOn } from '../utils/habitUtils';
interface HabitToggleProps {
  habit: Habit;
  date: string;
}

type DisplayStatus = 'open' | 'done' | 'bonus' | 'skipped' | 'missed' | 'not-due' | 'paused';

const STATUS_DISPLAY: Record<DisplayStatus, { label: string; symbol: string; classes: string }> = {
  open: { label: 'Open', symbol: '', classes: 'border-2 border-neutral-500 bg-white/40 dark:bg-slate-800/40' },
  done: { label: 'Done', symbol: '✓', classes: 'bg-orange-400 dark:bg-blue-600 text-black dark:text-white font-bold' },
  bonus: { label: 'Bonus', symbol: '✓', classes: 'border-2 border-orange-400 dark:border-blue-500 text-orange-600 dark:text-blue-300 font-bold' },
  skipped: { label: 'Skipped', symbol: '–', classes: 'border-2 border-dashed border-neutral-500 text-neutral-600 dark:text-neutral-300' },
  missed: { label: 'Missed', symbol: '✕', classes: 'border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-300' },
  'not-due': { label: 'Not due', symbol: '·', classes: 'text-neutral-500' },
  paused: { label: 'Paused', symbol: 'Ⅱ', classes: 'text-xs text-neutral-500' }
};

const getDisplayStatus = (habit: Habit, date: string): DisplayStatus => {
  if (isHabitPausedOn(habit, date)) return 'paused';

  const status = getCheckIn(habit, date)?.status;
  const isDue = isDueDay(habit, date);
  if (status === 'done') return isDue ? 'done' : 'bonus';
  if (status === 'skipped') return 'skipped';
  if (!isDue) return 'not-due';
  // A due day that has passed with no check-in is missed
  return date < getToday() ? 'missed' : 'open';
};

const HabitToggle = ({ habit, date }: HabitToggleProps) => {
  const { setCheckIn } = useHabitronStore();
  const { label, symbol, classes } = STATUS_DISPLAY[getDisplayStatus(habit, date)];

  return (
    <button
      type='button'
      name={`habitStatus_${habit.id}${date}`}
      aria-label={`${habit.name} on ${date}: ${label}`}
      title={label}
      disabled={!canCheckIn(habit, date)}
      onClick={() => setCheckIn(habit.id, date, getNextCheckInStatus(habit, date))}
      className={`size-8 justify-self-center rounded-full flex items-center justify-center select-none ${classes}`}
    >
      {symbol}
    </button>
  );

};

export default HabitToggle;
