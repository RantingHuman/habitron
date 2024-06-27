import { useHabitronStore } from '../stores';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import FormInput from './form-elements/FormInput';
import Button from './buttons/Button';
import { createHabit } from '../utils/habitUtils';
import { VALIDATION_MESSAGES } from '../utils/constants';
import useHabitronNavigation from '../hooks/useHabitronNavigation';

const HabitForm = () => {
  const { id } = useParams();
  const { navigateToHome, navigateToViewHabit } = useHabitronNavigation();
  const { addHabit, updateHabit, getHabit } = useHabitronStore();
  const habit = getHabit(id);
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  // const [frequency, setFrequency] = useState(habit?.frequency || []);

  const [nameErrorMessage, setNameErrorMessage] = useState('')

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if(habit) {
      navigateToViewHabit(habit.id);  
    } else {
      navigateToHome();
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!validateForm()) {
      setNameErrorMessage(VALIDATION_MESSAGES.HABIT_NAME_REQUIRED);
      return;
    }
    if (habit) {
      updateHabit({ ...habit, name, description });
      navigateToViewHabit(habit.id);
    } else {
      addHabit(createHabit(name, description));
      navigateToHome();
    }
  };

  const validateForm = () => {
    return name.trim() !== '';
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4 dark:bg-slate-700 bg-amber-200 rounded-md p-4 border border-black'>
      <FormInput
        label="Name"
        name="habit-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        errorMessage={nameErrorMessage}
      />
      <FormInput
        label="Description"
        name="habit-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {/* <FormInput
        label="Frequency"
        name="habit-frequency"
        value={frequency.join(',')}
        onChange={(e) => setFrequency(e.target.value.split(','))}
      /> */}
      <div className='flex justify-end gap-6 mt-4'>
        <Button name='cancel' appearance='secondary' onClick={handleCancel}>Cancel</Button>
        <Button name='submit' appearance='primary' type="submit">{habit ? 'Update' : 'Add'} Habit</Button>
      </div>
    </form>
  );

}

export default HabitForm;