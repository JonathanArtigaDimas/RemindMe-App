import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, TYPOGRAPHY, RADIUS, useThemeColors } from '../../theme';
import { Reminder } from '../../types';
import { CATEGORY_INFO } from '../../theme/colors';
import { useReminderStore } from '../../store/reminderStore';
import { useSettingsStore } from '../../store/settingsStore';
import { notificationService } from '../../services/notificationService';

interface ReminderAlertProps {
  visible: boolean;
  reminder: Reminder | null;
  onDismiss: () => void;
}

const { height } = Dimensions.get('window');

export function ReminderAlert({ visible, reminder, onDismiss }: ReminderAlertProps) {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.themeId);
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!reminder) return null;

  const catInfo = CATEGORY_INFO.find((c) => c.id === reminder.category);

  const handleComplete = () => {
    useReminderStore.getState().toggleComplete(reminder.id);
    onDismiss();
  };

  const handleSnooze = async () => {
    const newDate = new Date(Date.now() + 10 * 60000).toISOString();
    useReminderStore.getState().updateReminder(reminder.id, { datetime: newDate });
    const ids = await notificationService.scheduleReminder({ ...reminder, datetime: newDate });
    useReminderStore.getState().setNotificationIds(reminder.id, ids);
    onDismiss();
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={[styles.overlay, { backgroundColor: colors.background + 'EE' }]}>
        <Animated.View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border, opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Animated.View style={[styles.ring, { transform: [{ scale: pulseAnim }], borderColor: colors.primary }]} />
              <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                <Ionicons name={catInfo?.icon as any || 'alarm-outline'} size={50} color="#FFF" />
              </View>
            </View>

            <Text style={[styles.urgentText, { color: colors.textSecondary }]}>RECORDATORIO</Text>
            <Text style={[styles.title, { color: colors.textOnSurface }]}>{reminder.title}</Text>
            {reminder.description && (
              <Text style={[styles.description, { color: colors.textSecondary }]}>{reminder.description}</Text>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.mainButton, { backgroundColor: colors.primary }]} onPress={handleComplete}>
                <Ionicons name="checkmark-circle-outline" size={28} color="#FFF" />
                <Text style={styles.buttonText}>Hecho</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.snoozeButton, { borderColor: colors.textOnSurface }]} onPress={handleSnooze}>
                <Ionicons name="notifications-off-outline" size={24} color={colors.textOnSurface} />
                <Text style={[styles.snoozeText, { color: colors.textOnSurface }]}>Posponer 10 min</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    top: -10,
    left: -10,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontStyle: 'italic',
  },
  actions: {
    width: '100%',
    gap: SPACING.md,
  },
  mainButton: {
    width: '100%',
    height: 60,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  snoozeButton: {
    width: '100%',
    height: 50,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
  },
  snoozeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
