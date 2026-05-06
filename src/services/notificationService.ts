import { Platform, Alert, ToastAndroid } from 'react-native';
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
      // Usamos un nuevo ID de canal (v3) para forzar la actualización de la vibración intensa
      await Notifications.setNotificationChannelAsync('reminder-urgent-v3', {
        name: '⏰ Avisos Urgentes',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 800, 400, 800, 400, 800, 400, 800], // 4 pulsos largos
        enableVibration: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
      });
    } catch (e) {
      console.warn('Error setting up alarm channel:', e);
    }
  }

  async scheduleReminder(reminder: Reminder): Promise<string[]> {
    const Notifications = this.getNotifications();
    if (!Notifications) return [];

    try {
      const targetTime = typeof reminder.datetime === 'number' ? reminder.datetime : new Date(reminder.datetime).getTime();
      const now = Date.now();
      let secondsToWait = Math.floor((targetTime - now) / 1000);
      
      const { Alert } = require('react-native');
      const nowStr = new Date(now).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      const targetStr = new Date(targetTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

      if (secondsToWait < 5) return []; // Silently ignore very close times

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ RECORDATORIO: ' + reminder.title,
          body: reminder.description || 'Toca para abrir RemindMe',
          priority: Notifications.AndroidNotificationPriority.MAX,
          sound: true,
          vibrate: [0, 800, 400, 800, 400, 800, 400, 800],
          categoryIdentifier: 'reminder-actions',
          data: { reminderId: reminder.id },
        },
        trigger: {
          type: 'date',
          date: targetTime,
          channelId: 'reminder-urgent-v3',
        } as any,
      });

      // Mensaje sutil en lugar de alerta invasiva
      if (Platform.OS === 'android') {
        const timeStr = new Date(targetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        ToastAndroid.show(`Recordatorio creado para las ${timeStr}`, ToastAndroid.SHORT);
      }

      return [id];
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
      const canDoExact = (permissions as any)?.['canScheduleExactAlarms'] ?? true;
      return canDoExact;
    } catch (e) {
      return true;
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
          seconds: 15,
          channelId: 'reminder-urgent-v3',
        },
      });
      if (Platform.OS === 'android') {
        ToastAndroid.show('Prueba programada (15s). Sal de la app para escuchar.', ToastAndroid.LONG);
      }
    } catch (e) {
      alert('Error al programar: ' + e);
    }
  }
}

export const notificationService = new NotificationService();
