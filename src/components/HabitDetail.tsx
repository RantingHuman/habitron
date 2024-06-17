// View teh details of a habit and allow the user to edit it or delete it
// Eventually this will have completion history and other details

import { useHabitronStore } from '../stores';
import { useParams, useNavigate } from 'react-router-dom';
import ConfirmationDialog from './ConfirmationDialog';
import { useState } from 'react';
import Button from './buttons/Button';
import HabitHistory from './HabitHistory';
// import HabitCalendar from './HabitCalendar';


const HabitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getHabit, removeHabit } = useHabitronStore();
  const [showDialog, setShowDialog] = useState(false);

  const habit = getHabit(id);
  
  const handleDelete = () => {
    if(habit) removeHabit(habit.id);
    setShowDialog(false);
    navigate('/', { replace: true });
  }

  const handleEdit = () => {
    if(habit) navigate(`/edit-habit/${habit.id}`);
  }


  return (
    habit ? (
      <div className=''>
        <div className='col-span-1'>{habit.name}</div>
        <div className='col-span-5'>{habit.description}</div>

        <div className='flex justify-end gap-6 mt-4'>
          <Button name='edit' appearance='primary' onClick={handleEdit}>Edit</Button>
          <Button name='delete' appearance='danger' onClick={() => setShowDialog(true)}>Delete</Button>
        </div>

        { showDialog &&
          <ConfirmationDialog isOpen={showDialog} title='Delete Habit' message='Are you sure you want to delete this habit?'
           onConfirm={handleDelete} onCancel={() => setShowDialog(false)} />
        }

        <HabitHistory habit={habit} />
        {/* <HabitCalendar habitStartDate={habit.startDate} completedDates={habit.completedDates} /> */}
      </div>
      
    ) : (
      <div>Habit not found</div>
    )
  );
}

export default HabitDetail;