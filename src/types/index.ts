export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type ReminderCategory = 'personal' | 'work' | 'health' | 'finance' | 'family' | 'other';
export type Theme = 'light' | 'dark' | 'system';
export type ThemeID = 'onyx' | 'arctic' | 'solar' | 'cyber' | 'ocean' | 'midnight' | 'glass' | 'sakura' | 'coffee' | 'noir';

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval?: number;
  daysOfWeek?: number[];
  endDate?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  datetime: number | string;
  category: ReminderCategory;
  color: string;
  soundId: string;
  isActive: boolean;
  isCompleted: boolean;
  recurrence: RecurrenceConfig;
  notificationIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Sound {
  id: string;
  name: string;
  uri: string;
  isBuiltIn: boolean;
  isRecorded: boolean;
  duration?: number;
  emoji: string;
  createdAt?: string;
}

export interface UserSettings {
  theme: Theme;
  themeId: ThemeID;
  defaultSoundId: string;
  defaultCategory: ReminderCategory;
  defaultColor: string;
  snoozeMinutes: number;
  hapticFeedback: boolean;
  showCompletedReminders: boolean;
}

export interface CategoryInfo {
  id: ReminderCategory;
  label: string;
  emoji: string;
  color: string;
}

export type ReminderFormData = Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'notificationIds' | 'isCompleted'>;
