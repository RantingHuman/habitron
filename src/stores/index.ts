import { Store } from "@tauri-apps/plugin-store";
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { create } from 'zustand';
import { createHabitSlice, type HabitSlice } from "./slices/habitSlice";
import { createSystemSlice, type SystemSlice } from "./slices/systemSlice";

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

const habitronTauriStore = new Store("./habitron.bin");

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown persistence error';

interface PersistenceCallbacks {
  onError: (error: unknown) => void;
  onSuccess: () => void;
}

const getStorage = (store: Store, callbacks: PersistenceCallbacks): StateStorage => {
  const handleError = (operation: string, error: unknown): never => {
    console.error(`Failed to ${operation} Habitron storage`, error);
    callbacks.onError(error);
    throw error;
  };

  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        return (await store.get<string>(name)) ?? null;
      } catch (error) {
        return handleError(`read ${name} from`, error);
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        await store.set(name, value);
        await store.save();
        callbacks.onSuccess();
      } catch (error) {
        handleError(`save ${name} to`, error);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      try {
        await store.delete(name);
        await store.save();
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
      version: 1,
      storage: createJSONStorage(() => getStorage(habitronTauriStore, persistenceCallbacks)),
      partialize: (state): PersistedHabitronState => ({
        habits: state.habits,
        darkMode: state.darkMode
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<PersistedHabitronState>;
        return {
          habits: state.habits ?? [],
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