import { ReminderCategory } from '../types';

export const COLORS = {
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4A42CC',
  secondary: '#FF6B9D',
  success: '#4ECDC4',
  warning: '#FFD93D',
  error: '#FF6B6B',
  white: '#FFFFFF',
  black: '#000000',

  dark: {
    background: '#0F0F23',
    card: '#1A1A2E',
    surface: '#16213E',
    border: '#2A2A4A',
    text: '#FFFFFF',
    textSecondary: '#A0A0C0',
    textTertiary: '#6B6B8A',
    tabBar: '#1A1A2E',
    input: '#1E1E36',
    overlay: 'rgba(0,0,0,0.7)',
  },

  light: {
    background: '#F8F9FF',
    card: '#FFFFFF',
    surface: '#EEF0FF',
    border: '#E0E0F0',
    text: '#1A1A2E',
    textSecondary: '#4A4A6A',
    textTertiary: '#9B9BB8',
    tabBar: '#FFFFFF',
    input: '#F0F0FF',
    overlay: 'rgba(0,0,0,0.5)',
  },

  categories: {
    personal: '#6C63FF',
    work: '#4ECDC4',
    health: '#FF6B9D',
    finance: '#FFD93D',
    family: '#FF8C69',
    other: '#95A5A6',
  } as Record<ReminderCategory, string>,

  palette: [
    '#6C63FF', '#FF6B9D', '#4ECDC4', '#FFD93D',
    '#FF8C69', '#95A5A6', '#48CAE4', '#06D6A0',
    '#EF476F', '#F9844A', '#90BE6D', '#577590',
  ],
};

export const CATEGORIES = {
  PERSONAL: 'personal',
  WORK: 'work',
  HEALTH: 'health',
  FINANCE: 'finance',
  FAMILY: 'family',
  OTHER: 'other',
} as const;

export const DEFAULT_COLORS = COLORS.palette;

export const CATEGORY_INFO = [
  { id: CATEGORIES.PERSONAL as ReminderCategory, label: 'Personal', emoji: '👤', color: COLORS.categories.personal },
  { id: CATEGORIES.WORK as ReminderCategory, label: 'Trabajo', emoji: '💼', color: COLORS.categories.work },
  { id: CATEGORIES.HEALTH as ReminderCategory, label: 'Salud', emoji: '❤️', color: COLORS.categories.health },
  { id: CATEGORIES.FINANCE as ReminderCategory, label: 'Finanzas', emoji: '💰', color: COLORS.categories.finance },
  { id: CATEGORIES.FAMILY as ReminderCategory, label: 'Familia', emoji: '👨‍👩‍👧', color: COLORS.categories.family },
  { id: CATEGORIES.OTHER as ReminderCategory, label: 'Otro', emoji: '📌', color: COLORS.categories.other },
];
