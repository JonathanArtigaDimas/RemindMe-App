import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import uuid from 'react-native-uuid';
import { Reminder, ReminderFormData } from '../types';
import { isToday, isWithinInterval, addDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { fileStorage } from '../services/storageService';

interface ReminderState {
  reminders: Reminder[];
  addReminder: (data: ReminderFormData) => Reminder;
  updateReminder: (id: string, data: Partial<ReminderFormData>) => void;
  deleteReminder: (id: string) => void;
  toggleComplete: (id: string) => void;
  setNotificationIds: (id: string, notificationIds: string[]) => void;
  clearCompleted: () => void;
  // Getters
  getReminderById: (id: string) => Reminder | undefined;
  getTodayReminders: () => Reminder[];
  getUpcomingReminders: (days: number) => Reminder[];
  getByDate: (dateStr: string) => Reminder[];
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      reminders: [],
      addReminder: (data) => {
        const newReminder: Reminder = {
          ...data,
          id: uuid.v4() as string,
          isCompleted: false,
          notificationIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ reminders: [newReminder, ...state.reminders] }));
        return newReminder;
      },
      updateReminder: (id, data) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
          ),
        })),
      deleteReminder: (id) =>
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        })),
      toggleComplete: (id) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
          ),
        })),
      setNotificationIds: (id, notificationIds) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, notificationIds } : r
          ),
        })),
      clearCompleted: () =>
        set((state) => ({
          reminders: state.reminders.filter((r) => !r.isCompleted),
        })),
      
      getReminderById: (id) => get().reminders.find((r) => r.id === id),
      
      getTodayReminders: () => {
        const { reminders } = get();
        return reminders.filter((r) => isToday(parseISO(r.datetime)));
      },
      
      getUpcomingReminders: (days) => {
        const { reminders } = get();
        const start = startOfDay(addDays(new Date(), 1));
        const end = endOfDay(addDays(new Date(), days));
        return reminders.filter((r) => {
          const date = parseISO(r.datetime);
          return isWithinInterval(date, { start, end });
        });
      },

      getByDate: (dateStr) => {
        const { reminders } = get();
        return reminders.filter((r) => r.datetime.startsWith(dateStr));
      },
    }),
    {
      name: 'reminders-storage',
      storage: createJSONStorage(() => fileStorage),
    }
  )
);
