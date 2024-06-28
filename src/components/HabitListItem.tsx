import { Habit } from '../types/';
import HabitToggle from './HabitToggle';
import { NavLink } from 'react-router-dom';
import { format } from 'date-fns';
import { DATE_FORMAT_FULL } from '../utils/constants';

interface HabitListItemProps {
  habit: Habit;
  dates: Date[];
}

const HabitListItem = ({ habit, dates }: HabitListItemProps) => {
  const formattedDates = dates.map((date) => format(date, DATE_FORMAT_FULL));
  return (
    <li className='grid grid-cols-7 dark:bg-slate-700 bg-amber-200 odd:bg-amber-100  dark:odd:bg-slate-600 p-2 border-x border-black last:rounded-b-md last:border-b'>
      <div className='col-span-3 truncate'>
        <NavLink to={`/view-habit/${habit.id}`}>
          {habit.name}
        </NavLink>
      </div>
      {
        // Render a HabitToggle component for each of the last N dates
        formattedDates.map((date) => (
          <HabitToggle key={`${date}-${habit.id}`} habit={habit} date={date} />
        ))
      }
    </li>
  );

};

export default HabitListItem;