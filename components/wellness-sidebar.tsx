"use client";

import {
  Calendar,
  ChefHat,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Plus,
  Receipt,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import type * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuthNew";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  {
    title: "Tableau de bord",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Clients",
    url: "/dashboard/clients",
    icon: Users,
  },
  {
    title: "Plans alimentaires",
    url: "/dashboard/meal-plans",
    icon: FileText,
  },
  {
    title: "Modèles",
    url: "/dashboard/templates",
    icon: FileText,
  },
  {
    title: "Recettes",
    url: "/dashboard/recipes",
    icon: ChefHat,
  },
  {
    title: "Rendez-vous",
    url: "/dashboard/appointments",
    icon: Calendar,
  },
  {
    title: "Factures",
    url: "/dashboard/invoices",
    icon: Receipt,
  },
  {
    title: "Paramètres",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

const quickActions = [
  {
    title: "Plan avec IA",
    url: "/dashboard/meal-plans/generate",
    icon: Zap,
  },
  {
    title: "Nouveau client",
    url: "/dashboard/clients",
    icon: Plus,
  },
];

interface WellnessSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function WellnessSidebar({ isOpen = false, onToggle }: WellnessSidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Debounced hover handlers to prevent flickering
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150); // Faster response
  }, []);

  const expanded = isOpen || isHovered;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Mobile sheet overlay for small screens
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => onToggle?.()}
            />
            
            {/* Mobile sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 backdrop-blur-xl border-r border-emerald-200/50 z-50 md:hidden"
            >
              <div className="flex flex-col h-full p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold shadow-lg">
                    N
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-emerald-900">NutriFlow</span>
                    <span className="text-xs text-emerald-600">
                      Tableau de bord diététicien
                    </span>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.url}
                      onClick={() => onToggle?.()}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                        pathname === item.url
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                          : "text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </nav>

                {/* Quick Actions */}
                <div className="space-y-2 pt-4 border-t border-emerald-200/50">
                  <p className="text-xs font-medium text-emerald-600 px-3 mb-2">Actions rapides</p>
                  {quickActions.map((action) => (
                    <Link
                      key={action.title}
                      href={action.url}
                      onClick={() => onToggle?.()}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                    >
                      <action.icon className="h-4 w-4" />
                      <span>{action.title}</span>
                    </Link>
                  ))}
                </div>

                {/* User Profile */}
                <div className="pt-4 border-t border-emerald-200/50">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 w-full">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                          {profile?.first_name?.[0] || profile?.email?.[0] || "U"}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">
                            {profile?.first_name && profile?.last_name
                              ? `${profile.first_name} ${profile.last_name}`
                              : profile?.email || "Utilisateur"}
                          </span>
                          <span className="text-xs text-emerald-600">
                            Diététicien(ne)
                          </span>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings">
                          <Settings className="h-4 w-4 mr-2" />
                          Paramètres
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Se déconnecter
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop floating sidebar
  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className="fixed left-4 top-4 bottom-4 z-50 hidden md:block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          className="relative h-full bg-gradient-to-br from-emerald-50/90 via-white/95 to-emerald-50/80 backdrop-blur-xl rounded-3xl border border-emerald-200/50 shadow-xl shadow-emerald-500/10 overflow-hidden"
          style={{ willChange: 'width' }}
          initial={false}
          animate={{
            width: expanded ? "280px" : "64px",
            borderRadius: expanded ? "24px" : "32px",
          }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
            type: "tween"
          }}
        >
          <div className="flex flex-col h-full p-3 min-w-0">
            {/* Header */}
            <div className="flex items-center mb-6 relative h-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold shadow-lg flex-shrink-0 relative z-10">
                N
              </div>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="absolute left-12 flex flex-col"
                  >
                    <span className="font-semibold text-emerald-900 whitespace-nowrap">NutriFlow</span>
                    <span className="text-xs text-emerald-600 whitespace-nowrap">
                      Tableau de bord diététicien
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.url}
                        className={cn(
                          "flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group relative",
                          isActive
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                            : "text-emerald-700 hover:bg-emerald-100/80 hover:text-emerald-800"
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0 relative z-10" />
                        <AnimatePresence>
                          {expanded && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2, delay: 0.1 }}
                              className="absolute left-10 whitespace-nowrap"
                            >
                              {item.title}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {isActive && (
                          <motion.div
                            className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </Link>
                    </TooltipTrigger>
                    {!expanded && (
                      <TooltipContent side="right" className="ml-2">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>

            {/* Quick Actions */}
            <div className="space-y-1 pt-4 border-t border-emerald-200/50">
              <AnimatePresence>
                {expanded && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15, delay: 0.05 }}
                    className="text-xs font-medium text-emerald-600 px-3 mb-2"
                  >
                    Actions rapides
                  </motion.p>
                )}
              </AnimatePresence>
              {quickActions.map((action) => (
                <Tooltip key={action.title}>
                  <TooltipTrigger asChild>
                    <Link
                      href={action.url}
                      className="flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium text-emerald-700 hover:bg-emerald-100/80 hover:text-emerald-800 relative"
                    >
                      <action.icon className="h-4 w-4 flex-shrink-0 relative z-10" />
                      <AnimatePresence>
                        {expanded && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                            className="absolute left-10 whitespace-nowrap"
                          >
                            {action.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </TooltipTrigger>
                  {!expanded && (
                    <TooltipContent side="right" className="ml-2">
                      {action.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>

            {/* User Profile */}
            <div className="pt-4 border-t border-emerald-200/50">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium text-emerald-700 hover:bg-emerald-100/80 hover:text-emerald-800 w-full relative min-h-[48px]">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0 absolute left-1/2 transform -translate-x-1/2 z-10">
                      {profile?.first_name?.[0] || profile?.email?.[0] || "U"}
                    </div>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2, delay: 0.1 }}
                          className="absolute left-12 flex flex-col text-left"
                        >
                          <span className="text-sm font-medium whitespace-nowrap">
                            {profile?.first_name && profile?.last_name
                              ? `${profile.first_name} ${profile.last_name}`
                              : profile?.email || "Utilisateur"}
                          </span>
                          <span className="text-xs text-emerald-600 whitespace-nowrap">
                            Diététicien(ne)
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}