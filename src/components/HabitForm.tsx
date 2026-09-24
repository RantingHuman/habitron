import { useHabitronStore } from '../stores';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import FormInput from './form-elements/FormInput';
import Button from './buttons/Button';
import { createHabit, getFrequencyForSchedule, getHabitSchedule } from '../utils/habitUtils';
import { VALIDATION_MESSAGES, WEEKDAY_FREQUENCIES } from '../utils/constants';
import useHabitronNavigation from '../hooks/useHabitronNavigation';
import ValidationError from './dialogs/ValidationError';
import { HabitSchedule, Weekday } from '../types/';

const HabitForm = () => {
  const { id } = useParams();
  const { navigateToHome, navigateToViewHabit } = useHabitronNavigation();
  const { addHabit, updateHabit, getHabit } = useHabitronStore();
  const habit = getHabit(id);
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [schedule, setSchedule] = useState<HabitSchedule>(() =>
    habit ? getHabitSchedule(habit) : { type: 'daily' }
  );

  const [nameErrorMessage, setNameErrorMessage] = useState('')
  const [scheduleErrorMessage, setScheduleErrorMessage] = useState('')

  const handleScheduleTypeChange = (type: HabitSchedule['type']) => {
    if (type === 'daily') {
      setSchedule({ type });
    } else if (type === 'weekdays') {
      setSchedule((currentSchedule) => currentSchedule.type === type
        ? currentSchedule
        : { type, days: [] });
    } else {
      setSchedule((currentSchedule) => currentSchedule.type === type
        ? currentSchedule
        : { type, intervalDays: 2 });
    }
  };

  const handleWeekdayChange = (weekday: Weekday, checked: boolean) => {
    setSchedule((currentSchedule) => {
      if (currentSchedule.type !== 'weekdays') return currentSchedule;

      const days = checked
        ? [...currentSchedule.days, weekday]
        : currentSchedule.days.filter((day) => day !== weekday);
      return { ...currentSchedule, days };
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
      updateHabit({
        ...habit,
        name,
        description,
        frequency: getFrequencyForSchedule(schedule),
        schedule
      });
      navigateToViewHabit(habit.id);
    } else {
      addHabit(createHabit(name, description, schedule));
      navigateToHome();
    }
  };

  const validateForm = () => {
    const hasName = name.trim() !== '';
    const hasValidSchedule = schedule.type === 'daily'
      || (schedule.type === 'weekdays' && schedule.days.length > 0)
      || (schedule.type === 'interval' && Number.isInteger(schedule.intervalDays) && schedule.intervalDays >= 2);
    setNameErrorMessage(hasName ? '' : VALIDATION_MESSAGES.HABIT_NAME_REQUIRED);
    setScheduleErrorMessage(hasValidSchedule ? '' : 'Choose valid schedule settings.');
    return hasName && hasValidSchedule;
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
        <legend className='font-medium'>Schedule</legend>
        <div className='grid gap-2 mt-1'>
          <label className='flex items-center gap-2'>
            <input
              name='habit-schedule-type'
              type='radio'
              value='daily'
              checked={schedule.type === 'daily'}
              onChange={() => handleScheduleTypeChange('daily')}
            />
            Every day
          </label>
          <label className='flex items-center gap-2'>
            <input
              name='habit-schedule-type'
              type='radio'
              value='weekdays'
              checked={schedule.type === 'weekdays'}
              onChange={() => handleScheduleTypeChange('weekdays')}
            />
            Specific weekdays
          </label>
          <label className='flex items-center gap-2'>
            <input
              name='habit-schedule-type'
              type='radio'
              value='interval'
              checked={schedule.type === 'interval'}
              onChange={() => handleScheduleTypeChange('interval')}
            />
            Every N days
          </label>
        </div>
        {schedule.type === 'weekdays' && (
          <div className='grid grid-cols-4 gap-2 mt-2'>
            {WEEKDAY_FREQUENCIES.map(({ value, label }) => (
              <label key={value} className='flex items-center gap-1'>
                <input
                  name={`habit-schedule-${value}`}
                  type='checkbox'
                  checked={schedule.days.includes(value)}
                  onChange={(e) => handleWeekdayChange(value, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        )}
        {schedule.type === 'interval' && (
          <label className='flex items-center gap-2 mt-2'>
            Every
            <input
              name='habit-schedule-interval'
              type='number'
              min='2'
              max='365'
              value={schedule.intervalDays}
              onChange={(e) => setSchedule({ type: 'interval', intervalDays: Number(e.target.value) })}
              className='w-20 rounded-md'
            />
            days
          </label>
        )}
        {scheduleErrorMessage && <ValidationError message={scheduleErrorMessage} />}
      </fieldset>
      <div className='flex justify-end gap-6 mt-4'>
        <Button name='cancel' appearance='secondary' onClick={handleCancel}>Cancel</Button>
        <Button name='submit' appearance='primary' type="submit">{habit ? 'Update' : 'Add'} Habit</Button>
      </div>
    </form>
  );

}

export default HabitForm;