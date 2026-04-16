import 'react-native-gesture-handler';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';

import { SecurityGate } from '@/components/auth/SecurityGate';
import { EntriesProvider } from '@/contexts/EntriesContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { theme } from '@/utils/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const VaultDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.accent,
    background: theme.canvas,
    card: theme.surface,
    text: theme.primaryText,
    border: 'rgba(255,255,255,0.12)',
    notification: theme.accent,
  },
};

const VaultLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.accent,
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    border: 'rgba(15,23,42,0.08)',
    notification: theme.accent,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navTheme = isDark ? VaultDarkTheme : VaultLightTheme;
  const stackBg = useMemo(
    () => ({ backgroundColor: isDark ? theme.canvas : VaultLightTheme.colors.background }),
    [isDark],
  );

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: isDark ? theme.canvas : '#f8fafc' }}
      className="font-sans">
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <SettingsProvider>
            <SecurityGate>
              <EntriesProvider>
                <Stack screenOptions={{ contentStyle: stackBg }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="entry" options={{ headerShown: false }} />
                </Stack>
              </EntriesProvider>
            </SecurityGate>
          </SettingsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
