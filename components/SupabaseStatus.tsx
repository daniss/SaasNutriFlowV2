"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react"

/**
 * Component to check and display Supabase connection status
 * Useful for debugging environment variable issues
 */
export function SupabaseStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<any>(null)

  const checkSupabaseConnection = async () => {
    setStatus("loading")
    setError(null)

    try {
      // Check if environment variables are set
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      console.log("Checking Supabase connection...")
      console.log("URL:", supabaseUrl)
      console.log("Key exists:", !!supabaseAnonKey)

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase environment variables are not set")
      }

      if (supabaseUrl.includes("your_supabase_project_url") || supabaseUrl.includes("your-project-id")) {
        throw new Error(
          "Please replace the placeholder values in your .env.local file with actual Supabase credentials",
        )
      }

      // Try to import and test Supabase connection
      const { supabase, db } = await import("@/lib/supabase")

      console.log("Testing database connection...")

      // Test the connection with a simple query
      const { success, error: testError } = await db.testConnection()

      if (!success) {
        if (testError && typeof testError === "object" && "message" in testError) {
          const errorMessage = (testError as any).message
          if (errorMessage.includes('relation "profiles" does not exist')) {
            throw new Error("Database tables not found. Please run the SQL schema script in your Supabase project.")
          }
          throw new Error(`Database error: ${errorMessage}`)
        }
        throw new Error("Database connection failed")
      }

      // Test auth
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setDetails({
        url: supabaseUrl,
        hasKey: !!supabaseAnonKey,
        tablesExist: true,
        currentUser: session?.user?.email || "Not logged in",
      })

      setStatus("connected")
    } catch (err) {
      console.error("Supabase connection error:", err)
      setStatus("error")
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    }
  }

  useEffect(() => {
    checkSupabaseConnection()
  }, [])

  if (status === "loading") {
    return (
      <Alert className="mb-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>Checking Supabase connection...</AlertDescription>
      </Alert>
    )
  }

  if (status === "error") {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div>
              <strong>Supabase Configuration Error:</strong> {error}
            </div>

            <div className="mt-4">
              <strong>Debug Info:</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set"}</li>
                <li>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set"}</li>
              </ul>
            </div>

            <div className="mt-4">
              <strong>To fix this:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Check your .env.local file exists in the project root</li>
                <li>Verify your Supabase URL and anon key are correct</li>
                <li>Restart your development server after changing .env.local</li>
                <li>Make sure your Supabase project is active</li>
              </ol>
            </div>

            <Button onClick={checkSupabaseConnection} size="sm" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-4 border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <div className="space-y-2">
          <div>✅ Supabase is connected and ready to use!</div>
          {details && (
            <div className="text-sm">
              <strong>Connection Details:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>Project: {details.url.split("//")[1]?.split(".")[0]}</li>
                <li>Tables: {details.tablesExist ? "✅ Created" : "❌ Missing"}</li>
                <li>User: {details.currentUser}</li>
              </ul>
            </div>
          )}
          <Button onClick={checkSupabaseConnection} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
