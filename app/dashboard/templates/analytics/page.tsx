"use client"

import { useAuth } from "@/hooks/useAuthNew"
import TemplateEffectivenessDashboard from "@/components/templates/TemplateEffectivenessDashboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TemplateAnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Analytics Templates</h1>
              <p className="text-slate-600">Analyse approfondie des performances</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <TemplateEffectivenessDashboard dietitianId={user.id} />
    </div>
  )
}