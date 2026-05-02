import { useColorScheme } from 'react-native';
import { COLORS } from './colors';
import { TYPOGRAPHY } from './typography';
import { Theme } from '../types';

export { COLORS, CATEGORY_INFO } from './colors';
export { TYPOGRAPHY } from './typography';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};

export function useThemeColors(theme: Theme) {
  const systemScheme = useColorScheme();
  const isDark =
    theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
  return isDark ? COLORS.dark : COLORS.light;
}
