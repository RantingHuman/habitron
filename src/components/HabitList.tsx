import { useHabitronStore } from '../stores';
import HabitListItem from './HabitListItem';
import HabitListHeader from './HabitListHeader';
import Button from './buttons/Button';
import { NavLink } from 'react-router-dom';
import Manifest from '@mnfst/sdk';
import { useEffect, useState } from 'react';
import { Habit } from '../types';

const HabitList = () => {
  const { habits, resetHabits } = useHabitronStore();
  const [manifestData, setManifestData] = useState<Habit[]>([]);

  useEffect(() => {
    const manifest = new Manifest();

    manifest.from("habits")
    .find<Habit>()
    .then((res) => {
      setManifestData(res);
    })
  },[]);
  return (
  habits.length > 0 ?
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