"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, type Profile } from "@/lib/supabase"
// Use types from the supabase client instead of importing directly
type User = any // We'll use the supabase types via the client
type Session = any

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ data: any; error: string | null }>
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<{ data: any; error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: Profile | null; error: string | null }>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("Getting initial session...")
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error("Session error:", error)
          throw error
        }

        console.log("Initial session:", session?.user?.email || "No session")
        setSession(session)
        setUser(session?.user ?? null)

        // If user exists, fetch their profile
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        console.error("Auth error:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log("Auth timeout - forcing loading to false")
      setLoading(false)
    }, 10000) // 10 seconds timeout

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log("Auth state changed:", event, session?.user?.email || "No user")
      clearTimeout(timeout) // Clear timeout on auth state change
      setSession(session)
      setUser(session?.user ?? null)
      setError(null) // Clear any previous errors

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId)
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === "PGRST116") {
          console.log("Profile not found, creating one...")
          await createProfile(userId)
          return
        }
        console.error("Profile fetch error:", error)
        throw error
      }

      console.log("Profile fetched:", data)
      setProfile(data)
    } catch (err) {
      console.error("Error fetching profile:", err)
      // Don't set error for profile fetch failures, as they might be expected
    }
  }

  // Create profile if it doesn't exist
  const createProfile = async (userId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const profileData = {
        id: userId,
        email: user.email!,
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        title: "Registered Dietitian",
      }

      const { data, error } = await supabase.from("profiles").insert(profileData).select().single()

      if (error) {
        console.error("Profile creation error:", error)
        return
      }

      console.log("Profile created:", data)
      setProfile(data)
    } catch (err) {
      console.error("Error creating profile:", err)
    }
  }

  // Sign up new user
  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Signing up user:", email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })
      if (error) {
        console.error("Signup error:", error)
        throw error
      }

      console.log("Signup successful:", data)
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign up failed"
      console.error("Signup failed:", errorMessage)
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Sign in user
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Signing in user:", email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        console.error("Signin error:", error)
        throw error
      }

      console.log("Signin successful:", data)
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign in failed"
      console.error("Signin failed:", errorMessage)
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Sign out user
  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Signing out user")
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Signout error:", error)
        throw error
      }

      setUser(null)
      setSession(null)
      setProfile(null)

      console.log("Signout successful")
      router.push("/login")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign out failed"
      console.error("Signout failed:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Update user profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: "No user logged in" }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Profile update failed"
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
