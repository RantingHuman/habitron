// View teh details of a habit and allow the user to edit it or delete it
// Eventually this will have completion history and other details

import { useHabitronStore } from '../stores';
import { useParams } from 'react-router-dom';
import ConfirmationDialog from './dialogs/ConfirmationDialog';
import { useState } from 'react';
import Button from './buttons/Button';
import HabitHistory from './HabitHistory';
import useHabitronNavigation from '../hooks/useHabitronNavigation';
import Card from './Card';
// import HabitCalendar from './HabitCalendar';


const HabitDetail = () => {
  const { id } = useParams();
  const { navigateToHome, navigateToEditHabit } = useHabitronNavigation();
  const { getHabit, removeHabit } = useHabitronStore();
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


  return (
    habit ? (
      <>
      <Card header={habit.name}>
      
        <div >{habit.description}</div>

        <div className='flex justify-end gap-6 mt-4'>
          <Button name='edit' appearance='primary' onClick={handleEdit}>Edit</Button>
          <Button name='delete' appearance='danger' onClick={() => setShowDialog(true)}>Delete</Button>
        </div>

        { showDialog &&
          <ConfirmationDialog isOpen={showDialog} title='Delete Habit' message='Are you sure you want to delete this habit?'
           onConfirm={handleDelete} onCancel={() => setShowDialog(false)} />
        }
      </Card>      
        <HabitHistory habit={habit} />
        {/* <HabitCalendar habitStartDate={habit.startDate} completedDates={habit.completedDates} /> */}      
      </>
    ) : (
      <div>Habit not found</div>
    )
  );
}

export default HabitDetail;