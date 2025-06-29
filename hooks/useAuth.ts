"use client"

import { useEffect, useState } from "react"
import { supabase, type Profile } from "@/lib/supabase"
// Use types from the supabase client instead of importing directly
type User = any
type Session = any

/**
 * Custom hook for managing authentication state
 * Provides user session, profile data, and auth methods
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log("Auth state changed:", event, session?.user?.email || "No user")
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

    return () => subscription.unsubscribe()
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
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign out failed"
      console.error("Signout failed:", errorMessage)
      setError(errorMessage)
      return { error: errorMessage }
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

  return {
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
}
