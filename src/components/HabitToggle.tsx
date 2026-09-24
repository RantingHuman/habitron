import { ChangeEvent } from 'react';
import { useHabitronStore } from '../stores/';
import { Habit, LogStatus } from '../types/';
import { getLogStatus, isHabitScheduledForDate } from '../utils/habitUtils';
interface HabitToggleProps {
  habit: Habit;
  date: string;
}

const HabitToggle = ({ habit, date }: HabitToggleProps) => {
  const { getLog, setHabitLog } = useHabitronStore();
  const log = getLog(habit.id, date);
  const status = getLogStatus(log);
  const isScheduled = isHabitScheduledForDate(habit, date);
  const isPaused = habit.status === 'paused';
  const displayStatus = isPaused ? 'paused' : isScheduled ? status : 'not-due';

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = event.target.value;
    if (nextStatus === 'unlogged') {
      setHabitLog(habit.id, date, null);
    } else if (nextStatus === 'completed' || nextStatus === 'skipped' || nextStatus === 'missed') {
      setHabitLog(habit.id, date, nextStatus as LogStatus);
    }
  };

  return (
    <div className='text-center'>
      <select
        name={`habitStatus_${habit.id}${date}`}
        aria-label={`${habit.name} on ${date}`}
        value={displayStatus}
        disabled={!isScheduled || isPaused}
        onChange={handleStatusChange}
        className='h-7 max-w-full rounded-md px-1 text-xs shadow-sm shadow-neutral-800/20'
      >
        <option value='unlogged'>Open</option>
        <option value='completed'>Done</option>
        <option value='skipped'>Skip</option>
        <option value='missed'>Missed</option>
        <option value='not-due'>Not due</option>
        <option value='paused'>Paused</option>
      </select>
    </div>
  );

};

export default HabitToggle;