"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuthNew"

export default function DatabaseTest() {
  const { user } = useAuth()
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      testDatabase()
    }
  }, [user])

  const testDatabase = async () => {
    try {
      console.log("🧪 Testing database schema...")
      
      // Test clients table
      console.log("Testing clients table...")
      const { data: clientsTest, error: clientsError } = await supabase
        .from("clients")
        .select("id, dietitian_id, name, status")
        .limit(1)
      
      if (clientsError) {
        console.error("❌ Clients table error:", clientsError)
        setError(`Clients table error: ${clientsError.message}`)
        return
      }
      
      // Test meal_plans table
      console.log("Testing meal_plans table...")
      const { data: mealPlansTest, error: mealPlansError } = await supabase
        .from("meal_plans")
        .select("id, dietitian_id, name, status")
        .limit(1)
      
      if (mealPlansError) {
        console.error("❌ Meal plans table error:", mealPlansError)
        setError(`Meal plans table error: ${mealPlansError.message}`)
        return
      }
      
      console.log("✅ Database schema test successful!")
      setResults([
        { table: "clients", count: clientsTest?.length || 0 },
        { table: "meal_plans", count: mealPlansTest?.length || 0 }
      ])
      
    } catch (err) {
      console.error("❌ Database test failed:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  if (!user) return <div>Not authenticated</div>

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-4">Database Schema Test</h3>
      
      {error ? (
        <div className="text-red-600">
          <strong>Error:</strong> {error}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-green-600">✅ Database connection successful!</p>
          {results.map((result, index) => (
            <div key={index} className="text-sm">
              Table <strong>{result.table}</strong>: {result.count} records accessible
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
