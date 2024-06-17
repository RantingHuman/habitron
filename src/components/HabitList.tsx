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
      {habits.map((habit) => (
        <HabitListItem key={habit.id} habit={habit} />
      ))}
      {/* <Button appearance="danger" name="reset-habits" onClick={resetHabits}>Reset Habits</Button> */}
    </div>
    :
    <div>
      <p>No habits yet! Add one to get started.</p>
      <br />
      <Button appearance="primary" name="add-habit">
        <NavLink to="/add-habit">Add Habit</NavLink>
      </Button>
    </div>
  );
}

export default HabitList;