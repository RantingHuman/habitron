import { Store } from "@tauri-apps/plugin-store";
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { create } from 'zustand';
// import { createHabitSlice, type HabitSlice } from "./slices/habitSlice";
import { createSystemSlice, type SystemSlice } from "./slices/systemSlice";

const habitronTauriStore = new Store("./habitron.bin");

const getStorage = (store: Store): StateStorage => ({
  getItem: async (name: string): Promise<string | null> => {
    console.log("getItem invoked", { name });
    return (await store.get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    console.log("setItem invoked", { name, value });
    await store.set(name, value);
    await store.save();
  },
  removeItem: async (name: string): Promise<void> => {
    console.log("removeItem invoked", { name });
    await store.delete(name);
    await store.save();
  },
});

export const useHabitronStore = create<SystemSlice>()(
  persist(
    (...a) => ({
      // ...createHabitSlice(...a),
      ...createSystemSlice(...a)
    }),
    {
      name: 'habitron',
      storage: createJSONStorage(() => getStorage(habitronTauriStore))
    })
);