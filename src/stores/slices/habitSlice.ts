import { StateCreator } from 'zustand';
import { Habit, Log } from '../../types/';
import testHabits from '../../data/testHabits';

export interface HabitSlice {
  habits: Habit[];
  addHabit: (habit: Habit) => void;
  removeHabit: (id: number) => void;
  updateHabit: (habit: Habit) => void;
  getHabit: (id?: number) => Habit | undefined;
  getLog: (habitId: number, date: string) => Log | undefined;
  toggleHabitCompletion: (habit: Habit, log: Log) => void;
  addTestHabits: () => void;
  resetHabits: () => void;
}

const addHabit = (habits: Habit[], habit: Habit): Habit[] => [...habits, habit];
const removeHabit = (habits: Habit[], id: number): Habit[] => habits.filter((habit) => habit.id !== id);
const updateHabit = (habits: Habit[], habit: Habit): Habit[] => habits.map((h) => h.id === habit.id ? habit : h);
const getHabit = (habits: Habit[], id: number): Habit | undefined => habits.find((habit) => habit.id === id);
const getLog = (habits: Habit[], habitId: number, date: string): Log | undefined => {
  const habit = getHabit(habits, habitId);
  if (!habit) return;
  return habit.logs.find((log: Log) => log.logDate === date);
}
const toggleHabitCompletion = (habit: Habit, log: Log): Habit => {
  log.completed = !log.completed;
  const logs = habit.logs || [];
  if (!logs.includes(log)) {
    logs.push(log);
  } else {
    logs.map((l) => l.id === log.id ? log : l);
  }
  return { ...habit, logs };
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