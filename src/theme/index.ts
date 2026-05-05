import { ThemeID, ReminderCategory } from '../types';

export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textOnSurface: string; // Nuevo: Texto específico para dentro de cuadros/botones
  textSecondary: string;
  textTertiary: string;
  tabBar: string;
  border: string;
  accent: string;
  error: string;
  success: string;
  isDark: boolean;
}

export const THEMES: Record<ThemeID, ThemeColors> = {
  onyx: {
    primary: '#3B82F6',
    background: '#0F172A',
    surface: '#1E293B',
    card: '#1E293B',
    text: '#F8FAFC',
    textOnSurface: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    tabBar: '#1E293B',
    border: '#334155',
    accent: '#60A5FA',
    error: '#EF4444',
    success: '#10B981',
    isDark: true,
  },
  arctic: {
    primary: '#1E40AF',
    background: '#F8FAFC',
    surface: '#1E40AF', // Cuadro azul
    card: '#1E40AF',
    text: '#0F172A', // Texto exterior oscuro (legible en inicio/calendario)
    textOnSurface: '#FFFFFF', // Texto interior blanco (pedido por el usuario)
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    tabBar: '#FFFFFF',
    border: '#E2E8F0',
    accent: '#3B82F6',
    error: '#EF4444',
    success: '#10B981',
    isDark: false,
  },
  solar: {
    primary: '#F59E0B',
    background: '#FFFBEB',
    surface: '#FEF3C7',
    card: '#FEF3C7',
    text: '#78350F',
    textOnSurface: '#78350F',
    textSecondary: '#B45309',
    textTertiary: '#D97706',
    tabBar: '#FEF3C7',
    border: '#FDE68A',
    accent: '#FBBF24',
    error: '#B91C1C',
    success: '#047857',
    isDark: false,
  },
  cyber: {
    primary: '#FF007F',
    background: '#0D0221',
    surface: '#1A0B2E',
    card: '#1A0B2E',
    text: '#FFFFFF',
    textOnSurface: '#FFFFFF',
    textSecondary: '#00F5FF',
    textTertiary: '#BD00FF',
    tabBar: '#0D0221',
    border: '#3D1C5C',
    accent: '#00F5FF',
    error: '#FF3131',
    success: '#39FF14',
    isDark: true,
  },
  ocean: {
    primary: '#0D9488',
    background: '#F0FDFA',
    surface: '#CCFBF1',
    card: '#CCFBF1',
    text: '#134E4A',
    textOnSurface: '#134E4A',
    textSecondary: '#0F766E',
    textTertiary: '#14B8A6',
    tabBar: '#CCFBF1',
    border: '#99F6E4',
    accent: '#2DD4BF',
    error: '#991B1B',
    success: '#065F46',
    isDark: false,
  },
  midnight: {
    primary: '#E11D48',
    background: '#000000',
    surface: '#121212',
    card: '#121212',
    text: '#FFFFFF',
    textOnSurface: '#FFFFFF',
    textSecondary: '#FDA4AF',
    textTertiary: '#4B5563',
    tabBar: '#000000',
    border: '#262626',
    accent: '#FB7185',
    error: '#F43F5E',
    success: '#10B981',
    isDark: true,
  },
  glass: {
    primary: '#8B5CF6',
    background: '#F5F3FF',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#4C1D95',
    textOnSurface: '#4C1D95',
    textSecondary: '#7C3AED',
    textTertiary: '#A78BFA',
    tabBar: '#FFFFFF',
    border: '#DDD6FE',
    accent: '#A78BFA',
    error: '#EF4444',
    success: '#10B981',
    isDark: false,
  },
  sakura: {
    primary: '#E11D48',
    background: '#FFF1F2',
    surface: '#FFE4E6',
    card: '#FFFFFF',
    text: '#4C0519',
    textOnSurface: '#4C0519',
    textSecondary: '#9F1239',
    textTertiary: '#FB7185',
    tabBar: '#FFF1F2',
    border: '#FECDD3',
    accent: '#FB7185',
    error: '#BE123C',
    success: '#10B981',
    isDark: false,
  },
  coffee_milk: {
    primary: '#8B5E3C', // Marrón café
    background: '#F5E6D3', // Fondo crema claro
    surface: '#E7D8C9', // Beige medio
    card: '#E7D8C9', // Tarjetas beige
    text: '#3E2723', // Café oscuro
    textOnSurface: '#3E2723',
    textSecondary: '#8D6E63',
    textTertiary: '#BCAAA4',
    tabBar: '#F5E6D3',
    border: '#D7C4B1',
    accent: '#A67C52',
    error: '#D32F2F',
    success: '#388E3C',
    isDark: false,
  },
  noir: {
    primary: '#FFFFFF', // Blanco sobre negro
    background: '#000000', // Negro puro
    surface: '#1A1A1A', // Gris muy oscuro
    card: '#1A1A1A',
    text: '#FFFFFF', // Blanco
    textOnSurface: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textTertiary: '#666666',
    tabBar: '#000000',
    border: '#333333',
    accent: '#FFFFFF',
    error: '#FF0000',
    success: '#FFFFFF',
    isDark: true,
  }
};

export function useThemeColors(themeId: ThemeID = 'onyx') {
  return THEMES[themeId] || THEMES.onyx;
}

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

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  }
};

export const COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  error: '#EF4444',
  palette: [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1',
    '#14B8A6', '#F97316', '#84CC16', '#64748B',
  ],
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};
