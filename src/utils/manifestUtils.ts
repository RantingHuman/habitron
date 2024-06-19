import Manifest from '@mnfst/sdk';
import { Habit } from '../types';


export const getAllHabitData = async () => {
  const manifest = new Manifest();
  const habitData = await manifest.from("habits").find<Habit>();
  return habitData;
}