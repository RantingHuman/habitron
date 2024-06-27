import { getLastNDates } from '../utils/dateUtils';
import { HOME_DAYS_TO_SHOW } from '../utils/constants';
import { useMemo } from 'react';


const HabitListHeader = () => {
  const lastNDates = useMemo(() => getLastNDates(HOME_DAYS_TO_SHOW, "MMM dd"), []);
  return (
      <div className="grid grid-cols-7 dark:bg-slate-800 bg-amber-300 p-4 rounded-t-md border-x border-t border-black">
        <div className="col-span-3">&nbsp;</div>
        {lastNDates.map((date, index) => (
          <div key={index} className="text-center">{date}</div>
        ))}
      </div>
  );
}

export default HabitListHeader;