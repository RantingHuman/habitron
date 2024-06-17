import { useHabitronStore } from '../stores';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormInput from './form-elements/FormInput';
import Button from './buttons/Button';
import { createHabit } from '../utils/habitUtils';

const HabitForm = () => {
  const { id } = useParams();

  const navigate = useNavigate();
  const { addHabit, updateHabit, getHabit } = useHabitronStore();
  const habit = getHabit(id);
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  // const [frequency, setFrequency] = useState(habit?.frequency || []);


  const handleCancel = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if(habit) {
      navigate(`/view-habit/${habit.id}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (habit) {
      updateHabit({ ...habit, name, description });
      navigate(`/view-habit/${habit.id}`);
    } else {
      addHabit(createHabit(name, description));
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6 mx-auto mb-4'>
      <FormInput
        label="Name"
        name="habit-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
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