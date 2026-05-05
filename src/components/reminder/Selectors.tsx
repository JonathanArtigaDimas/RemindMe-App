import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, useThemeColors } from '../../theme';
import { CATEGORY_INFO } from '../../theme/colors';
import { useSettingsStore } from '../../store/settingsStore';
import { RecurrenceType, RecurrenceConfig, ReminderCategory } from '../../types';

// ── Category Selector ────────────────────────────────────────
interface CategorySelectorProps {
  value: ReminderCategory;
  onChange: (cat: ReminderCategory) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.themeId);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
      {CATEGORY_INFO.map((cat) => {
        const selected = value === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onChange(cat.id)}
            style={[
              styles.catChip,
              {
                backgroundColor: selected ? cat.color : colors.surface,
                borderColor: cat.color,
              },
            ]}
          >
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text
              style={[
                styles.catLabel,
                { color: selected ? colors.textOnSurface : colors.text },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── Color Selector ───────────────────────────────────────────
interface ColorSelectorProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorSelector({ value, onChange }: ColorSelectorProps) {
  return (
    <View style={styles.colorRow}>
      {COLORS.palette.map((color) => (
        <TouchableOpacity
          key={color}
          onPress={() => onChange(color)}
          style={[styles.colorDot, { backgroundColor: color }]}
        >
          {value === color && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Recurrence Selector ──────────────────────────────────────
const DAYS_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const RECURRENCE_OPTIONS: { type: RecurrenceType; label: string }[] = [
  { type: 'none', label: 'Sin repetición' },
  { type: 'daily', label: 'Diario' },
  { type: 'weekly', label: 'Semanal' },
  { type: 'monthly', label: 'Mensual' },
  { type: 'custom', label: 'Personalizado' },
];

interface RecurrenceSelectorProps {
  value: RecurrenceConfig;
  onChange: (cfg: RecurrenceConfig) => void;
}

export function RecurrenceSelector({ value, onChange }: RecurrenceSelectorProps) {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.themeId);

  const setType = (type: RecurrenceType) => onChange({ ...value, type });
  const toggleDay = (day: number) => {
    const days = value.daysOfWeek || [];
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    onChange({ ...value, daysOfWeek: next.sort() });
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recScroll}>
        {RECURRENCE_OPTIONS.map((opt) => {
          const sel = value.type === opt.type;
          return (
            <TouchableOpacity
              key={opt.type}
              onPress={() => setType(opt.type)}
              style={[
                styles.recChip,
                {
                  backgroundColor: sel ? COLORS.primary : colors.surface,
                  borderColor: sel ? COLORS.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.recLabel, { color: sel ? colors.textOnSurface : colors.text }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {value.type === 'weekly' && (
        <View style={styles.daysRow}>
          {DAYS_SHORT.map((day, i) => {
            const sel = (value.daysOfWeek || []).includes(i);
            return (
              <TouchableOpacity
                key={i}
                onPress={() => toggleDay(i)}
                style={[
                  styles.dayBtn,
                  { backgroundColor: sel ? COLORS.primary : colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.dayLabel, { color: sel ? '#fff' : colors.text }]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  catScroll: { flexGrow: 0, marginBottom: SPACING.sm },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
  },
  catEmoji: { fontSize: 16, marginRight: 4 },
  catLabel: { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium },

  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recScroll: { flexGrow: 0, marginBottom: SPACING.sm },
  recChip: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    marginRight: SPACING.sm,
  },
  recLabel: { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium },

  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  dayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.bold },
});
