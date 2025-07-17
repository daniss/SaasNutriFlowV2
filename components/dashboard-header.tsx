"use client"

import type React from "react"
import { useState } from "react"
import { 
  Bell, 
  Search, 
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Plus,
  Filter,
  Settings,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  showSearch?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  showNotifications?: boolean
  className?: string
}

interface QuickStat {
  label: string
  value: string | number
  trend?: "up" | "down" | "neutral"
  icon: React.ReactNode
}

export function DashboardHeader({ 
  title, 
  subtitle, 
  action,
  showSearch = true,
  searchPlaceholder = "Rechercher...",
  searchValue,
  onSearchChange,
  showNotifications = false, // Business decision: No fake notifications for nutritionist dashboard
  className = ""
}: DashboardHeaderProps) {
  const [localSearchValue, setLocalSearchValue] = useState("")

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value)
    } else {
      setLocalSearchValue(value)
    }
  }

  const currentSearchValue = searchValue !== undefined ? searchValue : localSearchValue

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 ${className}`}>
      <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-4 sm:px-6">
        <SidebarTrigger className="-ml-1 h-8 w-8 md:h-9 md:w-9 rounded-lg hover:bg-slate-100 transition-colors" />

        <div className="flex flex-1 items-center justify-between gap-2 md:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-slate-600 mt-0.5 truncate hidden sm:block">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {showSearch && (
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder={searchPlaceholder}
                  value={currentSearchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-48 xl:w-64 pl-10 h-8 md:h-9 border-slate-200 bg-white/80 focus:border-emerald-300 focus:ring-emerald-200 transition-all"
                />
              </div>
            )}

            {showNotifications && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-lg hover:bg-slate-100">
                    <Bell className="h-4 w-4" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-emerald-600 hover:bg-emerald-600 flex items-center justify-center">
                      3
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-lg border-slate-200">
                  <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem className="p-4 hover:bg-slate-50 rounded-lg mx-2 my-1">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-slate-900">Rappel de suivi client</p>
                      <p className="text-xs text-slate-600">Sarah Johnson - Pesée hebdomadaire due</p>
                      <p className="text-xs text-emerald-600 font-medium">Il y a 2 heures</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-4 hover:bg-slate-50 rounded-lg mx-2 my-1">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-slate-900">Plan alimentaire expirant</p>
                      <p className="text-xs text-slate-600">Le plan de Mike Chen expire dans 2 jours</p>
                      <p className="text-xs text-amber-600 font-medium">Il y a 5 heures</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-4 hover:bg-slate-50 rounded-lg mx-2 my-1">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-slate-900">Paiement reçu</p>
                      <p className="text-xs text-slate-600">Emma Davis - 150€ consultation</p>
                      <p className="text-xs text-blue-600 font-medium">Il y a 1 jour</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem className="p-2 m-2 text-center text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium">
                    Voir toutes les notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {action && (
              <div className="flex-shrink-0">
                {action}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
