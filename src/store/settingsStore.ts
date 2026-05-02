import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserSettings } from '../types';
import { DEFAULT_COLORS, CATEGORIES } from '../theme/colors';
import { BUILT_IN_SOUNDS } from '../constants/sounds';
import { fileStorage } from '../services/storageService';

interface SettingsState {
  settings: UserSettings;
  setTheme: (theme: UserSettings['theme']) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setShowCompleted: (show: boolean) => void;
  setDefaultCategory: (categoryId: string) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  hapticFeedback: true,
  showCompletedReminders: true,
  defaultSoundId: BUILT_IN_SOUNDS[0].id,
  defaultCategory: CATEGORIES.PERSONAL,
  defaultColor: DEFAULT_COLORS[0],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      setTheme: (theme) =>
        set((state) => ({ settings: { ...state.settings, theme } })),
      setHapticFeedback: (hapticFeedback) =>
        set((state) => ({ settings: { ...state.settings, hapticFeedback } })),
      setShowCompleted: (showCompletedReminders) =>
        set((state) => ({ settings: { ...state.settings, showCompletedReminders } })),
      setDefaultCategory: (defaultCategory) =>
        set((state) => ({ settings: { ...state.settings, defaultCategory } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'user-settings',
      storage: createJSONStorage(() => fileStorage),
    }
  )
);
