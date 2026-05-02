import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Vibration, LogBox } from 'react-native';
import { useRouter } from 'expo-router';
import { notificationService } from '../src/services/notificationService';
import { audioService } from '../src/services/audioService';
import { reminderMonitor } from '../src/services/reminderMonitor';
import { ReminderAlert } from '../src/components/ui/ReminderAlert';
import { Reminder } from '../src/types';
import { useSettingsStore } from '../src/store/settingsStore';
import { useThemeColors } from '../src/theme';

import * as Notifications from 'expo-notifications';

// Configure how notifications should be handled when the app is running
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Ignore the push notification warning in Expo Go SDK 54 and AV deprecation
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'expo-av',
  'Method getInfoAsync',
  'Method makeDirectoryAsync',
  'Method writeAsStringAsync',
  'DateTimePicker: `onChange` is deprecated',
  'Expo Notifications not available',
]);

export default function RootLayout() {
  const router = useRouter();
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.theme);
  const isDark = settings.theme === 'dark' || settings.theme === 'system';

  const [activeReminder, setActiveReminder] = React.useState<Reminder | null>(null);
  const [alertVisible, setAlertVisible] = React.useState(false);

  useEffect(() => {
    // Setup notifications
    notificationService.requestPermissions().then((granted) => {
      if (granted) {
        notificationService.setupAndroidChannel();
        notificationService.setupNotificationCategories();
      }
    });

    // Setup audio
    audioService.configure();

    // Start foreground monitor with custom UI
    reminderMonitor.start((reminder) => {
      setActiveReminder(reminder);
      setAlertVisible(true);
    });

    // Handle notification press → navigate to reminder
    const sub = notificationService.setupResponseHandler((reminderId) => {
      router.push(`/reminder/${reminderId}`);
    });

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="reminder/new"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="reminder/[id]"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="sounds/index"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>

      <ReminderAlert
        visible={alertVisible}
        reminder={activeReminder}
        onDismiss={() => {
          setAlertVisible(false);
          Vibration.cancel();
          audioService.stopCurrentSound();
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
