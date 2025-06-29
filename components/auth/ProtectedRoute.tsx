"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "./AuthProvider"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, session } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    console.log("ProtectedRoute: user =", !!user, "loading =", loading, "session =", !!session)
    
    if (!loading && !user) {
      console.log("ProtectedRoute: Redirecting to login - no user found")
      router.push("/login")
    }
  }, [user, loading, session, router])

  if (loading) {
    console.log("ProtectedRoute: Showing loading state")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!user) {
    console.log("ProtectedRoute: No user, returning null")
    return null
  }

  console.log("ProtectedRoute: User authenticated, rendering children")
  return <>{children}</>
}
