import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Dimensions,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS, useThemeColors, THEMES } from '../../src/theme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useReminderStore } from '../../src/store/reminderStore';
import { Card, SectionHeader } from '../../src/components/ui/Card';
import { ThemeID } from '../../src/types';
import { useRouter } from 'expo-router';
import { notificationService } from '../../src/services/notificationService';

const { width } = Dimensions.get('window');

const THEME_OPTIONS: { id: ThemeID; name: string; icon: string; description: string }[] = [
  { id: 'onyx', name: 'Onyx Pro', icon: 'shield-half-outline', description: 'Oscuro profesional' },
  { id: 'arctic', name: 'Arctic Pro', icon: 'snow-outline', description: 'Limpio y claro' },
  { id: 'solar', name: 'Solar Flare', icon: 'sunny-outline', description: 'Energía naranja' },
  { id: 'cyber', name: 'Cyber Neon', icon: 'flash-outline', description: 'Estilo neón' },
  { id: 'ocean', name: 'Ocean Breeze', icon: 'water-outline', description: 'Calma marina' },
  { id: 'midnight', name: 'Midnight OLED', icon: 'moon-outline', description: 'Negro puro' },
  { id: 'glass', name: 'Frosted Glass', icon: 'layers-outline', description: 'Cristal moderno' },
  { id: 'sakura', name: 'Sakura Dream', icon: 'flower-outline', description: 'Rosa premium' },
  { id: 'coffee_milk', name: 'Coffee Milk', icon: 'cafe-outline', description: 'Beige estético' },
  { id: 'noir', name: 'Noir Mono', icon: 'contrast-outline', description: 'Blanco y Negro' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, setThemeId, setHapticFeedback, setShowCompleted, resetSettings } = useSettingsStore();
  const { clearCompleted, reminders } = useReminderStore();
  const colors = useThemeColors(settings.themeId);

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>🎨 Personalización</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="Temas Premium" />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.themesContainer}
        >
          {THEME_OPTIONS.map((theme) => {
            const themeColors = THEMES[theme.id];
            const isSelected = settings.themeId === theme.id;
            
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  { 
                    backgroundColor: themeColors.surface,
                    borderColor: isSelected ? themeColors.primary : themeColors.border,
                    borderWidth: isSelected ? 2 : 1
                  }
                ]}
                onPress={() => setThemeId(theme.id)}
              >
                <View style={[styles.themeIcon, { backgroundColor: themeColors.primary }]}>
                  <Ionicons name={theme.icon as any} size={24} color="#FFF" />
                </View>
                <Text style={[styles.themeName, { color: themeColors.text }]}>{theme.name}</Text>
                <Text style={[styles.themeDesc, { color: themeColors.textSecondary }]}>{theme.description}</Text>
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: themeColors.primary }]}>
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <SectionHeader title="Sonidos de Notificación" />
        <Card noPadding>
          {['🔔 Clásico', '🎵 Melodía', '✨ Aviso', '🎺 Trompeta'].map((sound, index) => {
            const isSelected = index === 0; // Por ahora seleccionamos el primero
            return (
              <React.Fragment key={sound}>
                <TouchableOpacity style={styles.listItem} onPress={() => {
                  notificationService.testNotification();
                  ToastAndroid.show(`Prueba de "${sound}" enviada`, ToastAndroid.SHORT);
                }}>
                  <View style={styles.itemLeft}>
                    <Ionicons name="musical-note-outline" size={22} color={colors.textOnSurface} />
                    <Text style={[styles.itemLabel, { color: colors.textOnSurface }]}>{sound}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark" size={20} color={colors.textOnSurface} />}
                </TouchableOpacity>
                {index < 3 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            );
          })}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity 
            style={styles.listItem} 
            onPress={() => router.push('/sounds')}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="mic-circle-outline" size={22} color={colors.textOnSurface} />
              <Text style={[styles.itemLabel, { color: colors.textOnSurface, fontWeight: 'bold' }]}>
                Biblioteca y Grabadora de Voz
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textOnSurface} />
          </TouchableOpacity>
        </Card>

        <SectionHeader title="Ajustes de Sistema" />
        <Card noPadding>
          <View style={styles.listItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="pulse-outline" size={22} color={colors.primary} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Vibración táctil</Text>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={setHapticFeedback}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </Card>

        <SectionHeader title="Mantenimiento" />
        <Card noPadding>
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => {
              const count = reminders.filter(r => r.isCompleted).length;
              if (count > 0) clearCompleted();
              else Alert.alert('Info', 'No hay nada que limpiar');
            }}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
              <Text style={[styles.itemLabel, { color: colors.error }]}>Limpiar completados</Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.listItem}
            onPress={handleReset}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.itemLabel, { color: colors.textSecondary }]}>Restablecer todo</Text>
            </View>
          </TouchableOpacity>
        </Card>

        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.textSecondary }]}>RemindMe Premium v1.0.34</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  themesContainer: {
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  themeCard: {
    width: width * 0.4,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    position: 'relative',
    marginRight: SPACING.sm,
  },
  themeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.base,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginHorizontal: SPACING.base,
  },
  footer: {
    marginTop: SPACING.xxxl,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    opacity: 0.6,
  },
});
