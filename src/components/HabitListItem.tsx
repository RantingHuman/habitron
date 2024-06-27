import { Habit } from '../types/';
import HabitToggle from './HabitToggle';
import { getLastNDates } from '../utils/dateUtils';
import { HOME_DAYS_TO_SHOW } from '../utils/constants';
import { NavLink } from 'react-router-dom';
import { useMemo } from 'react';

interface HabitListItemProps {
  habit: Habit;
}

const HabitListItem = ({ habit }: HabitListItemProps) => {
  const lastNDates = useMemo(() => getLastNDates(HOME_DAYS_TO_SHOW), []);

  return (
    <li className='grid grid-cols-7 dark:bg-slate-700 bg-amber-200 odd:bg-amber-100  dark:odd:bg-slate-600 p-2 last:rounded-b-md'>
      <div className='col-span-3 truncate'>
        <NavLink to={`/view-habit/${habit.id}`}>
          {habit.name}
        </NavLink>
      </div>
      {
        // Render a HabitToggle component for each of the last N dates
        lastNDates.map((date) => (
          <HabitToggle key={`${date}-${habit.id}`} habit={habit} date={date} />
        ))
      }
    </li>
  );

};

export default HabitListItem;