import { format } from 'date-fns';

interface HabitListHeaderProps {
  dates: Date[];
}

const HabitListHeader = ({dates} : HabitListHeaderProps) => {
  return (
      <div className="grid grid-cols-7 dark:bg-slate-800 bg-amber-300 p-2 rounded-t-md border-x border-t border-black">
        <div className="col-span-3">&nbsp;</div>
        {dates.map((date, index) => (
          <div key={index} className='text-center text-sm'>
            <div>{format(date, "E")}</div>
            <div>{format(date, "dd")}</div>
          </div>
        ))}
      </div>
  );
}

export default HabitListHeader;