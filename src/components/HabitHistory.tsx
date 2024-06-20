// WIP
// TODO: Handle unlogged days
import { Habit } from '../types/';
import HabitActivityCalendar from './HabitActivityCalendar';

interface HabitHistoryProps {
  habit: Habit;  
}

const HabitHistory = ({ habit }: HabitHistoryProps) => {
  return (
    <div>
      <h1>History</h1>
      <HabitActivityCalendar habit={habit}/>
    </div>
  )
};

export default HabitHistory;