import { useHabitronStore } from '../stores/';
import { Habit } from '../types/';
import { canLogHabitOnDate, getLogStatus, getNextLogStatus, isHabitPausedOn } from '../utils/habitUtils';
interface HabitToggleProps {
  habit: Habit;
  date: string;
}

type DisplayStatus = ReturnType<typeof getLogStatus> | 'not-due' | 'paused';

const STATUS_DISPLAY: Record<DisplayStatus, { label: string; symbol: string; classes: string }> = {
  unlogged: { label: 'Open', symbol: '', classes: 'border-2 border-neutral-500 bg-white/40 dark:bg-slate-800/40' },
  completed: { label: 'Done', symbol: '✓', classes: 'bg-orange-400 dark:bg-blue-600 text-black dark:text-white font-bold' },
  skipped: { label: 'Skipped', symbol: '–', classes: 'border-2 border-dashed border-neutral-500 text-neutral-600 dark:text-neutral-300' },
  missed: { label: 'Missed', symbol: '✕', classes: 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200' },
  'not-due': { label: 'Not due', symbol: '·', classes: 'text-neutral-500' },
  paused: { label: 'Paused', symbol: 'Ⅱ', classes: 'text-xs text-neutral-500' }
};

const HabitToggle = ({ habit, date }: HabitToggleProps) => {
  const { getLog, setHabitLog } = useHabitronStore();
  const status = getLogStatus(getLog(habit.id, date));
  const isPaused = isHabitPausedOn(habit, date);
  const canLog = canLogHabitOnDate(habit, date);
  const displayStatus: DisplayStatus = isPaused ? 'paused' : canLog ? status : 'not-due';
  const { label, symbol, classes } = STATUS_DISPLAY[displayStatus];

  return (
    <button
      type='button'
      name={`habitStatus_${habit.id}${date}`}
      aria-label={`${habit.name} on ${date}: ${label}`}
      title={label}
      disabled={!canLog}
      onClick={() => setHabitLog(habit.id, date, getNextLogStatus(status))}
      className={`size-8 justify-self-center rounded-full flex items-center justify-center select-none ${classes}`}
    >
      {symbol}
    </button>
  );

};

export default HabitToggle;
