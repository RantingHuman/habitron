import { useHabitronStore } from '../stores';
import HabitListItem from './HabitListItem';
import HabitListHeader from './HabitListHeader';
import Button from './buttons/Button';
import { NavLink } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { getLastNDates, getToday } from '../utils/dateUtils';
import { HOME_DAYS_TO_SHOW } from '../utils/constants';
import { useEffect, useMemo, useState } from 'react';


const HabitList = () => {
  const { habits, resetHabits } = useHabitronStore();
  const [today, setToday] = useState(() => getToday());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setToday((currentToday) => {
        const nextToday = getToday();
        return nextToday === currentToday ? currentToday : nextToday;
      });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const lastNDates = useMemo(
    () => getLastNDates(HOME_DAYS_TO_SHOW, parseISO(today)),
    [today]
  );
  return (
  habits.length > 0 ?
    <div>      
      {<HabitListHeader dates={lastNDates} />}
      <ul>
        {habits.map((habit) => (
          <HabitListItem key={habit.id} habit={habit} dates={lastNDates} />
        ))}
      </ul>
      <br />
      <Button appearance="danger" name="reset-habits" onClick={resetHabits}>Reset Habits</Button>
    </div>
    :
    <div>
      <p>No habits yet! Add one to get started.</p>
      <br />
        <NavLink to="/add-habit">
          <Button appearance="primary" name="add-habit">
            Add Habit
          </Button>
        </NavLink>

    </div>
  );
}

export default HabitList;