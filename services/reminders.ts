import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import type { AppSettings } from "@/types";

const ANDROID_CHANNEL = "bodytrace-reminders";
const REMINDER_ID_PREFIX = "bodytrace-reminder-";

/** In Expo Go, importing `expo-notifications` throws on Android (SDK 53+). Use a dev build for real reminders. */
function shouldSkipNotificationsModule(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

let notificationHandlerRegistered = false;

async function ensureNotificationHandler(
  Notifications: typeof import("expo-notifications"),
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
  Notifications: typeof import("expo-notifications"),
): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: "Check-in reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Exported for unit tests; behavior is part of reminder scheduling. */
export function normalizeWeeklyDays(days: number[]): number[] {
  const unique = [...new Set(days.map((day) => clamp(day, 0, 6)))].sort(
    (a, b) => a - b,
  );
  return unique.length > 0 ? unique : [1];
}

function normalizeSettings(settings: AppSettings) {
  return {
    reminderMode: settings.reminderMode,
    reminderTime: {
      hour: clamp(settings.reminderTime.hour, 0, 23),
      minute: clamp(settings.reminderTime.minute, 0, 59),
    },
    weeklyDays: normalizeWeeklyDays(settings.weeklyDays),
    monthlyDate: clamp(settings.monthlyDate, 1, 28),
    everyXHours: clamp(settings.everyXHours, 1, 23),
    countPerDay: clamp(settings.countPerDay, 1, 6),
  };
}

/** Exported for unit tests; spreads reminders between 08:00 and 22:00. */
export function countPerDayTimes(
  countPerDay: number,
): { hour: number; minute: number }[] {
  const startMinute = 8 * 60;
  const endMinute = 22 * 60;
  if (countPerDay <= 1) {
    return [{ hour: 9, minute: 0 }];
  }
  const step = (endMinute - startMinute) / (countPerDay - 1);
  return Array.from({ length: countPerDay }, (_, index) => {
    const minuteOfDay = Math.round(startMinute + step * index);
    return {
      hour: Math.floor(minuteOfDay / 60),
      minute: minuteOfDay % 60,
    };
  });
}

async function cancelExistingReminderSchedules(
  Notifications: typeof import("expo-notifications"),
): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const reminderIds = all
    .map((item) => item.identifier)
    .filter(
      (id) => id === "bodytrace-reminder" || id.startsWith(REMINDER_ID_PREFIX),
    );
  await Promise.all(
    reminderIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}

/**
 * Cancels existing local reminders and schedules new ones from settings.
 * No-ops in Expo Go (importing the native module is unsupported there on Android).
 */
export async function syncRemindersWithSettings(
  settings: AppSettings,
): Promise<void> {
  if (Platform.OS === "web") return;
  if (shouldSkipNotificationsModule()) return;

  const Notifications = await import("expo-notifications");
  await ensureNotificationHandler(Notifications);
  await cancelExistingReminderSchedules(Notifications);

  if (!settings.reminderEnabled) return;
  if (!Device.isDevice) return;

  const perm = await Notifications.getPermissionsAsync();
  let status = perm.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return;

  await ensureAndroidChannel(Notifications);
  const normalized = normalizeSettings(settings);
  const channelId = Platform.OS === "android" ? ANDROID_CHANNEL : undefined;
  const reminderContent = {
    title: "BodyTrace reminder",
    body: "Quick check-in: log a photo update to keep your progress streak going.",
  };
  const schedule = Notifications.scheduleNotificationAsync;

  if (normalized.reminderMode === "everyXHours") {
    await schedule({
      identifier: `${REMINDER_ID_PREFIX}every-x-hours`,
      content: reminderContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        channelId,
        seconds: normalized.everyXHours * 60 * 60,
        repeats: true,
      },
    });
    return;
  }

  if (normalized.reminderMode === "weeklyDays") {
    await Promise.all(
      normalized.weeklyDays.map((day) =>
        schedule({
          identifier: `${REMINDER_ID_PREFIX}weekly-${day}`,
          content: reminderContent,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            channelId,
            weekday: day + 1,
            hour: normalized.reminderTime.hour,
            minute: normalized.reminderTime.minute,
          },
        }),
      ),
    );
    return;
  }

  if (normalized.reminderMode === "monthlyDate") {
    await schedule({
      identifier: `${REMINDER_ID_PREFIX}monthly`,
      content: {
        title: "BodyTrace monthly reminder",
        body: "Monthly checkpoint: update photos and measurements.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        channelId,
        day: normalized.monthlyDate,
        hour: normalized.reminderTime.hour,
        minute: normalized.reminderTime.minute,
      },
    });
    return;
  }

  if (normalized.reminderMode === "countPerDay") {
    await Promise.all(
      countPerDayTimes(normalized.countPerDay).map((time, index) =>
        schedule({
          identifier: `${REMINDER_ID_PREFIX}count-${index}`,
          content: reminderContent,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            channelId,
            hour: time.hour,
            minute: time.minute,
          },
        }),
      ),
    );
    return;
  }

  await schedule({
    identifier: `${REMINDER_ID_PREFIX}daily`,
    content: reminderContent,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId,
      hour: normalized.reminderTime.hour,
      minute: normalized.reminderTime.minute,
    },
  });
}
