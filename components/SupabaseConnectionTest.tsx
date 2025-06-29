"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<string>("Testing connection...")
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log("Testing Supabase connection...")
        
        // Test 1: Check if client is initialized
        console.log("Supabase client:", supabase)
        
        // Test 2: Try to get session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        console.log("Session data:", sessionData)
        console.log("Session error:", sessionError)
        
        if (sessionError) {
          setStatus(`Session Error: ${sessionError.message}`)
          return
        }
        
        setSession(sessionData.session)
        
        // Test 3: Try a simple query
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
        
        console.log("Query data:", data)
        console.log("Query error:", error)
        
        if (error) {
          setStatus(`Query Error: ${error.message}`)
          return
        }
        
        setStatus("✅ Supabase connection successful!")
        
      } catch (err) {
        console.error("Connection test failed:", err)
        setStatus(`❌ Connection failed: ${err}`)
      }
    }
    
    testConnection()
  }, [])

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold text-lg mb-2">Supabase Connection Test</h3>
      <p className="mb-2">{status}</p>
      {session && (
        <div className="text-sm text-gray-600">
          <p>Session User: {session.user?.email || "No user"}</p>
          <p>Session ID: {session.user?.id || "No ID"}</p>
        </div>
      )}
    </div>
  )
}
