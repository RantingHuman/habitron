// Deprecated. Logs are part of the HabitSlice now

import { StateCreator } from 'zustand';
import { Log } from '../../types/';
interface LogState {
    logs: Log[];
}

interface LogActions {
  addLog: (log: Log) => void;
  removeLog: (logId: string) => void;
  updateLog: (log: Log) => void;
  getLog: (logId: string) => Log | null;
  resetLogs: () => void;
}

const initialLogState: LogState = {
    logs: []
};

export interface LogSlice extends LogState, LogActions {}

export const createLogSlice: StateCreator<LogSlice> = 
      (set, get) => ({
        logs: [],
        addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
        removeLog: (logId) => set((state) => ({ logs: state.logs.filter((log) => log.id !== logId) })),
        updateLog: (log) => set((state) => ({ logs: state.logs.map((l) => l.id === log.id ? log : l) })),
        getLog: (logId) => get().logs.find((log) => log.id === logId) || null,
        resetLogs: () => set(initialLogState)
    }
);