import { format } from 'date-fns';
import { DATE_FORMAT_FULL, DATE_FORMAT_MON_DAY, HOME_GRID_COLUMNS } from '../utils/constants';

interface HabitListHeaderProps {
  dates: Date[];
  today: string;
  onOlder: () => void;
  // Omitted when already showing the current week
  onNewer?: () => void;
}

const navButtonClasses = 'size-8 rounded-md text-xl leading-none disabled:opacity-30 hover:opacity-80';

const HabitListHeader = ({ dates, today, onOlder, onNewer }: HabitListHeaderProps) => {
  const range = `${format(dates[0], DATE_FORMAT_MON_DAY)} – ${format(dates[dates.length - 1], DATE_FORMAT_MON_DAY)}`;

  return (
    <div className="dark:bg-slate-800 bg-amber-300 p-2 rounded-t-md border-x border-t border-black">
      <div className='flex items-center justify-between mb-1'>
        <button type='button' className={navButtonClasses} onClick={onOlder} aria-label='Show the previous week'>‹</button>
        <span className='text-sm'>{range}</span>
        <button type='button' className={navButtonClasses} onClick={onNewer} disabled={!onNewer} aria-label='Show the next week'>›</button>
      </div>
      <div className={HOME_GRID_COLUMNS}>
        <div className='hidden sm:block'>&nbsp;</div>
        {dates.map((date) => {
          const isToday = format(date, DATE_FORMAT_FULL) === today;
          return (
            <div key={date.toISOString()} className={`text-center text-xs ${isToday ? 'font-bold underline' : ''}`}>
              <div>{format(date, "EEEEE")}</div>
              <div>{format(date, "d")}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HabitListHeader;
