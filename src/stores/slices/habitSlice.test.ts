import { create } from 'zustand';
import { beforeEach, describe, expect, it } from 'vitest';
import { HabitSlice, createHabitSlice } from './habitSlice';
import { createHabit } from '../../utils/habitUtils';

const store = create<HabitSlice>()(createHabitSlice);

describe('habit check-in updates', () => {
  beforeEach(() => {
    store.setState({ habits: [] });
  });

  it('sets, replaces, and clears a check-in without mutating the stored habit', () => {
    const habit = createHabit('Meditate', '');
    store.setState({ habits: [habit] });

    store.getState().setCheckIn(habit.id, '2026-09-22', { status: 'done' });
    store.getState().setCheckIn(habit.id, '2026-09-22', { status: 'skipped' });
    expect(store.getState().habits[0].checkIns).toEqual([{ date: '2026-09-22', status: 'skipped' }]);
    expect(habit.checkIns).toEqual([]);

    store.getState().setCheckIn(habit.id, '2026-09-22', null);
    expect(store.getState().habits[0].checkIns).toEqual([]);
  });

  it('moves the start date back when an earlier day is checked in', () => {
    const habit = { ...createHabit('Journal', ''), startDate: '2026-09-22' };
    store.setState({ habits: [habit] });

    store.getState().setCheckIn(habit.id, '2026-09-20', { status: 'done' });
    expect(store.getState().habits[0].startDate).toBe('2026-09-20');

    store.getState().setCheckIn(habit.id, '2026-09-21', { status: 'skipped' });
    store.getState().setCheckIn(habit.id, '2026-09-20', null);
    expect(store.getState().habits[0].startDate).toBe('2026-09-20');
  });

  it('replaces habits with cloned check-ins', () => {
    const habit = createHabit('Write', '');
    store.getState().replaceHabits([habit]);

    expect(store.getState().habits).toHaveLength(1);
    expect(store.getState().habits[0].checkIns).not.toBe(habit.checkIns);
  });
});
