import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Check if this is a password reset flow
        const type = searchParams.get("type")
        if (type === "recovery") {
          return NextResponse.redirect(new URL("/auth/reset-password", request.url))
        }
        
        // Otherwise redirect to dashboard or specified next URL
        return NextResponse.redirect(new URL(next, request.url))
      }
    } catch (error) {
      console.error("Auth callback error:", error)
    }
  }

  // If there's an error, redirect to login with error message
  return NextResponse.redirect(new URL("/login?error=auth_error", request.url))
}
