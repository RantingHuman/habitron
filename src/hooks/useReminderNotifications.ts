import { useEffect } from 'react';
import {
  cancelAll,
  isPermissionGranted,
  requestPermission,
  Schedule,
  sendNotification
} from '@tauri-apps/plugin-notification';
import { useHabitronStore } from '../stores';
import { Habit } from '../types/';
import { getToday } from '../utils/dateUtils';
import { getUpcomingReminders, isReminderDue } from '../utils/reminderUtils';
import { isMobileRuntime, isTauriRuntime } from '../utils/platform';

const notifiedReminders = new Set<string>();
const RESCHEDULE_DELAY_MS = 1_000;
const REMINDER_BODY = 'Keep your habit going today.';

const ensurePermission = async () =>
  await isPermissionGranted() || await requestPermission() === 'granted';

// Mobile: hand the upcoming reminders to the OS so they fire while the app is closed.
// Everything is cancelled and rescheduled on each change, so completed or paused days drop out.
const scheduleNativeReminders = async (habits: Habit[]) => {
  const reminders = getUpcomingReminders(habits);
  await cancelAll();
  if (reminders.length === 0 || !await ensurePermission()) return;

  reminders.forEach(({ habit, at }, index) => sendNotification({
    id: index + 1,
    title: `${habit.name} reminder`,
    body: REMINDER_BODY,
    schedule: Schedule.at(at)
  }));
};

// Desktop: the OS plugin cannot schedule notifications, so check while the app is open
const sendDueReminders = async (habits: Habit[], isDisposed: () => boolean) => {
  const now = new Date();
  const today = getToday();
  const dueHabits = habits.filter((habit) =>
    isReminderDue(habit, now) && !notifiedReminders.has(`${habit.id}:${today}`)
  );

  if (dueHabits.length === 0) return;
  if (!await ensurePermission() || isDisposed()) return;

  for (const habit of dueHabits) {
    sendNotification({ title: `${habit.name} reminder`, body: REMINDER_BODY });
    notifiedReminders.add(`${habit.id}:${today}`);
  }
};

const useReminderNotifications = () => {
  const habits = useHabitronStore((state) => state.habits);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    let disposed = false;
    const handleError = (error: unknown) => console.error('Failed to send Habitron reminder', error);

    if (isMobileRuntime()) {
      // Debounced so a burst of edits reschedules once
      const timeoutId = window.setTimeout(
        () => void scheduleNativeReminders(habits).catch(handleError),
        RESCHEDULE_DELAY_MS
      );
      return () => window.clearTimeout(timeoutId);
    }

    const checkReminders = () => void sendDueReminders(habits, () => disposed).catch(handleError);
    checkReminders();
    const intervalId = window.setInterval(checkReminders, 60_000);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [habits]);
};

export default useReminderNotifications;
