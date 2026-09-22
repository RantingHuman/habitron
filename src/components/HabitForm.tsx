import { useHabitronStore } from '../stores';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import FormInput from './form-elements/FormInput';
import Button from './buttons/Button';
import { createHabit } from '../utils/habitUtils';
import { DAILY_FREQUENCY, VALIDATION_MESSAGES, WEEKDAY_FREQUENCIES } from '../utils/constants';
import useHabitronNavigation from '../hooks/useHabitronNavigation';
import ValidationError from './dialogs/ValidationError';

const HabitForm = () => {
  const { id } = useParams();
  const { navigateToHome, navigateToViewHabit } = useHabitronNavigation();
  const { addHabit, updateHabit, getHabit } = useHabitronStore();
  const habit = getHabit(id);
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [frequency, setFrequency] = useState<string[]>(
    habit?.frequency?.length ? habit.frequency : [DAILY_FREQUENCY]
  );

  const [nameErrorMessage, setNameErrorMessage] = useState('')
  const [frequencyErrorMessage, setFrequencyErrorMessage] = useState('')

  const handleFrequencyChange = (value: string, checked: boolean) => {
    setFrequency((currentFrequency) => {
      if (value === DAILY_FREQUENCY) {
        return checked ? [DAILY_FREQUENCY] : [];
      }

      const weekdayFrequency = currentFrequency.filter((item) => item !== DAILY_FREQUENCY);
      if (checked && !weekdayFrequency.includes(value)) {
        return [...weekdayFrequency, value];
      }
      return weekdayFrequency.filter((item) => item !== value);
    });
  };

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
    if(!validateForm()) return;
    if (habit) {
      updateHabit({ ...habit, name, description, frequency });
      navigateToViewHabit(habit.id);
    } else {
      addHabit(createHabit(name, description, frequency));
      navigateToHome();
    }
  };

  const validateForm = () => {
    const hasName = name.trim() !== '';
    const hasFrequency = frequency.length > 0;
    setNameErrorMessage(hasName ? '' : VALIDATION_MESSAGES.HABIT_NAME_REQUIRED);
    setFrequencyErrorMessage(hasFrequency ? '' : 'Select at least one day.');
    return hasName && hasFrequency;
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
      <fieldset>
        <legend className='font-medium'>Frequency</legend>
        <label className='flex items-center gap-2 mt-1'>
          <input
            name='habit-frequency-daily'
            type='checkbox'
            checked={frequency.includes(DAILY_FREQUENCY)}
            onChange={(e) => handleFrequencyChange(DAILY_FREQUENCY, e.target.checked)}
          />
          Every day
        </label>
        <div className='grid grid-cols-4 gap-2 mt-2'>
          {WEEKDAY_FREQUENCIES.map(({ value, label }) => (
            <label key={value} className='flex items-center gap-1'>
              <input
                name={`habit-frequency-${value}`}
                type='checkbox'
                checked={frequency.includes(value)}
                disabled={frequency.includes(DAILY_FREQUENCY)}
                onChange={(e) => handleFrequencyChange(value, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
        {frequencyErrorMessage && <ValidationError message={frequencyErrorMessage} />}
      </fieldset>
      <div className='flex justify-end gap-6 mt-4'>
        <Button name='cancel' appearance='secondary' onClick={handleCancel}>Cancel</Button>
        <Button name='submit' appearance='primary' type="submit">{habit ? 'Update' : 'Add'} Habit</Button>
      </div>
    </form>
  );

}

export default HabitForm;