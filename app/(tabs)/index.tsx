import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, useThemeColors, RADIUS } from '../../src/theme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useReminderStore } from '../../src/store/reminderStore';
import { notificationService } from '../../src/services/notificationService';
import { ReminderCard } from '../../src/components/reminder/ReminderCard';
import { EmptyState } from '../../src/components/common/EmptyState';
import { Reminder } from '../../src/types';
import { formatDayLabel } from '../../src/utils/dateHelpers';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const router = useRouter();
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.theme);
  const {
    reminders, getTodayReminders, getUpcomingReminders,
    toggleComplete, deleteReminder, setNotificationIds,
  } = useReminderStore();

  const todayItems = getTodayReminders();
  const upcomingItems = getUpcomingReminders(7);

  const handleComplete = useCallback(async (reminder: Reminder) => {
    if (settings.hapticFeedback) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!reminder.isCompleted && reminder.notificationIds.length > 0) {
      await notificationService.cancelNotifications(reminder.notificationIds);
    }
    toggleComplete(reminder.id);
  }, [settings.hapticFeedback, toggleComplete]);

  const handleDelete = useCallback((reminder: Reminder) => {
    Alert.alert(
      'Eliminar recordatorio',
      `¿Eliminar "${reminder.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await notificationService.cancelNotifications(reminder.notificationIds);
            deleteReminder(reminder.id);
          },
        },
      ]
    );
  }, [deleteReminder]);

  // Grouped sections
  type Section = { title: string; data: Reminder[] };
  const sections: Section[] = [];
  if (todayItems.length > 0) sections.push({ title: '📅 Hoy', data: todayItems });
  if (upcomingItems.length > 0) sections.push({ title: '🗓️ Próximos 7 días', data: upcomingItems });

  const allEmpty = todayItems.length === 0 && upcomingItems.length === 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {new Date().getHours() < 12 ? '☀️ Buenos días Amor ❤️' : new Date().getHours() < 18 ? '🌤️ Buenas tardes Amor ❤️' : '🌙 Buenas noches Amor ❤️'}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Mis Recordatorios</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{reminders.length}</Text>
        </View>
      </View>

      {/* Content */}
      {allEmpty ? (
        <EmptyState
          emoji="🎉"
          title="Sin recordatorios pendientes"
          subtitle="Toca el botón + para crear tu primer recordatorio."
        />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.title}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: section }) => (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {section.title}
              </Text>
              {section.data.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onPress={() => router.push(`/reminder/${reminder.id}`)}
                  onComplete={() => handleComplete(reminder)}
                  onDelete={() => handleDelete(reminder)}
                />
              ))}
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/reminder/new')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  greeting: { fontSize: TYPOGRAPHY.sizes.sm, marginBottom: 2 },
  title: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: TYPOGRAPHY.weights.extrabold },
  headerBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: { color: '#fff', fontWeight: TYPOGRAPHY.weights.bold, fontSize: TYPOGRAPHY.sizes.md },
  list: { paddingHorizontal: SPACING.base, paddingBottom: 100 },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: SPACING.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});
