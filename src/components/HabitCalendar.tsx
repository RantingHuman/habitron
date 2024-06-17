//WIP: Display a habit calendar with the correct completion status

import {
  startOfMonth,

  startOfWeek,

  eachDayOfInterval,
  format,

  subWeeks,
} from "date-fns";
import { useState, useEffect } from "react";
import { Habit } from "../types";

interface HabitCalendarProps {
 habit: Habit;
}

const HabitCalendar = ({ habit }: HabitCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  useEffect(() => {
    // Adjust the starting month based on habitStartDate and the desired number of weeks
    const weeksAgo = 10;
    const startDate = subWeeks(new Date(), weeksAgo);
    setCurrentDate(startOfMonth(startDate));
  }, [habit]);

  // const handleNextMonth = () => {
  //   setCurrentMonth(addMonths(currentMonth, 1));
  // };

  // const handlePrevMonth = () => {
  //   setCurrentMonth(subMonths(currentMonth, 1));
  // };

  const days = eachDayOfInterval({
    start: startOfWeek(currentDate),
    end: new Date(), // Ensure the last date is today
  });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  console.log(weeks);

  return (
    <div className='calendar w-full p-4 rounded-lg shadow-md'>
      <div className="header flex justify-between items-center">
        
      </div>
      <div className="days flex">
        {weeks.map((week, index) => (
          <div key={index} className="week flex flex-col">
            {week.map((day) => (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className={`
                  day w-full flex items-center justify-center 
                  border border-slate-700 p-1
                `}
                >
                {format(day, 'dd')}
                
                </div>
            ))}
            </div>
        ))}
      </div>
    </div>
  )
}

export default HabitCalendar;