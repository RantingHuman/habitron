// interface for the habit
import { Log } from './log';

export type HabitStatus = 'active' | 'paused';

export interface HabitReminder {
    enabled: boolean;
    time: string;
}

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
    reminder?: HabitReminder;
    streak: number; // number of days in a row. Eventually, this will be its own type
    startDate: string;
    completionHistory: Log[];

}
