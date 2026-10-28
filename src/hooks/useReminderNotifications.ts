import { useEffect } from 'react';
import {
  cancel,
  isPermissionGranted,
  requestPermission,
  Schedule,
  sendNotification
} from '@tauri-apps/plugin-notification';
import { useHabitronStore, usePersistenceStore } from '../stores';
import { Habit } from '../types/';
import { getToday } from '../utils/dateUtils';
import {
  getUpcomingReminders,
  isReminderDue,
  MAX_PENDING_REMINDERS,
  toIosNotificationDate
} from '../utils/reminderUtils';
import { isIosRuntime, isMobileRuntime, isTauriRuntime } from '../utils/platform';

const notifiedReminders = new Set<string>();
const RESCHEDULE_DELAY_MS = 1_000;
const REMINDER_BODY = 'Keep your habit going today.';

// Reminders are always scheduled with ids 1..MAX_PENDING_REMINDERS. cancelAll() is not used because
// the plugin's iOS side rejects it (it requires a list of ids), so cancel that id range instead.
const SCHEDULED_REMINDER_IDS = Array.from({ length: MAX_PENDING_REMINDERS }, (_, index) => index + 1);

const ensurePermission = async () =>
  await isPermissionGranted() || await requestPermission() === 'granted';

// Mobile: hand the upcoming reminders to the OS so they fire while the app is closed.
// Everything is cancelled and rescheduled on each change, so completed or paused days drop out.
const scheduleNativeReminders = async (habits: Habit[]) => {
  const reminders = getUpcomingReminders(habits);
  await cancel(SCHEDULED_REMINDER_IDS);
  if (reminders.length === 0 || !await ensurePermission()) return;

  const isIos = isIosRuntime();

  reminders.forEach(({ habit, at }, index) => sendNotification({
    id: SCHEDULED_REMINDER_IDS[index],
    title: `${habit.name} reminder`,
    body: REMINDER_BODY,
    schedule: Schedule.at(isIos ? toIosNotificationDate(at) : at)
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
  const hasHydrated = usePersistenceStore((state) => state.hasHydrated);

  useEffect(() => {
    // Until saved habits have loaded, `habits` is empty; rescheduling then would cancel every reminder
    if (!isTauriRuntime() || !hasHydrated) return;

    let disposed = false;
    const handleError = (error: unknown) => console.error('Failed to send Habitron reminder', error);

    if (isMobileRuntime()) {
      // Debounced so a burst of edits (or a quick background/foreground flip) reschedules once
      let timeoutId: number | undefined;
      const reschedule = () => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(
          () => void scheduleNativeReminders(habits).catch(handleError),
          RESCHEDULE_DELAY_MS
        );
      };

      // Returning to the foreground moves the 14-day window forward, even if the app stayed open overnight
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') reschedule();
      };

      reschedule();
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        window.clearTimeout(timeoutId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    const checkReminders = () => void sendDueReminders(habits, () => disposed).catch(handleError);
    checkReminders();
    const intervalId = window.setInterval(checkReminders, 60_000);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [habits, hasHydrated]);
};

export default useReminderNotifications;
