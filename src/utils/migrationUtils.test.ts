import { describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Habit } from '../types';
import { createHabit } from './habitUtils';
import { parseBackup } from './backupUtils';
import { createLoadRecovery, createMigrationChain, persistMigrations } from './migrationUtils';

// A stand-in for a future v5 -> v6 change to the saved shape
const shoutNames = (data: Record<string, unknown>) => ({
  ...data,
  habits: (data.habits as { name: string }[]).map((habit) => ({ ...habit, name: habit.name.toUpperCase() }))
});
const chainToV6 = createMigrationChain(5, [shoutNames]);

const toBackup = (version: number, habits: unknown[]) => JSON.stringify({
  version,
  exportedAt: new Date().toISOString(),
  habits
});

describe('Migrating an older backup on import', () => {
  it('runs each step from the backup\'s version to the current one', () => {
    const [habit] = parseBackup(toBackup(5, [createHabit('Read', '')]), chainToV6);

    expect(habit.name).toBe('READ');
  });

  it('leaves a backup from the current version untouched', () => {
    const [habit] = parseBackup(toBackup(6, [createHabit('Read', '')]), chainToV6);

    expect(habit.name).toBe('Read');
  });

  it('refuses a backup from a newer or unknown version', () => {
    expect(() => parseBackup(toBackup(7, [createHabit('Read', '')]), chainToV6)).toThrow('version 7');
    expect(() => parseBackup(toBackup(4, [createHabit('Read', '')]), chainToV6)).toThrow('version 4');
  });
});

describe('Migrating stored data on load', () => {
  // A store wired like the app's, over an in-memory backend holding data saved under `version`
  const loadStoredData = async (version: number, habits: Habit[]) => {
    const saved = JSON.stringify({ state: { habits, darkMode: true }, version });
    const backend = new Map([['habitron', saved]]);
    let loadError: unknown;
    type Stored = { habits: Habit[]; darkMode: boolean };
    const store = create<Stored>()(persist(
      (): Stored => ({ habits: [], darkMode: false }),
      {
        name: 'habitron',
        ...persistMigrations<Stored>(chainToV6),
        storage: createJSONStorage(() => ({
          getItem: (name) => backend.get(name) ?? null,
          setItem: (name, value) => { backend.set(name, value); },
          removeItem: (name) => { backend.delete(name); }
        })),
        onRehydrateStorage: () => (_state, error) => { loadError = error; },
        skipHydration: true
      }
    ));
    await store.persist.rehydrate();
    const recovery = createLoadRecovery('habitron', {
      get: async (name) => backend.get(name) ?? null,
      delete: async (name) => { backend.delete(name); }
    }, () => store.persist.rehydrate());
    return {
      state: store.getState(),
      store,
      recovery,
      loadError: () => loadError,
      stored: () => backend.get('habitron'),
      saved
    };
  };

  it('runs each step from the stored version to the current one', async () => {
    const { state, loadError } = await loadStoredData(5, [createHabit('Read', '')]);

    expect(loadError()).toBeUndefined();
    expect(state.habits[0].name).toBe('READ');
    expect(state.darkMode).toBe(true);
  });

  it('reports data from a newer version as an error and keeps it', async () => {
    const { state, loadError, stored, saved } = await loadStoredData(7, [createHabit('Read', '')]);

    expect(String(loadError())).toContain('version 7');
    expect(state.habits).toEqual([]);
    expect(stored()).toBe(saved);
  });

  it('hands back unreadable data exactly as it was stored', async () => {
    const { recovery, saved } = await loadStoredData(7, [createHabit('Read', '')]);

    expect(await recovery.readRawData()).toBe(saved);
  });

  it('starts fresh only when asked, wiping the unreadable data and loading empty', async () => {
    const { recovery, store, loadError, stored } = await loadStoredData(7, [createHabit('Read', '')]);

    await recovery.startFresh();

    expect(loadError()).toBeUndefined();
    expect(store.getState().habits).toEqual([]);
    // The empty start is saved under the current version in place of the unreadable data
    expect(JSON.parse(stored()!)).toEqual({ state: { habits: [], darkMode: false }, version: 6 });
  });
});
