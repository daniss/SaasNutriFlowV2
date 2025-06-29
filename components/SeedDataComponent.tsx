"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2, Users, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/auth/AuthProvider"

/**
 * Component to seed the database with comprehensive sample data
 */
export function SeedDataComponent() {
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [hasExistingData, setHasExistingData] = useState<boolean | null>(null)
  const { user } = useAuthContext()

  useEffect(() => {
    if (user) {
      checkExistingData().then(setHasExistingData)
    }
  }, [user])

  const checkExistingData = async () => {
    if (!user) return false

    try {
      const { data, error } = await supabase.from("clients").select("id").eq("dietitian_id", user.id).limit(1)

      if (error) throw error
      return data && data.length > 0
    } catch (error) {
      console.error("Error checking existing data:", error)
      return false
    }
  }

  const clearExistingData = async () => {
    if (!user) {
      setMessage({ type: "error", text: "You must be logged in to clear data" })
      return
    }

    setClearing(true)
    setMessage(null)

    try {
      // Delete in order due to foreign key constraints
      await supabase.from("weight_history").delete().eq("client_id", user.id)
      await supabase.from("meal_plans").delete().eq("dietitian_id", user.id)
      await supabase.from("appointments").delete().eq("dietitian_id", user.id)
      await supabase.from("reminders").delete().eq("dietitian_id", user.id)
      await supabase.from("invoices").delete().eq("dietitian_id", user.id)

      const { error } = await supabase.from("clients").delete().eq("dietitian_id", user.id)

      if (error) throw error

      setMessage({ type: "success", text: "All sample data cleared successfully!" })
      setHasExistingData(false)
    } catch (error) {
      console.error("Error clearing data:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to clear data",
      })
    } finally {
      setClearing(false)
    }
  }

  const addSampleData = async () => {
    if (!user) {
      setMessage({ type: "error", text: "You must be logged in to add sample data" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Check if data already exists
      const hasData = await checkExistingData()
      if (hasData) {
        setMessage({
          type: "error",
          text: "Sample data already exists. Clear existing clients first if you want to re-seed.",
        })
        setHasExistingData(true)
        setLoading(false)
        return
      }

      // Sample clients data
      const sampleClients = [
        {
          dietitian_id: user.id,
          name: "Sarah Johnson",
          email: "sarah.johnson@email.com",
          phone: "(555) 123-4567",
          address: "123 Oak Street, Springfield, IL 62701",
          age: 32,
          height: "5'6\"",
          current_weight: 165,
          goal_weight: 145,
          goal: "Weight loss for wedding",
          plan_type: "Premium",
          status: "Active",
          tags: ["weight-loss", "wedding", "motivated"],
          notes: "Getting married in 6 months. Very motivated and consistent with meal plans.",
          emergency_contact: "Mike Johnson (husband) - (555) 123-4568",
          join_date: "2024-11-15",
          last_session: "2024-12-20",
          next_appointment: "2024-12-29T14:00:00",
          progress_percentage: 65,
        },
        {
          dietitian_id: user.id,
          name: "Michael Chen",
          email: "m.chen@email.com",
          phone: "(555) 234-5678",
          address: "456 Pine Avenue, Chicago, IL 60601",
          age: 28,
          height: "5'10\"",
          current_weight: 155,
          goal_weight: 175,
          goal: "Muscle gain and strength",
          plan_type: "Athletic",
          status: "Active",
          tags: ["muscle-gain", "athlete", "consistent"],
          notes: "Marathon runner looking to build lean muscle mass while maintaining endurance.",
          emergency_contact: "Lisa Chen (wife) - (555) 234-5679",
          join_date: "2024-10-20",
          last_session: "2024-12-18",
          next_appointment: "2024-12-30T10:00:00",
          progress_percentage: 78,
        },
        {
          dietitian_id: user.id,
          name: "Emma Davis",
          email: "emma.davis@email.com",
          phone: "(555) 345-6789",
          address: "789 Maple Drive, Austin, TX 78701",
          age: 45,
          height: "5'4\"",
          current_weight: 180,
          goal_weight: 160,
          goal: "Diabetes management",
          plan_type: "Medical",
          status: "Active",
          tags: ["diabetes", "medical", "careful-monitoring"],
          notes: "Type 2 diabetes diagnosed 2 years ago. Needs careful carb monitoring and regular check-ins.",
          emergency_contact: "Robert Davis (husband) - (555) 345-6790",
          join_date: "2024-09-10",
          last_session: "2024-12-15",
          next_appointment: "2024-12-31T15:30:00",
          progress_percentage: 45,
        },
        {
          dietitian_id: user.id,
          name: "James Wilson",
          email: "james.wilson@email.com",
          phone: "(555) 456-7890",
          address: "321 Cedar Lane, Denver, CO 80201",
          age: 38,
          height: "6'1\"",
          current_weight: 220,
          goal_weight: 190,
          goal: "Heart health improvement",
          plan_type: "Medical",
          status: "Active",
          tags: ["heart-health", "medical", "lifestyle-change"],
          notes: "Recent heart health scare. Doctor recommended significant dietary changes. Very committed to change.",
          emergency_contact: "Jennifer Wilson (wife) - (555) 456-7891",
          join_date: "2024-11-01",
          last_session: "2024-12-22",
          next_appointment: "2025-01-02T11:00:00",
          progress_percentage: 52,
        },
        {
          dietitian_id: user.id,
          name: "Lisa Rodriguez",
          email: "lisa.rodriguez@email.com",
          phone: "(555) 567-8901",
          address: "654 Birch Street, Miami, FL 33101",
          age: 29,
          height: "5'7\"",
          current_weight: 140,
          goal_weight: 135,
          goal: "Postpartum nutrition",
          plan_type: "Specialized",
          status: "Active",
          tags: ["postpartum", "breastfeeding", "energy"],
          notes: "New mom (3 months postpartum) looking to regain energy and lose baby weight while breastfeeding.",
          emergency_contact: "Carlos Rodriguez (husband) - (555) 567-8902",
          join_date: "2024-12-01",
          last_session: "2024-12-19",
          next_appointment: "2025-01-03T09:30:00",
          progress_percentage: 30,
        },
        {
          dietitian_id: user.id,
          name: "David Thompson",
          email: "d.thompson@email.com",
          phone: "(555) 678-9012",
          address: "987 Elm Court, Seattle, WA 98101",
          age: 52,
          height: "5'9\"",
          current_weight: 195,
          goal_weight: 175,
          goal: "General wellness",
          plan_type: "Standard",
          status: "Active",
          tags: ["wellness", "maintenance", "steady"],
          notes: "Looking to establish better eating habits and maintain steady weight loss. Works long hours.",
          emergency_contact: "Susan Thompson (wife) - (555) 678-9013",
          join_date: "2024-08-15",
          last_session: "2024-12-10",
          next_appointment: "2025-01-05T16:00:00",
          progress_percentage: 85,
        },
        {
          dietitian_id: user.id,
          name: "Amanda Foster",
          email: "amanda.foster@email.com",
          phone: "(555) 789-0123",
          address: "147 Willow Way, Portland, OR 97201",
          age: 26,
          height: "5'5\"",
          current_weight: 125,
          goal_weight: 135,
          goal: "Healthy weight gain",
          plan_type: "Specialized",
          status: "Active",
          tags: ["weight-gain", "underweight", "health"],
          notes:
            "Naturally thin, looking to gain healthy weight and build better eating habits. Very active lifestyle.",
          emergency_contact: "Mark Foster (brother) - (555) 789-0124",
          join_date: "2024-10-05",
          last_session: "2024-12-17",
          next_appointment: "2025-01-04T13:00:00",
          progress_percentage: 60,
        },
        {
          dietitian_id: user.id,
          name: "Robert Kim",
          email: "robert.kim@email.com",
          phone: "(555) 890-1234",
          address: "258 Spruce Street, Boston, MA 02101",
          age: 41,
          height: "5'8\"",
          current_weight: 185,
          goal_weight: 170,
          goal: "Energy and focus",
          plan_type: "Executive",
          status: "Active",
          tags: ["executive", "energy", "busy-schedule"],
          notes: "Busy executive looking to improve energy levels and mental clarity through better nutrition.",
          emergency_contact: "Grace Kim (wife) - (555) 890-1235",
          join_date: "2024-11-20",
          last_session: "2024-12-21",
          next_appointment: "2025-01-06T08:00:00",
          progress_percentage: 40,
        },
      ]

      // Insert clients
      const { data: clients, error: clientsError } = await supabase.from("clients").insert(sampleClients).select()

      if (clientsError) {
        throw clientsError
      }

      // Add weight history for first 3 clients
      if (clients && clients.length > 0) {
        const weightHistoryData = []

        for (let i = 0; i < Math.min(3, clients.length); i++) {
          const client = clients[i]
          const startWeight = client.current_weight + 15

          for (let week = 0; week < 8; week++) {
            const date = new Date()
            date.setDate(date.getDate() - (7 - week) * 7)

            weightHistoryData.push({
              client_id: client.id,
              weight: startWeight - week * 2,
              recorded_date: date.toISOString().split("T")[0],
              notes:
                week === 0
                  ? "Starting weight"
                  : week === 1
                    ? "Week 1 progress"
                    : week === 2
                      ? "Great improvement!"
                      : week === 3
                        ? "Steady progress"
                        : week === 4
                          ? "Halfway to goal"
                          : week === 5
                            ? "Excellent work"
                            : week === 6
                              ? "Almost there!"
                              : "Current weight",
            })
          }
        }

        const { error: weightError } = await supabase.from("weight_history").insert(weightHistoryData)
        if (weightError) console.error("Weight history error:", weightError)
      }

      console.log("Sample clients added:", clients?.length)
      setMessage({
        type: "success",
        text: `Successfully added ${clients?.length || 0} sample clients with complete profiles and weight history!`,
      })
      setHasExistingData(true)
    } catch (error) {
      console.error("Error adding sample data:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to add sample data",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          This will add 8 sample clients with realistic profiles, contact information, and progress data.
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={addSampleData} disabled={loading || clearing || !user} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Sample Data...
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Add Sample Data
            </>
          )}
        </Button>

        {hasExistingData && (
          <Button variant="outline" onClick={clearExistingData} disabled={loading || clearing || !user}>
            {clearing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Data
              </>
            )}
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-600">
        Note: This will only work if you're logged in and have the necessary database tables created.
      </p>
    </div>
  )
}
