import { FormEvent, useState } from 'react';
import Button from '../buttons/Button';
import { useHabitronStore } from '../../stores';
import { Habit } from '../../types/';
import { canSkip, getCheckIn, getCheckInAmount, getRulesOn, isSkipped } from '../../utils/habitUtils';
import { formatDayLabel, formatTarget } from '../../utils/formatUtils';

interface AmountDialogProps {
  habit: Habit;
  date: string;
  onClose: () => void;
}

// Records the amount for one day of a measurable habit, or skips or clears that day
const AmountDialog = ({ habit, date, onClose }: AmountDialogProps) => {
  const { setCheckIn } = useHabitronStore();
  const checkIn = getCheckIn(habit, date);
  const currentAmount = getCheckInAmount(checkIn);
  const [amount, setAmount] = useState(currentAmount === undefined ? '' : String(currentAmount));
  const { target } = getRulesOn(habit, date);
  const parsedAmount = Number(amount);
  const isValid = amount.trim() !== '' && Number.isFinite(parsedAmount) && parsedAmount >= 0;

  const close = (value: Parameters<typeof setCheckIn>[2] | undefined) => {
    if (value !== undefined) setCheckIn(habit.id, date, value);
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isValid) close({ amount: parsedAmount });
  };

  return (
    <div role='dialog' aria-modal='true' aria-label={`${habit.name} on ${formatDayLabel(date)}`}
      className='fixed inset-0 bg-black bg-opacity-80 z-50 px-4'>
      <form onSubmit={handleSubmit}
        className='p-4 rounded-md w-full max-w-sm mx-auto mt-20 border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 border-2'>
        <h2 className='text-lg font-semibold'>{habit.name}</h2>
        <p className='text-sm'>{formatDayLabel(date)}{target && ` · ${formatTarget(target, habit.unit)}`}</p>
        <label className='flex items-center gap-2 mt-4'>
          <input
            name='check-in-amount'
            aria-label='Amount'
            type='number'
            inputMode='decimal'
            min='0'
            step='any'
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className='w-28 rounded-md'
          />
          {habit.unit}
        </label>
        <div className='flex flex-wrap justify-end gap-3 mt-4'>
          {checkIn && <Button name='clear' type='button' appearance='transparent' onClick={() => close(null)}>Clear</Button>}
          {canSkip(habit, date) && !isSkipped(checkIn) && (
            <Button name='skip' type='button' appearance='secondary' onClick={() => close({ status: 'skipped' })}>Skip</Button>
          )}
          <Button name='cancel' type='button' appearance='secondary' onClick={() => close(undefined)}>Cancel</Button>
          <Button name='save' appearance='primary' type='submit'>Save</Button>
        </div>
      </form>
    </div>
  );
};

export default AmountDialog;
