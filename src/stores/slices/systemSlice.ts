import { StateCreator } from 'zustand';

export interface SystemSlice {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const createSystemSlice: StateCreator<SystemSlice> = (set) => ({
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
});