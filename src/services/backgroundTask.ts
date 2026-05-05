import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { useReminderStore } from '../store/reminderStore';

const BACKGROUND_FETCH_TASK = 'background-fetch-reminders';

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('[Background] Checking reminders...');
    const now = Date.now();
    const reminders = useReminderStore.getState().reminders;
    
    const dueReminders = reminders.filter(r => {
      const time = typeof r.datetime === 'number' ? r.datetime : new Date(r.datetime).getTime();
      // Si el recordatorio es de hace menos de 2 minutos y no ha sonado
      return time <= now && time > (now - 120000);
    });

    for (const reminder of dueReminders) {
      await Notifications.presentNotificationAsync({
        title: '⏰ ' + reminder.title,
        body: reminder.description || 'Recordatorio pendiente',
        data: { reminderId: reminder.id },
      });
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[Background] Error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTasks() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('[Background] Task unregistered');
  } catch (err) {
    // Task wasn't registered
  }
}
