"use client"

import { useAuth } from "@/hooks/useAuthNew"
import { DashboardHeader } from "@/components/dashboard-header"
import FeedbackDisplay from "@/components/feedback/FeedbackDisplay"
import { MessageSquare } from "lucide-react"

export default function FeedbackPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Commentaires clients"
        subtitle="Consultez les retours de vos clients sur leurs plans alimentaires"
      />
      
      <div className="px-6">
        <FeedbackDisplay showTitle={false} />
      </div>
    </div>
  )
}