// View the details of a habit and allow the user to edit, pause, archive or delete it

import { useHabitronStore } from '../stores';
import { useParams } from 'react-router-dom';
import ConfirmationDialog from './dialogs/ConfirmationDialog';
import { useState } from 'react';
import Button from './buttons/Button';
import HabitHistory from './HabitHistory';
import useHabitronNavigation from '../hooks/useHabitronNavigation';
import Card from './Card';
import {
  archiveHabit,
  getCurrentStreak,
  isHabitArchived,
  isHabitPaused,
  pauseHabit,
  restoreHabit,
  resumeHabit
} from '../utils/habitUtils';
import { DELETE_HABIT_MESSAGE } from '../utils/constants';


const HabitDetail = () => {
  const { id } = useParams();
  const { navigateToHome, navigateToEditHabit } = useHabitronNavigation();
  const { getHabit, removeHabit, updateHabit } = useHabitronStore();
  const [showDialog, setShowDialog] = useState(false);

  const habit = getHabit(id);
  
  const handleDelete = () => {
    if(habit) removeHabit(habit.id);
    setShowDialog(false);
    navigateToHome();
  }

  const handleEdit = () => {
    if(habit) navigateToEditHabit(habit.id);
  }

  const isPaused = habit ? isHabitPaused(habit) : false;
  const isArchived = habit ? isHabitArchived(habit) : false;

  const handleArchive = () => {
    if (habit) updateHabit(archiveHabit(habit));
    navigateToHome();
  }

  const handleRestore = () => {
    if (habit) updateHabit(restoreHabit(habit));
  }

  const handleTogglePause = () => {
    if (habit) {
      updateHabit(isPaused ? resumeHabit(habit) : pauseHabit(habit));
    }
  }


  return (
    habit ? (
      <>
      <Card header={habit.name}>
      
        <div >{habit.description}</div>
        <div>Status: {isArchived ? 'Archived' : isPaused ? 'Paused' : 'Active'}</div>
        {!isArchived && <div>Current streak: {getCurrentStreak(habit)} days</div>}

        <div className='flex flex-wrap justify-end gap-3 mt-4'>
          {isArchived ? (
            <Button name='restore' appearance='primary' onClick={handleRestore}>Restore</Button>
          ) : (
            <>
              <Button name='toggle-pause' appearance='secondary' onClick={handleTogglePause}>
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button name='archive' appearance='secondary' onClick={handleArchive}>Archive</Button>
              <Button name='edit' appearance='primary' onClick={handleEdit}>Edit</Button>
            </>
          )}
          <Button name='delete' appearance='danger' onClick={() => setShowDialog(true)}>Delete</Button>
        </div>

        { showDialog &&
          <ConfirmationDialog isOpen={showDialog} title='Delete Habit' message={DELETE_HABIT_MESSAGE}
           onConfirm={handleDelete} onCancel={() => setShowDialog(false)} />
        }
      </Card>      
        <HabitHistory habit={habit} />
      </>
    ) : (
      <div>Habit not found</div>
    )
  );
}

export default HabitDetail;