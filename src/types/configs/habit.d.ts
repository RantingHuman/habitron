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

// Interval habits are due every `intervalDays` days, counted from `anchorDate` in both directions
export type HabitSchedule =
    | { type: 'daily' }
    | { type: 'weekdays'; days: Weekday[] }
    | { type: 'interval'; intervalDays: number; anchorDate: string };

// A paused period: `start` is the first paused day, `end` the day the habit resumed (not paused)
export interface HabitPause {
    start: string;
    end?: string;
}

export interface Habit {
    id: string;
    name: string;
    description?: string;
    schedule: HabitSchedule;
    pauses: HabitPause[];
    reminder?: HabitReminder;
    startDate: string;
    completionHistory: Log[];
}

export type LegacyHabitSchedule =
    | Exclude<HabitSchedule, { type: 'interval' }>
    | { type: 'interval'; intervalDays: number; anchorDate?: string };

// Shape of habits saved by earlier versions: version 1 used `frequency` and `streak`,
// versions 1 and 2 used a `status` flag instead of pause periods and had no interval anchor
export interface LegacyHabit extends Omit<Habit, 'schedule' | 'pauses'> {
    frequency?: string[];
    streak?: number;
    schedule?: LegacyHabitSchedule;
    status?: HabitStatus;
    pauses?: HabitPause[];
}
