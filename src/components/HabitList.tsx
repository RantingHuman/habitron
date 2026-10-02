import { useHabitronStore } from '../stores';
import HabitListItem from './HabitListItem';
import HabitListHeader from './HabitListHeader';
import Button from './buttons/Button';
import ConfirmationDialog from './dialogs/ConfirmationDialog';
import { NavLink } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { getLastNDates, getToday } from '../utils/dateUtils';
import { HOME_DAYS_TO_SHOW } from '../utils/constants';
import { useEffect, useMemo, useState } from 'react';


const HabitList = () => {
  const { habits, resetHabits } = useHabitronStore();
  const [today, setToday] = useState(() => getToday());
  const [showResetDialog, setShowResetDialog] = useState(false);

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

  const handleReset = () => {
    resetHabits();
    setShowResetDialog(false);
  };

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
      <Button appearance="danger" name="reset-habits" onClick={() => setShowResetDialog(true)}>Reset Habits</Button>
      { showResetDialog &&
        <ConfirmationDialog isOpen={showResetDialog} title='Reset Habits'
          message='This permanently deletes all habits and their history. Export a backup first if you might want them back.'
          onConfirm={handleReset} onCancel={() => setShowResetDialog(false)} />
      }
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