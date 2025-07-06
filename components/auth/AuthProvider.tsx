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
  resetPassword: (email: string) => Promise<{ data: any; error: string | null }>
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
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error("Session error:", error)
          throw error
        }

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
      setLoading(false)
    }, 10000) // 10 seconds timeout

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
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

  // Add visibility change listener to recheck session when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && user) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) {
            console.error("Session recheck error:", error)
            return
          }

          // Only update if session state has actually changed
          if (session?.user?.id !== user?.id) {
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
              await fetchProfile(session.user.id)
            } else {
              setProfile(null)
            }
          }
        } catch (err) {
          console.error("Visibility change session check error:", err)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user])

  // Handle tab visibility changes to recheck session
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        console.log("🔍 Tab is visible again, rechecking session...")

        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) {
            console.error("❌ Session recheck error:", error)
            return
          }

          const hadUser = !!user
          const hasUser = !!session?.user
          
          console.log("📊 Session recheck result:", {
            previousUser: hadUser,
            currentUser: hasUser,
            email: session?.user?.email || "No session",
            sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : "No expiry"
          })

          // Only update state if there's a meaningful change
          if (hadUser !== hasUser || session?.user?.id !== user?.id) {
            console.log("🔄 Auth state changed, updating...")
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
              await fetchProfile(session.user.id)
            } else {
              setProfile(null)
            }
          } else {
            console.log("✅ Auth state unchanged, no update needed")
          }
        } catch (err) {
          console.error("❌ Visibility change session check failed:", err)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user]) // Include user in dependencies to get current state

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
      
      // Check if user already exists by calling a custom API endpoint
      const checkResponse = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      if (checkResponse.ok) {
        const { exists } = await checkResponse.json()
        if (exists) {
          throw new Error("Un compte avec cet email existe déjà. Veuillez vous connecter.")
        }
      }
      
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
        
        // Handle specific error cases
        let errorMessage = "Sign up failed"
        
        if (error.message.includes("already registered") || error.message.includes("User already registered")) {
          errorMessage = "Un compte avec cet email existe déjà. Veuillez vous connecter."
        } else if (error.message.includes("duplicate")) {
          errorMessage = "Un compte avec cet email existe déjà. Veuillez vous connecter."
        } else if (error.message.includes("Password")) {
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères."
        } else if (error.message.includes("email")) {
          errorMessage = "Veuillez entrer une adresse email valide."
        } else {
          errorMessage = error.message
        }
        
        throw new Error(errorMessage)
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

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Sending password reset email to:", email)
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        console.error("Password reset error:", error)
        let errorMessage = "Erreur lors de l'envoi de l'email de réinitialisation"
        
        if (error.message.includes("email")) {
          errorMessage = "Veuillez entrer une adresse email valide"
        } else if (error.message.includes("not found") || error.message.includes("user not found")) {
          errorMessage = "Aucun compte trouvé avec cette adresse email"
        } else if (error.message.includes("rate limit")) {
          errorMessage = "Trop de tentatives. Veuillez attendre quelques minutes."
        } else {
          errorMessage = error.message
        }
        
        throw new Error(errorMessage)
      }

      console.log("Password reset email sent successfully:", data)
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la réinitialisation du mot de passe"
      console.error("Password reset failed:", errorMessage)
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
    resetPassword,
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
