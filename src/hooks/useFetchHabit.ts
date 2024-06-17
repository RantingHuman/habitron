// Deprecated, directly use useHabitronStore instead

import { useHabitronStore } from "../stores/";

const useFetchHabit = (habitId?: string) => {
  const { habits } = useHabitronStore();
  if (!habitId) return null;
  return habits.find((habit) => habit.id === habitId);
};

export default useFetchHabit;