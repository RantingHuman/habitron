import { useHabitronStore } from '../stores';
import HabitListItem from './HabitListItem';
import HabitListHeader from './HabitListHeader';
import Button from './buttons/Button';
import { NavLink } from 'react-router-dom';

const HabitList = () => {
  const { habits, resetHabits } = useHabitronStore();
  return (
  habits.length > 0 ?
    <div>      
      {<HabitListHeader />}
      <ul>
        {habits.map((habit) => (
          <HabitListItem key={habit.id} habit={habit} />
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