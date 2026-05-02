import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ReminderForm } from '../../src/components/reminder/ReminderForm';
import { useReminderStore } from '../../src/store/reminderStore';
import { notificationService } from '../../src/services/notificationService';
import { COLORS, SPACING, TYPOGRAPHY, useThemeColors } from '../../src/theme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { ReminderFormData } from '../../src/types';

export default function EditReminderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.theme);
  const { getReminderById, updateReminder, deleteReminder, setNotificationIds } = useReminderStore();

  const reminder = getReminderById(id);

  if (!reminder) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No se encontró el recordatorio.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary, marginTop: 20 }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSubmit = async (data: ReminderFormData) => {
    // 1. Cancel old notifications
    if (reminder.notificationIds.length > 0) {
      await notificationService.cancelNotifications(reminder.notificationIds);
    }

    // 2. Update store
    updateReminder(id, data);
    
    // 3. Schedule new notifications
    if (data.isActive) {
      const updatedReminder = { ...reminder, ...data };
      const ids = await notificationService.scheduleReminder(updatedReminder);
      setNotificationIds(id, ids);
    }
    
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Eliminar', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Eliminar', 
        style: 'destructive', 
        onPress: async () => {
          await notificationService.cancelNotifications(reminder.notificationIds);
          deleteReminder(id);
          router.back();
        } 
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Editar Recordatorio</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.backBtn}>
          <Ionicons name="trash-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>
      
      <ReminderForm 
        initialData={reminder}
        onSubmit={handleSubmit}
        submitLabel="Guardar Cambios"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.base,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
