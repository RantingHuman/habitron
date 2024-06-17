// WIP
// TODO: Handle unlogged days
import { Habit } from '../types/';

interface HabitHistoryProps {
  habit: Habit;  
}

const HabitHistory = ({ habit }: HabitHistoryProps) => {
  return (
    <div>
      <h1>History</h1>
      <ul className='grid grid-cols-7 gap-1'>
        {
          habit.completionHistory.map((log) => (
            <li key={log.id} className={(log.completed ? 'bg-blue-500' : '') + ' aspect-square border'}>
              
            </li>
          ))
        }
      </ul>
    </div>
  );
};

export default HabitHistory;