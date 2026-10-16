import { useHabitronStore } from '../stores';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import FormInput from './form-elements/FormInput';
import Button from './buttons/Button';
import { changeRules, createHabit, getCurrentRules } from '../utils/habitUtils';
import { VALIDATION_MESSAGES, WEEKDAY_FREQUENCIES } from '../utils/constants';
import useHabitronNavigation from '../hooks/useHabitronNavigation';
import ValidationError from './dialogs/ValidationError';
import { HabitKind, HabitSchedule, HabitTarget, Weekday } from '../types/';
import { isValidReminderTime } from '../utils/reminderUtils';

const HabitForm = () => {
  const { id } = useParams();
  const { navigateToHome, navigateToViewHabit } = useHabitronNavigation();
  const { addHabit, updateHabit, getHabit } = useHabitronStore();
  const habit = getHabit(id);
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [schedule, setSchedule] = useState<HabitSchedule>(
    habit ? getCurrentRules(habit).schedule : { type: 'daily' }
  );
  const currentTarget = habit ? getCurrentRules(habit).target : undefined;
  // The kind is chosen when the habit is created and cannot change afterwards
  const [kind, setKind] = useState<HabitKind>(habit?.kind ?? 'yesNo');
  const [unit, setUnit] = useState(habit?.unit ?? '');
  const [targetDirection, setTargetDirection] = useState<HabitTarget['direction']>(currentTarget?.direction ?? 'atLeast');
  const [targetAmount, setTargetAmount] = useState(currentTarget ? String(currentTarget.amount) : '');
  const [reminderEnabled, setReminderEnabled] = useState(habit?.reminder?.enabled ?? false);
  const [reminderTime, setReminderTime] = useState(habit?.reminder?.time ?? '09:00');

  const [nameErrorMessage, setNameErrorMessage] = useState('')
  const [scheduleErrorMessage, setScheduleErrorMessage] = useState('')
  const [reminderErrorMessage, setReminderErrorMessage] = useState('')
  const [measureErrorMessage, setMeasureErrorMessage] = useState('')

  const isMeasurable = kind === 'measurable';
  // At-most habits have no reminders: their days are done until the limit is passed
  const canHaveReminder = !(isMeasurable && targetDirection === 'atMost');
  const target: HabitTarget | undefined = isMeasurable
    ? { direction: targetDirection, amount: Number(targetAmount) }
    : undefined;
  const reminder = canHaveReminder && reminderEnabled ? { enabled: true, time: reminderTime } : undefined;

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
      updateHabit(changeRules({
        ...habit,
        name,
        description,
        ...(isMeasurable && { unit: unit.trim() }),
        reminder
      }, { schedule, target }));
      navigateToViewHabit(habit.id);
    } else {
      addHabit(createHabit(
        name,
        description,
        schedule,
        reminder,
        target && { unit: unit.trim(), target }
      ));
      navigateToHome();
    }
  };

  const validateForm = () => {
    const hasName = name.trim() !== '';
    const hasValidSchedule = schedule.type === 'daily'
      || (schedule.type === 'weekdays' && schedule.days.length > 0)
      || (schedule.type === 'interval' && Number.isInteger(schedule.intervalDays) && schedule.intervalDays >= 2);
    const hasValidReminder = !reminder || isValidReminderTime(reminderTime);
    // An at-least target must be above zero; "at most 0" is a valid limit
    const hasValidMeasure = !target || (
      unit.trim() !== ''
        && targetAmount.trim() !== ''
        && Number.isFinite(target.amount)
        && (target.direction === 'atLeast' ? target.amount > 0 : target.amount >= 0)
    );
    setNameErrorMessage(hasName ? '' : VALIDATION_MESSAGES.HABIT_NAME_REQUIRED);
    setScheduleErrorMessage(hasValidSchedule ? '' : 'Choose valid schedule settings.');
    setReminderErrorMessage(hasValidReminder ? '' : 'Choose a valid reminder time.');
    setMeasureErrorMessage(hasValidMeasure ? '' : 'Enter a unit and a target amount.');
    return hasName && hasValidSchedule && hasValidReminder && hasValidMeasure;
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
        <legend className='font-medium'>Kind</legend>
        {habit ? (
          <p className='mt-1'>{isMeasurable ? 'Measurable' : 'Yes/no'} (cannot be changed)</p>
        ) : (
          <div className='grid gap-2 mt-1'>
            <label className='flex items-center gap-2'>
              <input name='habit-kind' type='radio' value='yesNo'
                checked={kind === 'yesNo'} onChange={() => setKind('yesNo')} />
              Yes/no: mark each day done
            </label>
            <label className='flex items-center gap-2'>
              <input name='habit-kind' type='radio' value='measurable'
                checked={kind === 'measurable'} onChange={() => setKind('measurable')} />
              Measurable: record an amount, such as glasses or minutes
            </label>
          </div>
        )}
      </fieldset>
      {isMeasurable && (
        <fieldset>
          <legend className='font-medium'>Target</legend>
          <div className='flex flex-wrap items-center gap-2 mt-1'>
            <select
              name='habit-target-direction'
              aria-label='Target direction'
              value={targetDirection}
              onChange={(e) => setTargetDirection(e.target.value as HabitTarget['direction'])}
              className='rounded-md'
            >
              <option value='atLeast'>At least</option>
              <option value='atMost'>At most</option>
            </select>
            <input
              name='habit-target-amount'
              aria-label='Target amount'
              type='number'
              inputMode='decimal'
              min='0'
              step='any'
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className='w-24 rounded-md'
            />
            <input
              name='habit-unit'
              aria-label='Unit'
              placeholder='unit, e.g. glasses'
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className='min-w-[8rem] flex-1 rounded-md'
            />
          </div>
          <p className='mt-1 text-sm'>per due day.{habit && ' A target change applies from today.'}</p>
          {measureErrorMessage && <ValidationError message={measureErrorMessage} />}
        </fieldset>
      )}
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
              onChange={(e) => setSchedule({ ...schedule, intervalDays: Number(e.target.value) })}
              className='w-20 rounded-md'
            />
            days
          </label>
        )}
        {scheduleErrorMessage && <ValidationError message={scheduleErrorMessage} />}
      </fieldset>
      <fieldset>
        <legend className='font-medium'>Reminder</legend>
        {!canHaveReminder ? (
          <p className='mt-1 text-sm'>At-most habits have no reminders: each day is done until you pass the limit.</p>
        ) : (<>
        <label className='flex items-center gap-2 mt-1'>
          <input
            name='habit-reminder-enabled'
            type='checkbox'
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
          />
          Remind me when this habit is due
        </label>
        {reminderEnabled && (
          <label className='flex items-center gap-2 mt-2'>
            Time
            <input
              name='habit-reminder-time'
              type='time'
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className='rounded-md'
            />
          </label>
        )}
        {reminderErrorMessage && <ValidationError message={reminderErrorMessage} />}
        </>)}
      </fieldset>
      <div className='flex justify-end gap-6 mt-4'>
        <Button name='cancel' appearance='secondary' onClick={handleCancel}>Cancel</Button>
        <Button name='submit' appearance='primary' type="submit">{habit ? 'Update' : 'Add'} Habit</Button>
      </div>
    </form>
  );

}

export default HabitForm;