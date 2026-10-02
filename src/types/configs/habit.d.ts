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
    schedule: HabitSchedule;
    status?: HabitStatus;
    reminder?: HabitReminder;
    startDate: string;
    completionHistory: Log[];
}

// Shape of habits saved before schedules replaced the frequency list (persist/backup version 1)
export interface LegacyHabit extends Omit<Habit, 'schedule'> {
    frequency: string[];
    schedule?: HabitSchedule;
    streak: number;
}
