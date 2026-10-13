import { StateCreator } from 'zustand';
import { CheckInStatus, Habit } from '../../types/';
import { setCheckIn } from '../../utils/habitUtils';

export interface HabitSlice {
  habits: Habit[];
  addHabit: (habit: Habit) => void;
  removeHabit: (id: string) => void;
  updateHabit: (habit: Habit) => void;
  replaceHabits: (habits: Habit[]) => void;
  setCheckIn: (habitId: string, date: string, status: CheckInStatus | null) => void;
  getHabit: (id?: string) => Habit | undefined;
  resetHabits: () => void;
}

const addHabit = (habits: Habit[], habit: Habit): Habit[] => [...habits, habit];
const removeHabit = (habits: Habit[], id: string): Habit[] => habits.filter((habit) => habit.id !== id);
const updateHabit = (habits: Habit[], habit: Habit): Habit[] => habits.map((h) => h.id === habit.id ? habit : h);
const getHabit = (habits: Habit[], id: string): Habit | undefined => habits.find((habit) => habit.id === id);

export const createHabitSlice: StateCreator<HabitSlice> = (set, get) => ({
  habits: [],
  resetHabits: () => set(() => ({ habits: [] as Habit[] })),
  addHabit: (habit: Habit) => set((state) => ({ habits: addHabit(state.habits, habit) })),
  removeHabit: (id) => set((state) => ({ habits: removeHabit(state.habits, id) })),
  updateHabit: (habit) => set((state) => ({ habits: updateHabit(state.habits, habit) })),
  replaceHabits: (habits) => set(() => ({
    habits: habits.map((habit) => ({
      ...habit,
      checkIns: [...habit.checkIns]
    }))
  })),
  setCheckIn: (habitId, date, status) => set((state) => ({
    habits: state.habits.map((habit) => habit.id === habitId
      ? setCheckIn(habit, date, status)
      : habit)
  })),
  getHabit: (id) => id ? getHabit(get().habits, id) : undefined,
});
