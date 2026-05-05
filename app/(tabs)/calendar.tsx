import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, useThemeColors } from '../../src/theme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useReminderStore } from '../../src/store/reminderStore';
import { notificationService } from '../../src/services/notificationService';
import { ReminderCard } from '../../src/components/reminder/ReminderCard';
import { EmptyState } from '../../src/components/common/EmptyState';
import { Reminder } from '../../src/types';
import { CATEGORY_INFO } from '../../src/theme/colors';
import { formatTime, toDate } from '../../src/utils/dateHelpers';

export default function CalendarScreen() {
  const router = useRouter();
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.theme);
  const { reminders, getByDate, toggleComplete, deleteReminder } = useReminderStore();

  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [modalVisible, setModalVisible] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Build marked dates
  const markedDates: Record<string, any> = {};
  reminders.forEach((r) => {
    const day = toDate(r.datetime).toISOString().split('T')[0];
    const catInfo = CATEGORY_INFO.find((c) => c.id === r.category);
    const dots = markedDates[day]?.dots || [];
    const dotColor = r.color || catInfo?.color || COLORS.primary;
    const alreadyDot = dots.find((d: any) => d.color === dotColor);
    if (!alreadyDot && dots.length < 3) {
      dots.push({ key: r.id, color: dotColor });
    }
    markedDates[day] = {
      ...(markedDates[day] || {}),
      dots,
      marked: true,
    };
  });

  // Selected day highlight
  markedDates[selectedDay] = {
    ...(markedDates[selectedDay] || {}),
    selected: true,
    selectedColor: COLORS.primary,
  };

  const dayReminders = getByDate(selectedDay);

  const onDayPress = (day: DateData) => {
    setSelectedDay(day.dateString);
    setModalVisible(true);
  };

  const handleComplete = async (reminder: Reminder) => {
    if (!reminder.isCompleted && reminder.notificationIds.length > 0) {
      await notificationService.cancelNotifications(reminder.notificationIds);
    }
    toggleComplete(reminder.id);
  };

  const handleDelete = (reminder: Reminder) => {
    Alert.alert('Eliminar', `¿Eliminar "${reminder.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await notificationService.cancelNotifications(reminder.notificationIds);
          deleteReminder(reminder.id);
        },
      },
    ]);
  };

  const isDark = settings.theme === 'dark';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>📅 Calendario</Text>
      </View>

      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={onDayPress}
        current={todayStr}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.textSecondary,
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: '#fff',
          todayTextColor: COLORS.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.textTertiary,
          dotColor: COLORS.primary,
          selectedDotColor: '#fff',
          arrowColor: COLORS.primary,
          disabledArrowColor: colors.border,
          monthTextColor: colors.text,
          indicatorColor: COLORS.primary,
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
          textMonthFontSize: 17,
          textDayHeaderFontWeight: '600',
        }}
        style={styles.calendar}
      />

      {/* Day Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {selectedDay === todayStr ? '📅 Hoy' : selectedDay}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {dayReminders.length === 0 ? (
              <EmptyState
                emoji="✨"
                title="Sin recordatorios"
                subtitle="Toca + para añadir uno en este día."
              />
            ) : (
              <FlatList
                data={dayReminders}
                keyExtractor={(r) => r.id}
                contentContainerStyle={{ paddingBottom: SPACING.xl }}
                renderItem={({ item }) => (
                  <ReminderCard
                    reminder={item}
                    onPress={() => { setModalVisible(false); router.push(`/reminder/${item.id}`); }}
                    onComplete={() => handleComplete(item)}
                    onDelete={() => handleDelete(item)}
                  />
                )}
              />
            )}

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => { setModalVisible(false); router.push('/reminder/new'); }}
            >
              <Ionicons name="add" size={26} color="#fff" />
              <Text style={styles.addBtnText}>Nuevo recordatorio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: SPACING.base, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  title: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: TYPOGRAPHY.weights.extrabold },
  calendar: { marginHorizontal: SPACING.sm, borderRadius: RADIUS.lg },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.base,
    minHeight: '50%',
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#ccc', alignSelf: 'center', marginBottom: SPACING.md,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  sheetTitle: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginTop: SPACING.sm, gap: SPACING.sm,
  },
  addBtnText: { color: '#fff', fontWeight: TYPOGRAPHY.weights.semibold, fontSize: TYPOGRAPHY.sizes.base },
});
