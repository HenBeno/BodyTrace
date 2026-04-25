import * as Linking from "expo-linking"
import type { Session, User } from "@supabase/supabase-js"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { isSupabaseConfigured } from "@/lib/env"
import { getSupabase } from "@/lib/supabase"
import { fetchProfileForUser } from "@/services/profileRepository"
import type { UserProfile } from "@/types/profile"

export interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  /** True after initial session + first profile fetch attempt finished. */
  authReady: boolean
  profileLoading: boolean
  needsOnboarding: boolean
  supabaseConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const AUTH_BOOTSTRAP_TIMEOUT_MS = 1_500
const PROFILE_FETCH_TIMEOUT_MS = 5_000

function toError(err: unknown): Error {
  if (err instanceof Error) return err
  return new Error(typeof err === "string" ? err : "Unknown error")
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timeout)
        resolve(value)
      })
      .catch((error: unknown) => {
        clearTimeout(timeout)
        reject(error)
      })
  })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) {
      setProfile(null)
      return
    }
    setProfileLoading(true)
    try {
      const row = await withTimeout(
        fetchProfileForUser(userId),
        PROFILE_FETCH_TIMEOUT_MS,
        "Profile fetch",
      )
      setProfile(row)
    } catch {
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const uid = session?.user?.id
    if (!uid) {
      setProfile(null)
      return
    }
    await loadProfile(uid)
  }, [loadProfile, session?.user?.id])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null)
      setProfile(null)
      setAuthReady(true)
      return
    }

    const supabase = getSupabase()
    let cancelled = false

    ;(async () => {
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_BOOTSTRAP_TIMEOUT_MS,
          "Auth bootstrap",
        )
        if (cancelled) return
        setSession(data.session ?? null)
        const uid = data.session?.user?.id
        if (uid) {
          void loadProfile(uid)
        } else {
          setProfile(null)
        }
      } catch {
        if (!cancelled) {
          setSession(null)
          setProfile(null)
        }
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      const uid = nextSession?.user?.id ?? null
      if (uid) {
        await loadProfile(uid)
      } else {
        setProfile(null)
        setProfileLoading(false)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const needsOnboarding = useMemo(() => {
    if (!session?.user?.id) return false
    return !profile?.onboardingCompleted
  }, [profile?.onboardingCompleted, session?.user?.id])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase is not configured.") }
    }
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      return { error: error ? toError(error) : null }
    } catch (e) {
      return { error: toError(e) }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error("Supabase is not configured."),
        needsEmailConfirmation: false,
      }
    }
    try {
      const supabase = getSupabase()
      const redirectTo = Linking.createURL("/")
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: redirectTo },
      })
      if (error) {
        return { error: toError(error), needsEmailConfirmation: false }
      }
      const needsEmailConfirmation = !data.session
      return { error: null, needsEmailConfirmation }
    } catch (e) {
      return { error: toError(e), needsEmailConfirmation: false }
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    const supabase = getSupabase()
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      authReady,
      profileLoading,
      needsOnboarding,
      supabaseConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      authReady,
      profileLoading,
      needsOnboarding,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
