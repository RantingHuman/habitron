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
// the schedule took effect
export type HabitSchedule =
    | { type: 'daily' }
    | { type: 'weekdays'; days: Weekday[] }
    | { type: 'interval'; intervalDays: number };

// The amount a measurable habit aims for each due day
export interface HabitTarget {
    direction: 'atLeast' | 'atMost';
    amount: number;
}

// One version of a habit's rules; it applies from `effectiveFrom` until the next version.
// The first version also applies to any days before it (see docs/adr/0001)
export interface HabitRules {
    effectiveFrom: string;
    schedule: HabitSchedule;
    // Present exactly when the habit is measurable
    target?: HabitTarget;
}

// A paused period: `start` is the first paused day, `end` the day the habit resumed (not paused)
export interface HabitPause {
    start: string;
    end?: string;
}

export type CheckInStatus = 'done' | 'skipped';

// What a check-in records: done (yes/no habits only), skipped, or an amount (measurable habits only)
export type CheckInValue = { status: CheckInStatus } | { amount: number };

export type CheckIn = { date: string } & CheckInValue;

export type HabitKind = 'yesNo' | 'measurable';

export interface Habit {
    id: string;
    name: string;
    description?: string;
    // Fixed when the habit is created
    kind: HabitKind;
    // Present exactly when the habit is measurable, e.g. "glasses" or "minutes"
    unit?: string;
    // Versions in order of `effectiveFrom`, never empty
    rules: HabitRules[];
    pauses: HabitPause[];
    // First day the habit was archived; absent while it is in use
    archivedOn?: string;
    reminder?: HabitReminder;
    startDate: string;
    checkIns: CheckIn[];
}
