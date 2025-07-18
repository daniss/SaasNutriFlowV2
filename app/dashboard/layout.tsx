import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { WellnessSidebarWrapper } from "@/components/wellness-sidebar-wrapper"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

/**
 * Dashboard layout that wraps all dashboard pages
 * Includes authentication protection and floating wellness sidebar navigation
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={false}>
        <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
          <WellnessSidebarWrapper />
          <main className="min-h-screen w-full md:ml-24 transition-all duration-300">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
