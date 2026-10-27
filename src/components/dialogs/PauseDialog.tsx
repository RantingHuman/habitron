import { FormEvent, useState } from 'react';
import Button from '../buttons/Button';
import ValidationError from './ValidationError';
import { useHabitronStore } from '../../stores';
import { Habit, HabitPause } from '../../types/';
import { changePause, getLastPausedDay, pauseDates, pauseThrough } from '../../utils/habitUtils';
import { getToday } from '../../utils/dateUtils';
import { formatDayLabel } from '../../utils/formatUtils';

interface PauseDialogProps {
  habit: Habit;
  // The pause being changed; absent when adding one
  pause?: HabitPause;
  onClose: () => void;
}

// The checked change, kept so saving commits exactly what the user confirmed
interface PendingPause {
  updated: Habit;
  removedCount: number;
  // Set when the range started before the start date and was cut to begin there
  clampedTo?: string;
}

// Pauses a range of dates, or changes an existing pause, confirming first when check-ins would be
// removed or the range had to be cut to the start date
const PauseDialog = ({ habit, pause, onClose }: PauseDialogProps) => {
  const { updateHabit } = useHabitronStore();
  const [from, setFrom] = useState(pause?.start ?? getToday());
  const [until, setUntil] = useState(pause ? getLastPausedDay(pause) ?? '' : '');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<PendingPause | null>(null);

  const save = (updated: Habit) => {
    updateHabit(updated);
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!from) return;
    if (until && until < from) {
      setError('Until must not be before From.');
      return;
    }

    const range = pauseThrough(from, until || undefined);
    const updated = pause ? changePause(habit, pause, range) : pauseDates(habit, range);
    if (!updated) {
      setError(`The pause must include a day on or after the habit's start date, ${formatDayLabel(habit.startDate)}.`);
      return;
    }

    // Changing a pause never brings check-ins back, so any drop is what this pause removes
    const removedCount = habit.checkIns.length - updated.checkIns.length;
    const clampedTo = from < habit.startDate ? habit.startDate : undefined;
    if (removedCount > 0 || clampedTo) setPending({ updated, removedCount, clampedTo });
    else save(updated);
  };

  return (
    <div role='dialog' aria-modal='true' aria-label={pause ? 'Change pause' : 'Pause dates'}
      className='fixed inset-0 bg-black bg-opacity-80 z-50 px-4'>
      <form onSubmit={handleSubmit}
        className='p-4 rounded-md w-full max-w-sm mx-auto mt-20 border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 border-2'>
        <h2 className='text-lg font-semibold'>{pause ? 'Change pause' : 'Pause dates'}</h2>
        {pending ? (
          <>
            {pending.clampedTo && (
              <p className='mt-2'>
                The habit starts on {formatDayLabel(pending.clampedTo)}, so the pause starts then.
              </p>
            )}
            {pending.removedCount > 0 && (
              <p className='mt-2'>
                This removes {pending.removedCount} {pending.removedCount === 1 ? 'check-in' : 'check-ins'} on the
                paused days. They don't come back if the pause is changed or removed later.
              </p>
            )}
            <div className='flex justify-end gap-3 mt-4'>
              <Button name='cancel' type='button' appearance='secondary' onClick={() => setPending(null)}>Back</Button>
              <Button name='confirm' type='button' appearance={pending.removedCount > 0 ? 'danger' : 'primary'}
                onClick={() => save(pending.updated)}>Pause</Button>
            </div>
          </>
        ) : (
          <>
            <label className='block mt-4'>
              From
              <input name='pause-from' type='date' required value={from} min={habit.startDate} className='block mt-1 w-full rounded-md'
                onChange={(e) => { setFrom(e.target.value); setError(''); }} />
            </label>
            <label className='block mt-4'>
              Until <span className='text-sm opacity-75'>(optional, last paused day)</span>
              <input name='pause-until' type='date' value={until} min={from} className='block mt-1 w-full rounded-md'
                onChange={(e) => { setUntil(e.target.value); setError(''); }} />
            </label>
            {!until && <p className='mt-1 text-sm'>With no Until, the habit stays paused until you resume it.</p>}
            {error && <ValidationError message={error} />}
            <div className='flex justify-end gap-3 mt-4'>
              <Button name='cancel' type='button' appearance='secondary' onClick={onClose}>Cancel</Button>
              <Button name='save' type='submit' appearance='primary'>Save</Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default PauseDialog;
