import { useEffect } from 'react';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification
} from '@tauri-apps/plugin-notification';
import { useHabitronStore } from '../stores';
import { getToday } from '../utils/dateUtils';
import { isReminderDue } from '../utils/reminderUtils';

const notifiedReminders = new Set<string>();

const isTauriRuntime = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const useReminderNotifications = () => {
  const habits = useHabitronStore((state) => state.habits);

  useEffect(() => {
    let disposed = false;

    const checkReminders = async () => {
      if (disposed || !isTauriRuntime()) return;

      const now = new Date();
      const today = getToday();
      const dueHabits = habits.filter((habit) =>
        isReminderDue(habit, now) && !notifiedReminders.has(`${habit.id}:${today}`)
      );

      if (dueHabits.length === 0) return;

      try {
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
          permissionGranted = await requestPermission() === 'granted';
        }
        if (!permissionGranted || disposed) return;

        for (const habit of dueHabits) {
          await sendNotification({
            title: `${habit.name} reminder`,
            body: 'Keep your habit going today.'
          });
          notifiedReminders.add(`${habit.id}:${today}`);
        }
      } catch (error) {
        console.error('Failed to send Habitron reminder', error);
      }
    };

    void checkReminders();
    const intervalId = window.setInterval(() => void checkReminders(), 60_000);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [habits]);
};

export default useReminderNotifications;