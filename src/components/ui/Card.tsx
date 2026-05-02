import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY, useThemeColors } from '../../theme';
import { useSettingsStore } from '../../store/settingsStore';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  accentColor?: string;
  noPadding?: boolean;
}

export function Card({ children, style, onPress, accentColor, noPadding }: CardProps) {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.theme);

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        accentColor && { borderLeftColor: accentColor, borderLeftWidth: 4 },
        !noPadding && styles.padding,
        SHADOWS.sm,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

interface SectionHeaderProps {
  title: string;
  right?: React.ReactNode;
}

export function SectionHeader({ title, right }: SectionHeaderProps) {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.theme);
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  padding: { padding: SPACING.base },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
