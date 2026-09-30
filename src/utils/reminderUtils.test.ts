import { describe, expect, it } from 'vitest';
import { createHabit, createLog } from './habitUtils';
import { isReminderDue, isValidReminderTime } from './reminderUtils';

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

  it('does not remind after a completion, skip, or pause', () => {
    const completedHabit = makeReminderHabit();
    completedHabit.completionHistory = [createLog('2026-09-23', 'manual', true)];
    expect(isReminderDue(completedHabit, new Date(2026, 8, 23, 10, 0))).toBe(false);

    const skippedHabit = makeReminderHabit();
    skippedHabit.completionHistory = [{ ...createLog('2026-09-23'), status: 'skipped' }];
    expect(isReminderDue(skippedHabit, new Date(2026, 8, 23, 10, 0))).toBe(false);

    const pausedHabit = makeReminderHabit();
    pausedHabit.status = 'paused';
    expect(isReminderDue(pausedHabit, new Date(2026, 8, 23, 10, 0))).toBe(false);
  });

  it('validates 24-hour reminder times', () => {
    expect(isValidReminderTime('00:00')).toBe(true);
    expect(isValidReminderTime('23:59')).toBe(true);
    expect(isValidReminderTime('24:00')).toBe(false);
  });
});