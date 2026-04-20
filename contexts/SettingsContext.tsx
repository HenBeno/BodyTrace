import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { AppSettings } from '@/types';
import { loadAppSettings, saveAppSettings } from '@/services/database';
import { syncRemindersWithSettings } from '@/services/reminders';

export interface SettingsContextValue {
  settings: AppSettings;
  ready: boolean;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  reminderEnabled: false,
  reminderMode: 'weeklyDays',
  reminderTime: { hour: 9, minute: 0 },
  weeklyDays: [1],
  monthlyDate: 1,
  everyXHours: 4,
  countPerDay: 2,
  biometricEnabled: false,
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await loadAppSettings();
        if (!cancelled) {
          setSettings(s);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setSettings(DEFAULT_SETTINGS);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void syncRemindersWithSettings(settings);
  }, [
    ready,
    settings.reminderEnabled,
    settings.reminderMode,
    settings.reminderTime.hour,
    settings.reminderTime.minute,
    settings.weeklyDays,
    settings.monthlyDate,
    settings.everyXHours,
    settings.countPerDay,
  ]);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const next = { ...settingsRef.current, ...partial };
    setSettings(next);
    settingsRef.current = next;
    try {
      await saveAppSettings(next);
    } catch {
      // SQLite may be unavailable on some web builds; keep in-memory settings.
    }
  }, []);

  const value = useMemo(
    () => ({
      settings,
      ready,
      updateSettings,
    }),
    [settings, ready, updateSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
