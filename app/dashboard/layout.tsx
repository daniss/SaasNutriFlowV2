import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

/**
 * Dashboard layout that wraps all dashboard pages
 * Includes authentication protection and sidebar navigation
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={false}>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
