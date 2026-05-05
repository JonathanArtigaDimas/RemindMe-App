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
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../theme';
import { Reminder } from '../../types';
import { CATEGORY_INFO } from '../../theme/colors';
import { useReminderStore } from '../../store/reminderStore';
import { notificationService } from '../../services/notificationService';

interface ReminderAlertProps {
  visible: boolean;
  reminder: Reminder | null;
  onDismiss: () => void;
}

const { height } = Dimensions.get('window');

export function ReminderAlert({ visible, reminder, onDismiss }: ReminderAlertProps) {
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulsing loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  if (!reminder) return null;

  const category = CATEGORY_INFO.find(c => c.id === reminder.category);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.fullBg, 
            { 
              backgroundColor: reminder.color || COLORS.primary,
              opacity: opacityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.98],
              }),
            }
          ]} 
        />
        
        <Animated.View 
          style={[
            styles.container, 
            { 
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            }
          ]}
        >
          <View style={styles.content}>
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.iconCircle}>
                <Text style={styles.emoji}>{category?.emoji || '🔔'}</Text>
              </View>
              <View style={styles.ring} />
            </Animated.View>
            
            <Text style={styles.urgentText}>¡RECORDATORIO!</Text>
            <Text style={styles.title}>{reminder.title}</Text>
            
            {reminder.description ? (
              <Text style={styles.description}>{reminder.description}</Text>
            ) : null}
            
            <View style={styles.actions}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={onDismiss} 
                style={[styles.mainButton, { backgroundColor: '#FFF' }]}
              >
                <Ionicons name="checkmark-done" size={28} color={reminder.color || COLORS.primary} />
                <Text style={[styles.buttonText, { color: reminder.color || COLORS.primary }]}>Hecho</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={async () => {
                  const newDate = new Date(Date.now() + 10 * 60000).toISOString();
                  useReminderStore.getState().updateReminder(reminder.id, { datetime: newDate });
                  const ids = await notificationService.scheduleReminder({ ...reminder, datetime: newDate });
                  useReminderStore.getState().setNotificationIds(reminder.id, ids);
                  onDismiss();
                }} 
                style={styles.snoozeButton}
              >
                <Ionicons name="notifications-off" size={24} color="#FFF" />
                <Text style={styles.snoozeText}>Posponer 10 min</Text>
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
  fullBg: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
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
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    elevation: 10,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    top: -10,
    left: -10,
  },
  emoji: {
    fontSize: 50,
  },
  urgentText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.extrabold,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 4,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.weights.extrabold,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: 'rgba(255,255,255,0.9)',
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
    height: 65,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    elevation: 5,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  snoozeButton: {
    width: '100%',
    height: 55,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  snoozeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
