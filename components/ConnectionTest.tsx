"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Loader2, Database, Key, Globe, User } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ConnectionStatus {
  envVars: boolean
  connection: boolean
  tables: boolean
  auth: boolean
  details: {
    url?: string
    hasKey?: boolean
    currentUser?: string
    error?: string
  }
}

export function ConnectionTest() {
  const [status, setStatus] = useState<ConnectionStatus>({
    envVars: false,
    connection: false,
    tables: false,
    auth: false,
    details: {},
  })
  const [testing, setTesting] = useState(false)

  const runConnectionTest = async () => {
    setTesting(true)
    const newStatus: ConnectionStatus = {
      envVars: false,
      connection: false,
      tables: false,
      auth: false,
      details: {},
    }

    try {
      // Test 1: Environment Variables
      console.log("🔍 Testing environment variables...")
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project")) {
        newStatus.envVars = true
        newStatus.details.url = supabaseUrl
        newStatus.details.hasKey = true
        console.log("✅ Environment variables OK")
      } else {
        throw new Error("Environment variables not properly set")
      }

      // Test 2: Basic Connection
      console.log("🔍 Testing Supabase connection...")
      const { data: connectionTest, error: connectionError } = await supabase.from("profiles").select("count").limit(1)

      if (connectionError) {
        if (connectionError.message.includes('relation "profiles" does not exist')) {
          newStatus.connection = true // Connection works, just no tables
          console.log("✅ Connection OK, but tables missing")
        } else {
          throw new Error(`Connection failed: ${connectionError.message}`)
        }
      } else {
        newStatus.connection = true
        newStatus.tables = true
        console.log("✅ Connection and tables OK")
      }

      // Test 3: Auth Status
      console.log("🔍 Testing auth status...")
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession()

      if (authError) {
        console.log("⚠️ Auth error:", authError.message)
      } else {
        newStatus.auth = true
        newStatus.details.currentUser = session?.user?.email || "Not logged in"
        console.log("✅ Auth system OK")
      }
    } catch (error) {
      console.error("❌ Connection test failed:", error)
      newStatus.details.error = error instanceof Error ? error.message : "Unknown error"
    }

    setStatus(newStatus)
    setTesting(false)
  }

  useEffect(() => {
    runConnectionTest()
  }, [])

  const getStatusIcon = (isOk: boolean) => {
    if (testing) return <Loader2 className="h-4 w-4 animate-spin" />
    return isOk ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (isOk: boolean) => {
    if (testing) return <Badge variant="secondary">Testing...</Badge>
    return <Badge variant={isOk ? "default" : "destructive"}>{isOk ? "OK" : "Failed"}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Connection Test
        </CardTitle>
        <CardDescription>Comprehensive test of your Supabase setup</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Variables */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon(status.envVars)}
            <Key className="h-4 w-4" />
            <span>Environment Variables</span>
          </div>
          {getStatusBadge(status.envVars)}
        </div>

        {/* Connection */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon(status.connection)}
            <Globe className="h-4 w-4" />
            <span>Supabase Connection</span>
          </div>
          {getStatusBadge(status.connection)}
        </div>

        {/* Tables */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon(status.tables)}
            <Database className="h-4 w-4" />
            <span>Database Tables</span>
          </div>
          {getStatusBadge(status.tables)}
        </div>

        {/* Auth */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon(status.auth)}
            <User className="h-4 w-4" />
            <span>Authentication</span>
          </div>
          {getStatusBadge(status.auth)}
        </div>

        {/* Details */}
        {status.details.url && (
          <Alert>
            <AlertDescription>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Project:</strong> {status.details.url.split("//")[1]?.split(".")[0]}
                </div>
                <div>
                  <strong>User:</strong> {status.details.currentUser}
                </div>
                {status.details.error && (
                  <div className="text-red-600">
                    <strong>Error:</strong> {status.details.error}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={runConnectionTest} disabled={testing} className="w-full">
          {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Run Test Again
        </Button>

        {/* Next Steps */}
        {!status.tables && status.connection && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Step:</strong> Your connection works but database tables are missing. Use the "Database
              Setup" component below to create them.
            </AlertDescription>
          </Alert>
        )}

        {status.tables && !status.details.currentUser?.includes("@") && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Step:</strong> Everything looks good! Try signing up for an account or logging in to test the
              full authentication flow.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
