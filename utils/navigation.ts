import { router, type Href } from 'expo-router';

const TABS_HOME: Href = '/(tabs)';

/** Avoids "GO_BACK was not handled" when there is no stack history (e.g. cold link or remount). */
export function safeGoBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(TABS_HOME);
  }
}
