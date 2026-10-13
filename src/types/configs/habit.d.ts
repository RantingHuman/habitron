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

// Interval habits are due every `intervalDays` days, counted in both directions from the day
// the rules containing the schedule took effect
export type HabitSchedule =
    | { type: 'daily' }
    | { type: 'weekdays'; days: Weekday[] }
    | { type: 'interval'; intervalDays: number };

// One version of a habit's rules; it applies from `effectiveFrom` until the next version.
// The first version also applies to any days before it (see docs/adr/0001)
export interface HabitRules {
    effectiveFrom: string;
    schedule: HabitSchedule;
}

// A paused period: `start` is the first paused day, `end` the day the habit resumed (not paused)
export interface HabitPause {
    start: string;
    end?: string;
}

export type CheckInStatus = 'done' | 'skipped';

export interface CheckIn {
    date: string;
    status: CheckInStatus;
}

export interface Habit {
    id: string;
    name: string;
    description?: string;
    // Versions in order of `effectiveFrom`, never empty
    rules: HabitRules[];
    pauses: HabitPause[];
    // First day the habit was archived; absent while it is in use
    archivedOn?: string;
    reminder?: HabitReminder;
    startDate: string;
    checkIns: CheckIn[];
}
