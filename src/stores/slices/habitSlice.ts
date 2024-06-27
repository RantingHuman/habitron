import { StateCreator } from 'zustand';
import { Habit, Log } from '../../types/';
import testHabits from '../../data/testHabits';

export interface HabitSlice {
  habits: Habit[];
  addHabit: (habit: Habit) => void;
  removeHabit: (id: string) => void;
  updateHabit: (habit: Habit) => void;
  getHabit: (id?: string) => Habit | undefined;
  getLog: (habitId: string, date: string) => Log | undefined;
  toggleHabitCompletion: (habit: Habit, log: Log) => void;
  addTestHabits: () => void;
  resetHabits: () => void;
}

const addHabit = (habits: Habit[], habit: Habit): Habit[] => [...habits, habit];
const removeHabit = (habits: Habit[], id: string): Habit[] => habits.filter((habit) => habit.id !== id);
const updateHabit = (habits: Habit[], habit: Habit): Habit[] => habits.map((h) => h.id === habit.id ? habit : h);
const getHabit = (habits: Habit[], id: string): Habit | undefined => habits.find((habit) => habit.id === id);
const getLog = (habits: Habit[], habitId: string, date: string): Log | undefined => {
  const habit = getHabit(habits, habitId);
  if (!habit) return;
  return habit.completionHistory.find((log: Log) => log.date === date);
}
const toggleHabitCompletion = (habit: Habit, log: Log): Habit => {
  log.completed = !log.completed;
  const completionHistory = habit.completionHistory || [];
  if (!completionHistory.some((l) => l.id === log.id)) {
    completionHistory.push(log);
  } else {
    completionHistory.map((l) => l.id === log.id ? log : l);
  }
  return { ...habit, completionHistory };
}

export const createHabitSlice: StateCreator<HabitSlice> = (set, get) => ({
  habits: [],
  addTestHabits: () => set(() => ({ habits: testHabits })),
  resetHabits: () => set(() => ({ habits: [] as Habit[] })),
  addHabit: (habit: Habit) => set((state) => ({ habits: addHabit(state.habits, habit) })),
  removeHabit: (id) => set((state) => ({ habits: removeHabit(state.habits, id) })),
  updateHabit: (habit) => set((state) => ({ habits: updateHabit(state.habits, habit) })),
  getHabit: (id) => id ? getHabit(get().habits, id) : undefined,
  getLog: (habitId, date) => getLog(get().habits, habitId, date),
  toggleHabitCompletion: (habit, log) => set((state) => ({ 
    habits: updateHabit(state.habits, toggleHabitCompletion(habit, log)) 
  })),
});