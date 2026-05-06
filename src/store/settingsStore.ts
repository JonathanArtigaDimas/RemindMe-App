import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserSettings, ReminderCategory, ThemeID } from '../types';
import { DEFAULT_COLORS, CATEGORIES } from '../theme/colors';
import { BUILT_IN_SOUNDS } from '../constants/sounds';
import { fileStorage } from '../services/storageService';

interface SettingsState {
  settings: UserSettings;
  setTheme: (theme: UserSettings['theme']) => void;
  setThemeId: (themeId: UserSettings['themeId']) => void;
  setFontFamily: (fontFamily: UserSettings['fontFamily']) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setShowCompleted: (show: boolean) => void;
  setDefaultCategory: (categoryId: string) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  themeId: 'onyx',
  fontFamily: 'system',
  hapticFeedback: true,
  showCompletedReminders: true,
  defaultSoundId: BUILT_IN_SOUNDS[0].id,
  defaultCategory: 'personal' as ReminderCategory,
  defaultColor: DEFAULT_COLORS[0],
  snoozeMinutes: 10,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      setTheme: (theme) =>
        set((state) => ({ settings: { ...state.settings, theme } })),
      setThemeId: (themeId) =>
        set((state) => ({ settings: { ...state.settings, themeId } })),
      setFontFamily: (fontFamily) =>
        set((state) => ({ settings: { ...state.settings, fontFamily } })),
      setHapticFeedback: (hapticFeedback) =>
        set((state) => ({ settings: { ...state.settings, hapticFeedback } })),
      setShowCompleted: (showCompletedReminders) =>
        set((state) => ({ settings: { ...state.settings, showCompletedReminders } })),
      setDefaultCategory: (defaultCategory) =>
        set((state) => ({ settings: { ...state.settings, defaultCategory: defaultCategory as ReminderCategory } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'user-settings',
      storage: createJSONStorage(() => fileStorage),
    }
  )
);
