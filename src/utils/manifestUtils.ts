import Manifest from '@mnfst/sdk';
import { Habit, Log } from '../types';


export const getAllHabitData = async () => {
  const manifest = new Manifest();
  return await manifest.from("habits").find<Habit>({perPage: 1000, page: 1});
}

export const getHabitData = async (id: number) => {
  const manifest = new Manifest();
  return await manifest.from("habits").findOneById<Habit>(id);
}

export const addHabitData = async (habit: Habit) => {
  const manifest = new Manifest();
  return await manifest.from("habits").create<Habit>(habit);
}

export const updateHabitData = async (habit: Habit) => {
  const manifest = new Manifest();
  return await manifest.from("habits").update<Habit>(habit.id, habit);
}

export const addLogData = async (log: Log) => {
  const manifest = new Manifest();
  return await manifest.from("habits").create<Log>(log);
}