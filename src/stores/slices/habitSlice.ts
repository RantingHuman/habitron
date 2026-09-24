import { StateCreator } from 'zustand';
import { Habit, Log, LogStatus } from '../../types/';
import testHabits from '../../data/testHabits';
import { createLog, getLogStatus } from '../../utils/habitUtils';

export interface HabitSlice {
  habits: Habit[];
  addHabit: (habit: Habit) => void;
  removeHabit: (id: string) => void;
  updateHabit: (habit: Habit) => void;
  replaceHabits: (habits: Habit[]) => void;
  setHabitLog: (habitId: string, date: string, status: LogStatus | null) => void;
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
const setHabitLogOnHabit = (habit: Habit, date: string, status: LogStatus | null): Habit => {
  const completionHistory = (habit.completionHistory || [])
    .filter((existingLog) => existingLog.date !== date);

  if (!status) return { ...habit, completionHistory };

  const existingLog = habit.completionHistory.find((log) => log.date === date);
  const nextLog = existingLog
    ? { ...existingLog, completed: status === 'completed', status }
    : { ...createLog(date, 'manual', status === 'completed'), status };

  return { ...habit, completionHistory: [...completionHistory, nextLog] };
}
const toggleHabitCompletion = (habit: Habit, log: Log): Habit => {
  const nextStatus = getLogStatus(log) === 'completed' ? null : 'completed';
  return setHabitLogOnHabit(habit, log.date, nextStatus);
}

export const createHabitSlice: StateCreator<HabitSlice> = (set, get) => ({
  habits: [],
  addTestHabits: () => set(() => ({ habits: testHabits })),
  resetHabits: () => set(() => ({ habits: [] as Habit[] })),
  addHabit: (habit: Habit) => set((state) => ({ habits: addHabit(state.habits, habit) })),
  removeHabit: (id) => set((state) => ({ habits: removeHabit(state.habits, id) })),
  updateHabit: (habit) => set((state) => ({ habits: updateHabit(state.habits, habit) })),
  replaceHabits: (habits) => set(() => ({
    habits: habits.map((habit) => ({
      ...habit,
      completionHistory: [...habit.completionHistory]
    }))
  })),
  setHabitLog: (habitId, date, status) => set((state) => ({
    habits: state.habits.map((habit) => habit.id === habitId
      ? setHabitLogOnHabit(habit, date, status)
      : habit)
  })),
  getHabit: (id) => id ? getHabit(get().habits, id) : undefined,
  getLog: (habitId, date) => getLog(get().habits, habitId, date),
  toggleHabitCompletion: (habit, log) => set((state) => {
    const currentHabit = getHabit(state.habits, habit.id);
    if (!currentHabit) return { habits: state.habits };

    const currentLog = getLog(state.habits, habit.id, log.date) || log;
    return {
      habits: updateHabit(state.habits, toggleHabitCompletion(currentHabit, currentLog))
    };
  }),
});