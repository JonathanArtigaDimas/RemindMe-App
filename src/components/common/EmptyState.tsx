import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, useThemeColors } from '../../theme';
import { useSettingsStore } from '../../store/settingsStore';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ emoji = '📭', title, subtitle }: EmptyStateProps) {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.theme);
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxl },
  emoji: { fontSize: 64, marginBottom: SPACING.lg },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.base * 1.5,
  },
});
