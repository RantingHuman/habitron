import { useState } from 'react';
import { NavLink, generatePath } from 'react-router-dom';
import Button from './buttons/Button';
import ConfirmationDialog from './dialogs/ConfirmationDialog';
import { useHabitronStore } from '../stores';
import { Habit } from '../types/';
import { isHabitArchived, restoreHabit } from '../utils/habitUtils';
import { DELETE_HABIT_MESSAGE, ROUTES } from '../utils/constants';

const ArchivedHabits = () => {
  const { habits, updateHabit, removeHabit } = useHabitronStore();
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const archivedHabits = habits.filter(isHabitArchived);

  const handleDelete = () => {
    if (habitToDelete) removeHabit(habitToDelete.id);
    setHabitToDelete(null);
  };

  if (archivedHabits.length === 0) {
    return <p className='text-sm'>No archived habits. Archive a habit from its page to stop tracking it but keep its history.</p>;
  }

  return (
    <>
      <ul className='flex flex-col gap-3'>
        {archivedHabits.map((habit) => (
          <li key={habit.id} className='flex flex-wrap items-center justify-between gap-2'>
            <NavLink to={generatePath(ROUTES.VIEW_HABIT, { id: habit.id })} className='min-w-0 truncate'>
              {habit.name}
            </NavLink>
            <div className='flex gap-2'>
              <Button name={`restore-${habit.id}`} appearance='secondary' onClick={() => updateHabit(restoreHabit(habit))}>
                Restore
              </Button>
              <Button name={`delete-${habit.id}`} appearance='danger' onClick={() => setHabitToDelete(habit)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
      { habitToDelete &&
        <ConfirmationDialog isOpen={!!habitToDelete} title={`Delete ${habitToDelete.name}`} message={DELETE_HABIT_MESSAGE}
          onConfirm={handleDelete} onCancel={() => setHabitToDelete(null)} />
      }
    </>
  );
};

export default ArchivedHabits;
