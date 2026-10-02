import { load, type Store } from "@tauri-apps/plugin-store";
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { create } from 'zustand';
import { createHabitSlice, type HabitSlice } from "./slices/habitSlice";
import { createSystemSlice, type SystemSlice } from "./slices/systemSlice";
import { Habit, LegacyHabit } from '../types/';
import { migrateLegacyHabit } from '../utils/habitUtils';
import { isTauriRuntime } from '../utils/platform';

interface PersistenceState {
  hasHydrated: boolean;
  error: string | null;
  beginHydration: () => void;
  completeHydration: () => void;
  setError: (error: string) => void;
  clearError: () => void;
}

export const usePersistenceStore = create<PersistenceState>((set) => ({
  hasHydrated: false,
  error: null,
  beginHydration: () => set({ hasHydrated: false }),
  completeHydration: () => set({ hasHydrated: true, error: null }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null })
}));

const TAURI_STORE_PATH = './habitron.bin';

interface KeyValueBackend {
  get: (name: string) => Promise<string | null>;
  set: (name: string, value: string) => Promise<void>;
  delete: (name: string) => Promise<void>;
}

const createTauriBackend = (path: string): KeyValueBackend => {
  let storePromise: Promise<Store> | null = null;

  // Load lazily and forget a failed load so a retry can try again
  const getStore = () => {
    storePromise ??= load(path, { autoSave: false, defaults: {} }).catch((error) => {
      storePromise = null;
      throw error;
    });
    return storePromise;
  };

  return {
    get: async (name) => (await (await getStore()).get<string>(name)) ?? null,
    set: async (name, value) => {
      const store = await getStore();
      await store.set(name, value);
      await store.save();
    },
    delete: async (name) => {
      const store = await getStore();
      await store.delete(name);
      await store.save();
    }
  };
};

// Lets the app run in a plain browser (`npm run dev`) without the Tauri runtime
const localStorageBackend: KeyValueBackend = {
  get: async (name) => window.localStorage.getItem(name),
  set: async (name, value) => window.localStorage.setItem(name, value),
  delete: async (name) => window.localStorage.removeItem(name)
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown persistence error';

interface PersistenceCallbacks {
  onError: (error: unknown) => void;
  onSuccess: () => void;
}

const getStorage = (backend: KeyValueBackend, callbacks: PersistenceCallbacks): StateStorage => {
  const handleError = (operation: string, error: unknown): never => {
    console.error(`Failed to ${operation} Habitron storage`, error);
    callbacks.onError(error);
    throw error;
  };

  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        return await backend.get(name);
      } catch (error) {
        return handleError(`read ${name} from`, error);
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        await backend.set(name, value);
        callbacks.onSuccess();
      } catch (error) {
        handleError(`save ${name} to`, error);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      try {
        await backend.delete(name);
        callbacks.onSuccess();
      } catch (error) {
        handleError(`remove ${name} from`, error);
      }
    },
  };
};

type HabitronState = HabitSlice & SystemSlice;
type PersistedHabitronState = Pick<HabitronState, 'habits' | 'darkMode'>;

const persistenceCallbacks: PersistenceCallbacks = {
  onError: (error) => usePersistenceStore.getState().setError(getErrorMessage(error)),
  onSuccess: () => usePersistenceStore.getState().clearError()
};

export const useHabitronStore = create<HabitronState>()(
  persist(
    (...a) => ({
      ...createHabitSlice(...a),
      ...createSystemSlice(...a)
    }),
    {
      name: 'habitron',
      version: 2,
      storage: createJSONStorage(() => getStorage(
        isTauriRuntime() ? createTauriBackend(TAURI_STORE_PATH) : localStorageBackend,
        persistenceCallbacks
      )),
      partialize: (state): PersistedHabitronState => ({
        habits: state.habits,
        darkMode: state.darkMode
      }),
      migrate: (persistedState, version) => {
        const state = persistedState as { habits?: Array<Habit | LegacyHabit>; darkMode?: boolean };
        const habits = state.habits ?? [];
        return {
          // Version 1 stored `frequency` and `streak`; version 2 requires `schedule`
          habits: version < 2 ? habits.map(migrateLegacyHabit) : habits as Habit[],
          darkMode: state.darkMode ?? false
        };
      },
      onRehydrateStorage: () => {
        usePersistenceStore.getState().beginHydration();
        return (_state, error) => {
          if (error) {
            usePersistenceStore.getState().setError(getErrorMessage(error));
          } else {
            usePersistenceStore.getState().completeHydration();
          }
        };
      }
    })
);