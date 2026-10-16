import { describe, expect, it } from 'vitest';
import { createHabit } from './habitUtils';
import { getUpcomingReminders, isReminderDue, isValidReminderTime, toIosNotificationDate } from './reminderUtils';

const makeReminderHabit = () => {
  const habit = createHabit('Read', '', { type: 'daily' }, { enabled: true, time: '09:00' });
  habit.startDate = '2026-09-23';
  return habit;
};

describe('habit reminders', () => {
  it('becomes due at or after its configured local time', () => {
    const habit = makeReminderHabit();

    expect(isReminderDue(habit, new Date(2026, 8, 23, 8, 59))).toBe(false);
    expect(isReminderDue(habit, new Date(2026, 8, 23, 9, 0))).toBe(true);
  });

  it('does not remind after a done or skipped check-in, or while paused', () => {
    const completedHabit = makeReminderHabit();
    completedHabit.checkIns = [{ date: '2026-09-23', status: 'done' }];
    expect(isReminderDue(completedHabit, new Date(2026, 8, 23, 10, 0))).toBe(false);

    const skippedHabit = makeReminderHabit();
    skippedHabit.checkIns = [{ date: '2026-09-23', status: 'skipped' }];
    expect(isReminderDue(skippedHabit, new Date(2026, 8, 23, 10, 0))).toBe(false);

    const pausedHabit = makeReminderHabit();
    pausedHabit.pauses = [{ start: '2026-09-23' }];
    expect(isReminderDue(pausedHabit, new Date(2026, 8, 23, 10, 0))).toBe(false);
  });

  it('validates 24-hour reminder times', () => {
    expect(isValidReminderTime('00:00')).toBe(true);
    expect(isValidReminderTime('23:59')).toBe(true);
    expect(isValidReminderTime('24:00')).toBe(false);
  });
});
describe('measurable habit reminders', () => {
  const makeMeasurable = (direction: 'atLeast' | 'atMost') => {
    const habit = createHabit('Water', '', { type: 'daily' }, { enabled: true, time: '09:00' },
      { unit: 'glasses', target: { direction, amount: 8 } });
    habit.startDate = '2026-09-23';
    return habit;
  };

  it('still reminds after partial progress, but not once the target is met', () => {
    const habit = makeMeasurable('atLeast');

    habit.checkIns = [{ date: '2026-09-23', amount: 5 }];
    expect(isReminderDue(habit, new Date(2026, 8, 23, 10, 0))).toBe(true);

    habit.checkIns = [{ date: '2026-09-23', amount: 8 }];
    expect(isReminderDue(habit, new Date(2026, 8, 23, 10, 0))).toBe(false);
  });

  it('never reminds for an at-most habit, even over the limit', () => {
    const habit = makeMeasurable('atMost');

    expect(isReminderDue(habit, new Date(2026, 8, 23, 10, 0))).toBe(false);
    habit.checkIns = [{ date: '2026-09-23', amount: 12 }];
    expect(isReminderDue(habit, new Date(2026, 8, 23, 10, 0))).toBe(false);
    expect(getUpcomingReminders([habit], new Date(2026, 8, 23, 8, 0), 7)).toEqual([]);
  });
});

describe('upcoming reminders', () => {
  const now = new Date(2026, 8, 23, 10, 0);

  it('lists future reminder times on scheduled days, soonest first', () => {
    const early = createHabit('Read', '', { type: 'daily' }, { enabled: true, time: '09:00' });
    const late = createHabit('Walk', '', { type: 'daily' }, { enabled: true, time: '18:30' });
    early.startDate = late.startDate = '2026-09-23';

    const reminders = getUpcomingReminders([early, late], now, 2);

    expect(reminders.map(({ habit, at }) => [habit.name, at])).toEqual([
      ['Walk', new Date(2026, 8, 23, 18, 30)],
      ['Read', new Date(2026, 8, 24, 9, 0)],
      ['Walk', new Date(2026, 8, 24, 18, 30)]
    ]);
  });

  it('leaves out checked-in, not due, paused, and reminder-less days', () => {
    const habit = createHabit('Stretch', '', { type: 'weekdays', days: ['wednesday', 'thursday', 'saturday'] },
      { enabled: true, time: '20:00' });
    habit.startDate = '2026-09-23';
    habit.checkIns = [{ date: '2026-09-23', status: 'done' }];
    habit.pauses = [{ start: '2026-09-26' }];
    const noReminder = createHabit('Floss', '');

    expect(getUpcomingReminders([habit, noReminder], now, 7).map(({ at }) => at))
      .toEqual([new Date(2026, 8, 24, 20, 0)]);
  });

  it('caps the number of reminders', () => {
    const habit = createHabit('Read', '', { type: 'daily' }, { enabled: true, time: '21:00' });
    habit.startDate = '2026-09-23';

    expect(getUpcomingReminders([habit], now, 14, 5)).toHaveLength(5);
  });
});

describe('iOS notification dates', () => {
  it('sends the local wall-clock time in the UTC digits the plugin reads as local', () => {
    const at = new Date(2026, 9, 9, 18, 30);

    expect(toIosNotificationDate(at).toISOString()).toBe('2026-10-09T18:30:00.000Z');
  });
});
