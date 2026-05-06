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
import { useReminderStore } from '../src/store/reminderStore';
import { useThemeColors } from '../src/theme';
import { registerBackgroundTasks } from '../src/services/backgroundTask';

import * as Notifications from 'expo-notifications';
import { useKeepAwake } from 'expo-keep-awake';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  Inter_400Regular_Italic,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  Ubuntu_400Regular,
  Ubuntu_700Bold,
  Ubuntu_400Regular_Italic,
} from '@expo-google-fonts/ubuntu';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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
  useKeepAwake();
  const router = useRouter();
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.themeId);
  const isDark = colors.isDark;

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_400Regular_Italic,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
    Ubuntu_400Regular,
    Ubuntu_700Bold,
    Ubuntu_400Regular_Italic,
  });

  const [activeReminder, setActiveReminder] = React.useState<Reminder | null>(null);
  const [alertVisible, setAlertVisible] = React.useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Register background tasks
    registerBackgroundTasks();

    // Setup notifications
    notificationService.requestPermissions().then((granted) => {
      if (granted) {
        notificationService.setupAndroidChannel();
        notificationService.setupNotificationCategories();
      }
    });

    // Setup audio
    audioService.configure().then(() => {
      // Truco del Latido Silencioso: Reproducimos un audio invisible para que Samsung no congele la app
      // Usamos el sonido de aviso pero con volumen 0
      audioService.playSound('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', 0);
    });

    // Start foreground monitor with custom UI
    reminderMonitor.start((reminder) => {
      setActiveReminder(reminder);
      setAlertVisible(true);
    });

    // Handle notification press → show the striking alert
    const sub = notificationService.setupResponseHandler((reminderId) => {
      const reminder = useReminderStore.getState().getReminderById(reminderId);
      if (reminder) {
        setActiveReminder(reminder);
        setAlertVisible(true);
      } else {
        router.push(`/reminder/${reminderId}`);
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

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
