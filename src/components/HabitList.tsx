import { useHabitronStore } from '../stores';
import HabitListItem from './HabitListItem';
import HabitListHeader from './HabitListHeader';
import Button from './buttons/Button';
import { NavLink } from 'react-router-dom';
import { getLastNDates } from '../utils/dateUtils';
import { HOME_DAYS_TO_SHOW } from '../utils/constants';
import { useMemo } from 'react';


const HabitList = () => {
  const { habits, resetHabits } = useHabitronStore();
  const lastNDates = useMemo(() => getLastNDates(HOME_DAYS_TO_SHOW), []);
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