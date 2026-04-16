import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import type { AppSettings } from '@/types';

const ANDROID_CHANNEL = 'bodytrace-reminders';

/** In Expo Go, importing `expo-notifications` throws on Android (SDK 53+). Use a dev build for real reminders. */
function shouldSkipNotificationsModule(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

let notificationHandlerRegistered = false;

async function ensureNotificationHandler(
  Notifications: typeof import('expo-notifications'),
): Promise<void> {
  if (notificationHandlerRegistered) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  notificationHandlerRegistered = true;
}

async function ensureAndroidChannel(
  Notifications: typeof import('expo-notifications'),
): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: 'Check-in reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Cancels existing local reminders and schedules new ones from settings.
 * No-ops in Expo Go (importing the native module is unsupported there on Android).
 */
export async function syncRemindersWithSettings(settings: AppSettings): Promise<void> {
  if (Platform.OS === 'web') return;
  if (shouldSkipNotificationsModule()) return;

  const Notifications = await import('expo-notifications');
  await ensureNotificationHandler(Notifications);

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.reminderEnabled) return;
  if (!Device.isDevice) return;

  const perm = await Notifications.getPermissionsAsync();
  let status = perm.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return;

  await ensureAndroidChannel(Notifications);

  const hour = 9;
  const minute = 0;

  if (settings.frequency === 'weekly') {
    const weekday = Math.min(7, Math.max(1, settings.reminderDay + 1));
    await Notifications.scheduleNotificationAsync({
      identifier: 'bodytrace-reminder',
      content: {
        title: 'BodyTrace check-in',
        body: 'Capture your front, side, and back photos to stay on track.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined,
        weekday,
        hour,
        minute,
      },
    });
  } else {
    const dayOfMonth = Math.min(28, Math.max(1, settings.reminderDay >= 1 ? settings.reminderDay : 1));
    await Notifications.scheduleNotificationAsync({
      identifier: 'bodytrace-reminder',
      content: {
        title: 'BodyTrace monthly check-in',
        body: 'Time for your monthly progress photos and measurements.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined,
        day: dayOfMonth,
        hour,
        minute,
      },
    });
  }
}
