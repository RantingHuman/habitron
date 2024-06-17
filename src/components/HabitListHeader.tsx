import { getLastNDates } from '../utils/dateUtils';
import { DAYS_TO_SHOW } from '../utils/constants';


const HabitListHeader = () => {
  return (
    <div>
      <div className="grid grid-cols-7 dark:bg-slate-600 bg-slate-300 p-2">
        <div className="col-span-3">&nbsp;</div>
        {getLastNDates(DAYS_TO_SHOW, "MMM dd").map((date) => (
          <div key={date} className="text-center">{date}</div>
        ))}
      </div>
    </div>
  );
}

export default HabitListHeader;