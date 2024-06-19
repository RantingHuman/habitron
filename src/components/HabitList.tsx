import { useHabitronStore } from '../stores';
import HabitListItem from './HabitListItem';
import HabitListHeader from './HabitListHeader';
import Button from './buttons/Button';
import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Habit } from '../types';
import { getAllHabitData } from '../utils/manifestUtils';

const HabitList = () => {
  const { habits, resetHabits } = useHabitronStore();
  const [manifestData, setManifestData] = useState<Habit[]>([]);

  useEffect(() => {
    getAllHabitData()
    .then((res) => {
      console.log(res);
      setManifestData(res.data);
    })
  },[]);
  return (
  (habits.length > 0  || manifestData.length > 0) ?
    <div>
      
      {<HabitListHeader />}
      {manifestData.map((habit) => (
        <HabitListItem key={habit.id} habit={habit} />
      ))}
      <Button appearance="danger" name="reset-habits" onClick={resetHabits}>Reset Habits</Button>
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