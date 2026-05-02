import { Vibration } from 'react-native';
import { useReminderStore } from '../store/reminderStore';
import { audioService } from './audioService';
import { useSettingsStore } from '../store/settingsStore';
import { BUILT_IN_SOUNDS } from '../constants/sounds';
import { Reminder } from '../types';

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
      const reminderDate = new Date(r.datetime);
      const nowTime = now.getTime();
      const reminderTime = reminderDate.getTime();
      
      // Reach the time? (within a 1-minute window to avoid missing it)
      const isDue = reminderTime <= nowTime;
      const isTooOld = (nowTime - reminderTime) > 60000;

      if (isDue && !isTooOld) {
        // Protect against immediate trigger on creation
        const createdDate = new Date(r.createdAt);
        const wasJustCreated = (nowTime - createdDate.getTime()) < 5000;
        // Only trigger if it wasn't just created OR if the target time is definitely in the past relative to creation
        return !wasJustCreated || (reminderTime < createdDate.getTime() - 1000);
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
  }
}

export const reminderMonitor = new ReminderMonitor();
