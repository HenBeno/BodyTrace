import {
  type Href,
  useRouter,
  useRootNavigationState,
  useSegments,
} from "expo-router"
import { useEffect } from "react"

import { useAuth } from "@/contexts/AuthContext"

/**
 * Enforces: unauthenticated users stay in `(auth)`, incomplete onboarding in `(onboarding)`,
 * otherwise main app routes are allowed.
 */
export function useAuthRedirect() {
  const router = useRouter()
  const segments = useSegments()
  const navigationState = useRootNavigationState()
  const { authReady, session, needsOnboarding, profileLoading } = useAuth()

  useEffect(() => {
    if (!authReady) return
    if (!navigationState?.key) return
    if (session?.user && profileLoading) return

    const root = segments[0] as string | undefined
    const inAuthGroup = root === "(auth)"
    const inOnboarding = root === "(onboarding)"

    if (!session?.user) {
      if (!inAuthGroup) {
        router.replace("/(auth)/login" as Href)
      }
      return
    }

    if (needsOnboarding) {
      if (!inOnboarding) {
        router.replace("/(onboarding)" as Href)
      }
      return
    }

    if (inAuthGroup || inOnboarding) {
      router.replace("/(tabs)" as Href)
    }
  }, [
    authReady,
    navigationState?.key,
    needsOnboarding,
    profileLoading,
    router,
    segments,
    session?.user,
  ])
}
