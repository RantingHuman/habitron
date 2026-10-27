// View the details of a habit and allow the user to edit, pause, archive or delete it

import { useHabitronStore } from '../stores';
import { useParams } from 'react-router-dom';
import ConfirmationDialog from './dialogs/ConfirmationDialog';
import { useState } from 'react';
import Button from './buttons/Button';
import HabitHistory from './HabitHistory';
import useHabitronNavigation from '../hooks/useHabitronNavigation';
import Card from './Card';
import { HabitPause } from '../types/';
import PauseDialog from './dialogs/PauseDialog';
import {
  archiveHabit,
  countCheckInsRemovedByPause,
  getCurrentRules,
  getCurrentStreak,
  getStrengthScore,
  isHabitArchived,
  isHabitPaused,
  pauseHabit,
  removePause,
  restoreHabit,
  resumeHabit
} from '../utils/habitUtils';
import { DELETE_HABIT_MESSAGE } from '../utils/constants';
import StrengthRing from './StrengthRing';
import { formatPauseRange, formatTarget } from '../utils/formatUtils';
import { getToday } from '../utils/dateUtils';

const HabitDetail = () => {
  const { id } = useParams();
  const { navigateToHome, navigateToEditHabit } = useHabitronNavigation();
  const { getHabit, removeHabit, updateHabit } = useHabitronStore();
  const [showDialog, setShowDialog] = useState(false);
  const [pauseNowRemovals, setPauseNowRemovals] = useState(0);
  // The pause being edited, or null when adding one; undefined while the sheet is closed
  const [editingPause, setEditingPause] = useState<HabitPause | null | undefined>(undefined);

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
  const strength = habit ? getStrengthScore(habit) : 0;
  const streak = habit ? getCurrentStreak(habit) : 0;
  const currentTarget = habit ? getCurrentRules(habit).target : undefined;

  const handleArchive = () => {
    if (habit) updateHabit(archiveHabit(habit));
    navigateToHome();
  }

  const handleRestore = () => {
    if (habit) updateHabit(restoreHabit(habit));
  }

  const handleTogglePause = () => {
    if (!habit) return;
    if (isPaused) {
      updateHabit(resumeHabit(habit));
      return;
    }
    const removals = countCheckInsRemovedByPause(habit, { start: getToday() });
    if (removals > 0) setPauseNowRemovals(removals);
    else updateHabit(pauseHabit(habit));
  }

  const handleConfirmPauseNow = () => {
    if (habit) updateHabit(pauseHabit(habit));
    setPauseNowRemovals(0);
  }


  return (
    habit ? (
      <>
      <Card header={habit.name}>
      
        <div >{habit.description}</div>
        <div>Status: {isArchived ? 'Archived' : isPaused ? 'Paused' : 'Active'}</div>
        {currentTarget && <div>Target: {formatTarget(currentTarget, habit.unit)} per due day</div>}
        <div className='flex items-center gap-2 my-2'>
          <StrengthRing score={strength} size={36} />
          <span>Strength: {Math.round(strength * 100)}%</span>
        </div>
        {!isArchived && <div>Current streak: {streak} {streak === 1 ? 'day' : 'days'}</div>}

        <div className='flex flex-wrap justify-end gap-3 mt-4'>
          {isArchived ? (
            <Button name='restore' appearance='primary' onClick={handleRestore}>Restore</Button>
          ) : (
            <>
              <Button name='toggle-pause' appearance='secondary' onClick={handleTogglePause}>
                {isPaused ? 'Resume' : 'Pause now'}
              </Button>
              <Button name='pause-dates' appearance='secondary' onClick={() => setEditingPause(null)}>Pause dates…</Button>
              <Button name='archive' appearance='secondary' onClick={handleArchive}>Archive</Button>
              <Button name='edit' appearance='primary' onClick={handleEdit}>Edit</Button>
            </>
          )}
          <Button name='delete' appearance='danger' onClick={() => setShowDialog(true)}>Delete</Button>
        </div>

        {habit.pauses.length > 0 && (
          <section className='mt-4'>
            <h3 className='font-semibold'>Pauses</h3>
            <ul>
              {habit.pauses.map((pause) => (
                <li key={pause.start} className='flex items-center justify-between gap-2 py-1'>
                  <span>{formatPauseRange(pause)}</span>
                  {!isArchived && (
                    <span className='flex gap-2'>
                      <Button name='edit-pause' appearance='transparent' onClick={() => setEditingPause(pause)}>Edit</Button>
                      <Button name='delete-pause' appearance='transparent'
                        onClick={() => updateHabit(removePause(habit, pause))}>Delete</Button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {editingPause !== undefined &&
          <PauseDialog habit={habit} pause={editingPause ?? undefined} onClose={() => setEditingPause(undefined)} />
        }

        {pauseNowRemovals > 0 &&
          <ConfirmationDialog isOpen title='Pause now'
            message={`Pausing removes ${pauseNowRemovals} ${pauseNowRemovals === 1 ? 'check-in' : 'check-ins'} on the paused days.`}
            onConfirm={handleConfirmPauseNow} onCancel={() => setPauseNowRemovals(0)} />
        }

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