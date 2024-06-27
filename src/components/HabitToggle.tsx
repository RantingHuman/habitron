import { Habit } from '../types/';
import { createLog } from '../utils/habitUtils';
import { getLogData, addLogData, updateLogData } from '../utils/manifestUtils';
import { useEffect, useState } from 'react';
interface HabitToggleProps {
  habit: Habit;
  date: string;
}

const HabitToggle = ({ habit, date }: HabitToggleProps) => {
  const [log, setLog] = useState(createLog(habit, date));
  useEffect(() => {
    loadLog(habit, date);
  }, [habit, date]);

  const loadLog = async (habit: Habit, date: string) => {
    const log = await getLogData(habit, date);
    if (log && log.length > 0) {      
      setLog(log[0]);
    }
  }
  const isCompleted = log.completed;

  const handleToggle = () => {
    log.completed = !log.completed;
    if(log.id == -1) {
      addLogData(log);
    } else {
      updateLogData(log);
    }
  };

  return (
    <div className='text-center'>
      <input name={`habitToggle_${habit.id}${date}`} type="checkbox" checked={isCompleted} onChange={handleToggle} className="h-6 w-6" />
    </div>
  );

};

export default HabitToggle;