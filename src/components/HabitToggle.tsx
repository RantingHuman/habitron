import { useHabitronStore } from '../stores/';
import { Habit } from '../types/';
import { createLog } from '../utils/habitUtils';
interface HabitToggleProps {
  habit: Habit;
  date: string;
}

const HabitToggle = ({ habit, date }: HabitToggleProps) => {
  const { toggleHabitCompletion, getLog } = useHabitronStore();
  const log = getLog(habit.id, date) || createLog(date);
  const isCompleted = log.completed;

  const handleToggle = () => {
    toggleHabitCompletion(habit, log);
  };

  return (
    <div className='text-center'>
      <input name={`habitToggle_${habit.id}${date}`} type="checkbox" 
      checked={isCompleted} 
      onChange={handleToggle} 
      className="h-6 w-6 rounded-md text-orange-400 dark:text-blue-700 border-0 shadow-sm shadow-neutral-800/20 active:shadow-inner transition ease-in-out" />
    </div>
  );

};

export default HabitToggle;