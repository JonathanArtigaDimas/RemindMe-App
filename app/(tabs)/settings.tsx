import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, useThemeColors } from '../../src/theme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useReminderStore } from '../../src/store/reminderStore';
import { Card, SectionHeader } from '../../src/components/ui/Card';
import { useRouter } from 'expo-router';
import { notificationService } from '../../src/services/notificationService';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, setTheme, setHapticFeedback, setShowCompleted, resetSettings } = useSettingsStore();
  const { clearCompleted, reminders } = useReminderStore();
  const colors = useThemeColors(settings.theme);

  const handleReset = () => {
    Alert.alert(
      'Restablecer ajustes',
      '¿Estás seguro de que quieres volver a la configuración inicial?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restablecer', style: 'destructive', onPress: resetSettings },
      ]
    );
  };

  const handleClearCompleted = () => {
    const completedCount = reminders.filter(r => r.isCompleted).length;
    if (completedCount === 0) {
      Alert.alert('Info', 'No hay recordatorios completados para eliminar.');
      return;
    }
    Alert.alert(
      'Limpiar completados',
      `¿Quieres eliminar los ${completedCount} recordatorios completados?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: clearCompleted },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>⚙️ Ajustes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="Apariencia" />
        <Card noPadding>
          <View style={styles.listItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="moon-outline" size={22} color={COLORS.primary} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Modo Oscuro</Text>
            </View>
            <Switch
              value={settings.theme === 'dark'}
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: COLORS.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => setTheme('system')}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="phone-portrait-outline" size={22} color={COLORS.primary} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Usar ajuste del sistema</Text>
            </View>
            {settings.theme === 'system' && (
              <Ionicons name="checkmark" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </Card>

        <SectionHeader title="Notificaciones y Sonido" />
        <Card noPadding>
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => router.push('/sounds')}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="musical-notes-outline" size={22} color={COLORS.secondary} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Gestionar Sonidos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.listItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.secondary} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Vibración (Haptic)</Text>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={setHapticFeedback}
              trackColor={{ false: colors.border, true: COLORS.secondary }}
            />
          </View>
        </Card>

        <SectionHeader title="Datos" />
        <Card noPadding>
          <View style={styles.listItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="eye-outline" size={22} color={COLORS.success} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Mostrar completados</Text>
            </View>
            <Switch
              value={settings.showCompletedReminders}
              onValueChange={setShowCompleted}
              trackColor={{ false: colors.border, true: COLORS.success }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.listItem} onPress={handleClearCompleted}>
            <View style={styles.itemLeft}>
              <Ionicons name="trash-outline" size={22} color={COLORS.error} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Limpiar completados</Text>
            </View>
          </TouchableOpacity>
        </Card>

        <SectionHeader title="Solución de Problemas" />
        <Card noPadding>
          <TouchableOpacity 
            style={styles.listItem} 
            onPress={() => notificationService.testNotification()}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="bug-outline" size={22} color={COLORS.warning} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Probar Notificación (5s)</Text>
            </View>
            <Ionicons name="flask-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        <SectionHeader title="General" />
        <Card noPadding>
          <TouchableOpacity style={styles.listItem} onPress={handleReset}>
            <View style={styles.itemLeft}>
              <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Restablecer aplicación</Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.listItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Versión</Text>
            </View>
            <Text style={{ color: colors.textTertiary }}>1.0.0</Text>
          </View>
        </Card>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Derechos reservados, Lic. Castro de Artiga ❤️
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: SPACING.base, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  title: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: TYPOGRAPHY.weights.extrabold },
  content: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    height: 56,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  itemLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  divider: {
    height: 1,
    marginHorizontal: SPACING.md,
  },
  footer: {
    marginTop: SPACING.xxl,
    alignItems: 'center',
    paddingBottom: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
});
