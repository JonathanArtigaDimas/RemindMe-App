import { Vibration } from 'react-native';
import { useReminderStore } from '../store/reminderStore';
import { audioService } from './audioService';
import { useSettingsStore } from '../store/settingsStore';
import { BUILT_IN_SOUNDS } from '../constants/sounds';
import { Reminder } from '../types';
import { notificationService } from './notificationService';

class ReminderMonitor {
  private interval: NodeJS.Timeout | null = null;
  private notifiedIds = new Set<string>();
  private onTrigger: ((reminder: Reminder) => void) | null = null;

  start(callback: (reminder: Reminder) => void) {
    this.onTrigger = callback;
    if (this.interval) return;
    
    this.interval = setInterval(() => {
      this.checkReminders();
    }, 5000); // Check faster (every 5 seconds)
    
    this.checkReminders();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async checkReminders() {
    const store = useReminderStore.getState();
    const settings = useSettingsStore.getState().settings;
    const now = new Date();
    
    const dueReminders = store.reminders.filter(r => {
      if (!r.isActive || r.isCompleted || this.notifiedIds.has(r.id)) return false;
      const reminderTime = typeof r.datetime === 'number' ? r.datetime : new Date(r.datetime).getTime();
      const nowTime = now.getTime();
      
      const isDue = reminderTime <= nowTime;
      const isTooOld = (nowTime - reminderTime) > 60000;

      if (isDue && !isTooOld) {
        const createdDate = new Date(r.createdAt);
        const wasJustCreated = (nowTime - createdDate.getTime()) < 10000;
        
        console.log(`[Monitor] Checking "${r.title}": isDue=${isDue}, wasJustCreated=${wasJustCreated}`);

        return !wasJustCreated || (reminderTime < createdDate.getTime() - 2000);
      }
      return false;
    });

    for (const reminder of dueReminders) {
      this.notifiedIds.add(reminder.id);
      this.triggerReminder(reminder, settings.defaultSoundId);
    }
  }

  private async triggerReminder(reminder: Reminder, defaultSoundId: string) {
    // 1. Heavy Vibration
    Vibration.vibrate([0, 800, 200, 800, 200, 800, 200, 1000], true);

    // 2. Play Sound
    const soundId = reminder.soundId || defaultSoundId;
    const sound = BUILT_IN_SOUNDS.find(s => s.id === soundId);
    if (sound) {
      await audioService.playSound(sound.uri);
    }

    // 3. Trigger UI callback
    if (this.onTrigger) {
      this.onTrigger(reminder);
    }

    // 4. Force System Notification (Samsung Bypass)
    // We send a 0-second notification so it shows NOW
    await notificationService.scheduleReminder({
      ...reminder,
      id: `manual-${reminder.id}-${Date.now()}` // Unique ID to avoid being blocked by shield
    });
  }
}

export const reminderMonitor = new ReminderMonitor();
