// interface for the habit
import { Log } from './log';
export interface Habit {
    id?: number;
    name: string;
    description?: string;
    frequency: string[]; // days of the week
    streak: number; // number of days in a row. Eventually, this will be its own type
    startDate: string;
    logs: Log[];

}
