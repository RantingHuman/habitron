import { Habit } from '../types/';
import HabitToggle from './HabitToggle';
import { getLastNDates } from '../utils/dateUtils';
import { DAYS_TO_SHOW } from '../utils/constants';
import { NavLink } from 'react-router-dom';

interface HabitListItemProps {
  habit: Habit;
}

const HabitListItem = ({ habit }: HabitListItemProps) => {
  return (
    <div className='grid grid-cols-7 odd:dark:bg-slate-700 odd:bg-slate-300 p-2'>
      <div className='col-span-3 truncate'>
        <NavLink to={'/view-habit/' + habit.id}>
          {habit.name}
        </NavLink>
      </div>
      {
        // Render a HabitToggle component for each of the last N dates
        getLastNDates(DAYS_TO_SHOW).map((date) => (
          <HabitToggle key={date} habit={habit} date={date} />
        ))
      }
    </div>

  );

};

export default HabitListItem;