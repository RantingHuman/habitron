import { create } from 'zustand';
import { beforeEach, describe, expect, it } from 'vitest';
import { HabitSlice, createHabitSlice } from './habitSlice';
import { createHabit, createLog } from '../../utils/habitUtils';

const store = create<HabitSlice>()(createHabitSlice);

describe('habit completion updates', () => {
  beforeEach(() => {
    store.setState({ habits: [] });
  });

  it('toggles an existing log without mutating the stored habit', () => {
    const log = createLog('2026-09-21', 'manual', true);
    const storedHabit = { ...createHabit('Read', ''), completionHistory: [log] };
    store.setState({ habits: [storedHabit] });

    store.getState().toggleHabitCompletion(
      { ...storedHabit, completionHistory: [...storedHabit.completionHistory] },
      { ...log }
    );

    const updatedHabit = store.getState().habits[0];
    expect(updatedHabit.completionHistory).toHaveLength(1);
    expect(updatedHabit.completionHistory[0].completed).toBe(false);
    expect(updatedHabit.completionHistory).not.toBe(storedHabit.completionHistory);
    expect(storedHabit.completionHistory[0].completed).toBe(true);
  });

  it('adds a newly completed date as one log', () => {
    const habit = createHabit('Exercise', '');
    const log = createLog('2026-09-22');
    store.setState({ habits: [habit] });

    store.getState().toggleHabitCompletion(habit, log);

    const updatedHabit = store.getState().habits[0];
    expect(updatedHabit.completionHistory).toHaveLength(1);
    expect(updatedHabit.completionHistory[0]).toMatchObject({
      date: '2026-09-22',
      completed: true
    });
  });

  it('replaces habits with cloned completion histories', () => {
    const habit = createHabit('Write', '');
    store.getState().replaceHabits([habit]);

    expect(store.getState().habits).toHaveLength(1);
    expect(store.getState().habits[0].completionHistory)
      .not.toBe(habit.completionHistory);
  });
});