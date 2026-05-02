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
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!reminder) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        {/* Blur fallback */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
        
        <Animated.View 
          style={[
            styles.container, 
            { 
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              backgroundColor: reminder.color || COLORS.primary,
            }
          ]}
        >
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Text style={styles.emoji}>
                {CATEGORY_INFO.find(c => c.id === reminder.category)?.emoji || '🔔'}
              </Text>
            </View>
            
            <Text style={styles.title}>{reminder.title}</Text>
            
            {reminder.description ? (
              <Text style={styles.description}>{reminder.description}</Text>
            ) : null}
            
            <View style={styles.timeBadge}>
              <Ionicons name="time" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.timeText}>¡Es la hora!</Text>
            </View>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={onDismiss} 
              style={styles.button}
            >
              <Text style={styles.buttonText}>Completar</Text>
              <Ionicons name="checkmark-circle" size={24} color={reminder.color || COLORS.primary} />
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
              style={[styles.button, styles.snoozeButton]}
            >
              <Text style={[styles.buttonText, { color: '#FFF' }]}>Posponer 10 min</Text>
              <Ionicons name="time" size={24} color="#FFF" />
            </TouchableOpacity>
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
    padding: SPACING.xl,
  },
  container: {
    width: '100%',
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  content: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xl,
  },
  timeText: {
    color: '#FFF',
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  button: {
    backgroundColor: '#FFF',
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#333',
  },
  snoozeButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});
