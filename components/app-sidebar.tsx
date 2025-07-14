"use client";

import {
  BarChart3,
  Calendar,
  ChefHat,
  FileText,
  Home,
  LogOut,
  Plus,
  Receipt,
  Settings,
  Shield,
  TestTube,
  Users,
} from "lucide-react";
import type * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuthNew";
import { useRoleBasedAccess } from "@/hooks/useRoleBasedAccess";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const data = {
  navMain: [
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
    /* MASKED FOR MVP - Analyse nutritionnelle functionality will be added in future
    {
      title: "Analyse nutritionnelle",
      url: "/dashboard/nutrition-analysis",
      icon: Calculator,
    },
    */
    /* MASKED FOR MVP - Messages functionality will be added in future
    {
      title: "Messages",
      url: "/dashboard/messages",
      icon: MessageCircle,
    },
    */
    {
      title: "Bibliothèque de recettes",
      url: "/dashboard/templates",
      icon: ChefHat,
    },
    {
      title: "Rendez-vous & Calendrier",
      url: "/dashboard/appointments",
      icon: Calendar,
    },
    /* MASKED FOR MVP - Rappels functionality will be added in future
    {
      title: "Rappels",
      url: "/dashboard/reminders",
      icon: Bell,
    },
    */
    {
      title: "Analyses & Rapports",
      url: "/dashboard/analytics",
      icon: BarChart3,
    },
    /* MASKED FOR MVP - Portail Client will be added in future
    {
      title: "Portail Client",
      url: "/client-portal",
      icon: Users,
      badge: "Portal",
    },
    */
    {
      title: "Factures",
      url: "/dashboard/invoices",
      icon: Receipt,
    },
    {
      title: "Journaux d'audit",
      url: "/dashboard/audit",
      icon: Shield,
    },
    {
      title: "Tests E2E",
      url: "/dashboard/testing",
      icon: TestTube,
    },
    {
      title: "Conformité RGPD",
      url: "/dashboard/gdpr",
      icon: Shield,
    },
    {
      title: "Gestion Admin",
      url: "/dashboard/admin",
      icon: Shield,
    },
    {
      title: "Paramètres",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { hasPermission, isSuperAdmin } = useRoleBasedAccess();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Filter navigation items based on permissions
  const filteredNavItems = data.navMain.filter((item) => {
    if (item.url === "/dashboard/audit") {
      return hasPermission("canAccessAuditLogs");
    }
    if (item.url === "/dashboard/testing") {
      return hasPermission("canAccessTesting");
    }
    if (item.url === "/dashboard/gdpr") {
      return hasPermission("canAccessAuditLogs"); // GDPR requires same admin access as audit logs
    }
    if (item.url === "/dashboard/admin") {
      return isSuperAdmin;
    }
    return true; // Show all other items
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm">
            N
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm">NutriFlow</span>
            <span className="text-xs text-muted-foreground">
              Tableau de bord diététicien
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Actions rapides</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/clients">
                    <Plus />
                    <span>Ajouter un client</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/meal-plans/generate">
                    <FileText />
                    <span>Générer un plan</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                      {profile?.first_name?.[0] || profile?.email?.[0] || "U"}
                    </div>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden text-left">
                      <span className="text-sm font-medium">
                        {profile?.first_name && profile?.last_name
                          ? `${profile.first_name} ${profile.last_name}`
                          : profile?.email || "Utilisateur"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Diététicien(ne)
                      </span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
