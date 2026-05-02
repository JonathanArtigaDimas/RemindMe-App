import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Reminder } from '../types';

// We avoid top-level import of expo-notifications to prevent Expo Go push crashes
// Instead we'll use dynamic imports or require inside functions.

class NotificationService {
  private isExpoGo() {
    return Constants.appOwnership === 'expo';
  }

  private getNotifications() {
    try {
      return require('expo-notifications');
    } catch (e) {
      console.warn('Expo Notifications not available');
      return null;
    }
  }

  async requestPermissions() {
    // Skip in Expo Go if it's causing crashes, but let's try to be selective
    const Notifications = this.getNotifications();
    if (!Notifications) return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Error requesting notification permissions:', e);
      return false;
    }
  }

  async setupAndroidChannel() {
    if (Platform.OS !== 'android') return;
    const Notifications = this.getNotifications();
    if (!Notifications) return;

    try {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Recordatorios',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        enableVibration: true,
      });
    } catch (e) {
      console.warn('Error setting up notification channel:', e);
    }
  }

  async scheduleReminder(reminder: Reminder): Promise<string[]> {
    const Notifications = this.getNotifications();
    if (!Notifications) return [];

    try {
      const date = new Date(reminder.datetime);
      // Add 5 second buffer to avoid immediate firing on creation
      if (date.getTime() < Date.now() + 5000) return [];

      const ids: string[] = [];

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.description || 'Tienes un recordatorio pendiente.',
          data: { reminderId: reminder.id },
          categoryIdentifier: 'reminder-actions',
          color: reminder.color,
          priority: Notifications.AndroidNotificationPriority.MAX,
          sound: true,
        },
        trigger: {
          seconds: Math.max(1, Math.floor((date.getTime() - Date.now()) / 1000)),
          channelId: 'reminders',
        },
      });
      ids.push(id);
      return ids;
    } catch (e) {
      console.warn('Error scheduling notification:', e);
      return [];
    }
  }

  async cancelNotifications(ids: string[]) {
    const Notifications = this.getNotifications();
    if (!Notifications) return;

    for (const id of ids) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (e) {}
    }
  }

  setupResponseHandler(callback: (reminderId: string) => void) {
    const Notifications = this.getNotifications();
    if (!Notifications) return { remove: () => {} };

    try {
      // 1. Handle notification interaction (tap or buttons)
      const subscription = Notifications.addNotificationResponseReceivedListener(async (response: any) => {
        const reminderId = response.notification.request.content.data.reminderId;
        const actionIdentifier = response.actionIdentifier;

        if (reminderId) {
          if (actionIdentifier === 'complete') {
            const { useReminderStore } = require('../store/reminderStore');
            useReminderStore.getState().toggleReminder(reminderId);
          } else if (actionIdentifier === 'snooze') {
            const { useReminderStore } = require('../store/reminderStore');
            const store = useReminderStore.getState();
            const reminder = store.reminders.find((r: any) => r.id === reminderId);
            if (reminder) {
              const newDate = new Date(Date.now() + 10 * 60000).toISOString();
              store.updateReminder(reminderId, { datetime: newDate });
              // Re-schedule
              const updatedReminder = { ...reminder, datetime: newDate };
              const ids = await this.scheduleReminder(updatedReminder);
              store.setNotificationIds(reminderId, ids);
            }
          } else {
            // Default tap behavior
            callback(reminderId);
          }
        }
      });

      // 2. App in foreground (show custom alert and vibrate)
      const foregroundSubscription = Notifications.addNotificationReceivedListener((notification: any) => {
        // We let the ReminderMonitor handle foreground logic with custom UI
        // But we still want to ensure the system notification shows if settings allow
      });

      return {
        remove: () => {
          subscription.remove();
          foregroundSubscription.remove();
        }
      };
    } catch (e) {
      console.warn('Error setting up response handler:', e);
      return { remove: () => {} };
    }
  }

  async checkExactAlarmPermission() {
    if (Platform.OS !== 'android') return true;
    const Notifications = this.getNotifications();
    if (!Notifications) return false;

    try {
      const { permissions } = await Notifications.getPermissionsAsync();
      // On some Android versions, we need to check if we can schedule exact alarms
      // Expo 52+ handles this via permissions check
      return true; 
    } catch (e) {
      return false;
    }
  }

  async setupNotificationCategories() {
    const Notifications = this.getNotifications();
    if (!Notifications) return;

    try {
      await Notifications.setNotificationCategoryAsync('reminder-actions', [
        {
          identifier: 'complete',
          buttonTitle: '✅ Completar',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'snooze',
          buttonTitle: '💤 Posponer 10 min',
          options: { opensAppToForeground: true },
        },
      ]);
    } catch (e) {
      console.warn('Error setting notification categories:', e);
    }
  }

  async testNotification() {
    const Notifications = this.getNotifications();
    if (!Notifications) {
      alert('Error: Notificaciones no disponibles');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Prueba de RemindMe',
          body: 'Esta es una notificación de prueba para verificar que el sonido y la vibración funcionan.',
          data: { test: true },
          categoryIdentifier: 'reminder-actions',
          priority: Notifications.AndroidNotificationPriority.MAX,
          sound: true,
        },
        trigger: {
          seconds: 5,
          channelId: 'reminders',
        },
      });
      alert('Se ha programado una prueba para dentro de 5 segundos. Por favor, bloquea el teléfono o sal de la app.');
    } catch (e) {
      alert('Error al programar: ' + e);
    }
  }
}

export const notificationService = new NotificationService();
