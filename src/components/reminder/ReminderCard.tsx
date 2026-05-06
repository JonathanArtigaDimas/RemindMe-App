import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, useThemeColors } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../store/settingsStore';
import { Reminder } from '../../types';
import { formatTime, formatDayLabel } from '../../utils/dateHelpers';
import { CATEGORY_INFO } from '../../theme/colors';

interface ReminderCardProps {
  reminder: Reminder;
  onPress: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

export function ReminderCard({ reminder, onPress, onComplete, onDelete }: ReminderCardProps) {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.themeId);
  const catInfo = CATEGORY_INFO.find((c) => c.id === reminder.category);
  const fontStyle = { fontFamily: TYPOGRAPHY.getFontFamily(settings.fontFamily) };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderLeftColor: reminder.color,
          },
          reminder.isCompleted && { opacity: 0.55 },
        ]}
      >
        {/* Left accent line is via borderLeftColor */}
        <View style={styles.row}>
          {/* Complete button */}
          <TouchableOpacity
            onPress={onComplete}
            style={[
              styles.checkCircle,
              {
                borderColor: reminder.color,
                backgroundColor: reminder.isCompleted ? reminder.color : 'transparent',
              },
            ]}
          >
            {reminder.isCompleted && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </TouchableOpacity>
 
          {/* Content */}
          <View style={styles.content}>
            <Text
              style={[
                styles.title,
                { color: colors.textOnSurface },
                reminder.isCompleted && styles.strikethrough,
                fontStyle
              ]}
              numberOfLines={1}
            >
              {reminder.title}
            </Text>
            {reminder.description ? (
              <Text style={[styles.desc, { color: colors.textSecondary }, fontStyle]} numberOfLines={1}>
                {reminder.description}
              </Text>
            ) : null}
            <View style={styles.meta}>
              <View style={[styles.categoryDot, { backgroundColor: catInfo?.color || reminder.color }]} />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.metaText, { color: colors.textSecondary, marginRight: 4 }]}>
                  {catInfo?.emoji}
                </Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }, fontStyle]}>
                  {catInfo?.label}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.metaText, { color: colors.textOnSurface, marginRight: 4 }]}>
                  {'  '}🕐
                </Text>
                <Text style={[styles.metaText, { color: colors.textOnSurface }, fontStyle]}>
                  {formatTime(reminder.datetime)}
                </Text>
              </View>
            </View>
          </View>
 
          {/* Delete button */}
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: SPACING.md,
    padding: SPACING.base,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 2,
  },
  strikethrough: { textDecorationLine: 'line-through' },
  desc: { fontSize: TYPOGRAPHY.sizes.sm, marginBottom: SPACING.xs },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  categoryDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  metaText: { fontSize: TYPOGRAPHY.sizes.xs },
  deleteBtn: { padding: SPACING.xs, marginLeft: SPACING.sm },
});
