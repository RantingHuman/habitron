// WIP
// TODO: Handle unlogged days
import { Habit } from '../types/';
import HabitActivityCalendar from './HabitActivityCalendar';
import Card from './Card';

interface HabitHistoryProps {
  habit: Habit;  
}

const HabitHistory = ({ habit }: HabitHistoryProps) => {
  return (
    <Card header='History'>
      <HabitActivityCalendar habit={habit}/>
    </Card>
  )
};

export default HabitHistory;