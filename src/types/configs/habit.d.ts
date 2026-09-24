// interface for the habit
import { Log } from './log';

export type HabitStatus = 'active' | 'paused';

export type Weekday =
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';

export type HabitSchedule =
    | { type: 'daily' }
    | { type: 'weekdays'; days: Weekday[] }
    | { type: 'interval'; intervalDays: number };

export interface Habit {
    id: string;
    name: string;
    description?: string;
    frequency: string[]; // days of the week
    schedule?: HabitSchedule;
    status?: HabitStatus;
    streak: number; // number of days in a row. Eventually, this will be its own type
    startDate: string;
    completionHistory: Log[];

}
