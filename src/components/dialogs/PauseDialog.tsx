import { FormEvent, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import Button from '../buttons/Button';
import ValidationError from './ValidationError';
import { useHabitronStore } from '../../stores';
import { Habit, HabitPause } from '../../types/';
import { changePause, countCheckInsRemovedByPause, pauseDates } from '../../utils/habitUtils';
import { getToday } from '../../utils/dateUtils';
import { DATE_FORMAT_FULL } from '../../utils/constants';

interface PauseDialogProps {
  habit: Habit;
  // The pause being changed; absent when adding one
  pause?: HabitPause;
  onClose: () => void;
}

// A pause ends on the day the habit resumed, while the form asks for the last paused day
const shiftDay = (date: string, days: number) =>
  format(addDays(parseISO(date), days), DATE_FORMAT_FULL);

const REJECTED_MESSAGE = 'Pick an Until on or after From, and on or after the habit\'s start date.';

// Pauses a range of dates, or changes an existing pause, confirming first when check-ins would be removed
const PauseDialog = ({ habit, pause, onClose }: PauseDialogProps) => {
  const { updateHabit } = useHabitronStore();
  const [from, setFrom] = useState(pause?.start ?? getToday());
  const [until, setUntil] = useState(pause?.end ? shiftDay(pause.end, -1) : '');
  const [error, setError] = useState('');
  const [removedCount, setRemovedCount] = useState(0);

  const range: HabitPause = until ? { start: from, end: shiftDay(until, 1) } : { start: from };
  const apply = () => pause ? changePause(habit, pause, range) : pauseDates(habit, range);

  const save = () => {
    const updated = apply();
    if (updated) updateHabit(updated);
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!from || !apply()) {
      setError(REJECTED_MESSAGE);
      return;
    }
    const count = countCheckInsRemovedByPause(habit, range);
    if (count > 0) setRemovedCount(count);
    else save();
  };

  return (
    <div role='dialog' aria-modal='true' aria-label={pause ? 'Change pause' : 'Pause dates'}
      className='fixed inset-0 bg-black bg-opacity-80 z-50 px-4'>
      <form onSubmit={handleSubmit}
        className='p-4 rounded-md w-full max-w-sm mx-auto mt-20 border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 border-2'>
        <h2 className='text-lg font-semibold'>{pause ? 'Change pause' : 'Pause dates'}</h2>
        {removedCount > 0 ? (
          <>
            <p className='mt-2'>
              This removes {removedCount} {removedCount === 1 ? 'check-in' : 'check-ins'} on the paused days.
              They don't come back if the pause is changed or removed later.
            </p>
            <div className='flex justify-end gap-3 mt-4'>
              <Button name='cancel' type='button' appearance='secondary' onClick={() => setRemovedCount(0)}>Back</Button>
              <Button name='confirm' type='button' appearance='danger' onClick={save}>Pause</Button>
            </div>
          </>
        ) : (
          <>
            <label className='block mt-4'>
              From
              <input name='pause-from' type='date' required value={from} className='block mt-1 w-full rounded-md'
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
