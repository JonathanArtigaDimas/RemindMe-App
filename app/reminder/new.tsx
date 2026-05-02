import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ReminderForm } from '../../src/components/reminder/ReminderForm';
import { useReminderStore } from '../../src/store/reminderStore';
import { notificationService } from '../../src/services/notificationService';
import { COLORS, SPACING, TYPOGRAPHY, useThemeColors } from '../../src/theme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { ReminderFormData } from '../../src/types';

export default function NewReminderScreen() {
  const router = useRouter();
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.theme);
  const { addReminder, setNotificationIds } = useReminderStore();

  const handleSubmit = async (data: ReminderFormData) => {
    // 1. Save to store
    const reminder = addReminder(data);
    
    // 2. Schedule notification
    if (reminder.isActive) {
      const ids = await notificationService.scheduleReminder(reminder);
      setNotificationIds(reminder.id, ids);
    }
    
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Nuevo Recordatorio</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <ReminderForm 
        onSubmit={handleSubmit}
        submitLabel="Crear Recordatorio"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
