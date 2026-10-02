import { Habit } from '../types/';
import HabitToggle from './HabitToggle';
import { NavLink } from 'react-router-dom';
import { format } from 'date-fns';
import { DATE_FORMAT_FULL, HOME_GRID_COLUMNS } from '../utils/constants';
import { getCurrentStreak } from '../utils/habitUtils';

interface HabitListItemProps {
  habit: Habit;
  dates: Date[];
}

const HabitListItem = ({ habit, dates }: HabitListItemProps) => {
  const formattedDates = dates.map((date) => format(date, DATE_FORMAT_FULL));
  return (
    <li className={`${HOME_GRID_COLUMNS} dark:bg-slate-700 bg-amber-200 odd:bg-amber-100 dark:odd:bg-slate-600 p-2 border-x border-black last:rounded-b-md last:border-b`}>
      <div className='col-span-7 sm:col-span-1 min-w-0'>
        <NavLink to={`/view-habit/${habit.id}`} className='flex items-baseline gap-2 sm:block'>
          <span className='truncate sm:whitespace-normal sm:line-clamp-2 sm:break-words'>{habit.name}</span>
          <span className='shrink-0 text-xs sm:block'>Streak: {getCurrentStreak(habit)}</span>
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