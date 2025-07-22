"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import MonthlyAgenda from "@/components/dashboard/MonthlyAgenda";
import { MainDashboardSkeleton } from "@/components/shared/skeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuthNew";
import { supabase, type Client, type MealPlan } from "@/lib/supabase";
import { Bell, Clock, FileText, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardStats {
  supportedPeople: number;
  ongoingJourneys: number;
  recentClients: Client[];
  recentMealPlans: MealPlan[];
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    supportedPeople: 0,
    ongoingJourneys: 0,
    recentClients: [],
    recentMealPlans: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Only fetch data once when user becomes available and auth is not loading
    if (user && !authLoading && !dataLoaded) {
      fetchDashboardData();
    }
  }, [user, authLoading, dataLoaded]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch clients - RLS policies will automatically filter for the authenticated user
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("🏠 Dashboard clients fetched:", { count: clients?.length || 0, clients });

      if (clientsError) {
        console.error("🏠 Dashboard client fetch error:", clientsError);
        throw clientsError;
      }

      // Fetch meal plans - RLS policies will automatically filter for the authenticated user
      const { data: mealPlans, error: mealPlansError } = await supabase
        .from("meal_plans")
        .select("*")
        .in("status", ["Active", "Draft"])
        .order("created_at", { ascending: false });

      console.log("🏠 Dashboard meal plans fetched:", { count: mealPlans?.length || 0, mealPlans });

      if (mealPlansError) {
        console.error("🏠 Dashboard meal plans fetch error:", mealPlansError);
        throw mealPlansError;
      }

      setStats({
        supportedPeople: clients?.length || 0,
        ongoingJourneys: mealPlans?.length || 0,
        recentClients: clients?.slice(0, 5) || [],
        recentMealPlans: mealPlans?.slice(0, 5) || [],
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  // ✅ Proper loading check - always check auth loading first
  if (authLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ✅ Check if user exists after auth is loaded
  if (!user) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center">
          <p>Not logged in</p>
        </div>
      </div>
    );
  }

  // ✅ Show loading only if data is being fetched
  if (loading && !dataLoaded) {
    return <MainDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">
                Erreur lors du chargement du tableau de bord : {error}
              </p>
              <Button onClick={fetchDashboardData}>Réessayer</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <DashboardHeader
        title={`Bienvenue, ${profile?.first_name || "Diététicien(ne)"}!`}
        subtitle="Voici vos accompagnements nutritionnels en cours"
        showSearch={false}
        action={
          <Button
            asChild
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
          >
            <Link href="/dashboard/clients">
              <Plus className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Nouveau client</span>
              <span className="sm:hidden">Nouveau</span>
            </Link>
          </Button>
        }
      />

      <div className="px-4 md:px-6 space-y-4 md:space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                <span className="hidden sm:inline">Personnes accompagnées</span>
                <span className="sm:hidden">Clients</span>
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.supportedPeople}</div>
              <p className="text-xs text-muted-foreground">
                <span className="hidden sm:inline">Parcours de bien-être en cours</span>
                <span className="sm:hidden">En parcours</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                <span className="hidden sm:inline">Parcours nutritionnels</span>
                <span className="sm:hidden">Plans</span>
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.ongoingJourneys}</div>
              <p className="text-xs text-muted-foreground">
                <span className="hidden sm:inline">Transformations en cours</span>
                <span className="sm:hidden">Actifs</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                <span className="hidden sm:inline">Actions bienveillantes</span>
                <span className="sm:hidden">Actions</span>
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  asChild
                  size="sm"
                  className="w-full text-xs md:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                >
                  <Link href="/dashboard/meal-plans">
                    <span className="hidden sm:inline">Créer un parcours</span>
                    <span className="sm:hidden">Créer</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                <span className="hidden sm:inline">Progrès cette semaine</span>
                <span className="sm:hidden">Nouveaux</span>
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                {stats.recentMealPlans.length}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="hidden sm:inline">Nouveaux parcours créés</span>
                <span className="sm:hidden">Cette semaine</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          {/* Recent Clients */}
          <Card className="w-full min-w-0 lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                <span className="hidden sm:inline">Vos personnes accompagnées</span>
                <span className="sm:hidden">Vos clients</span>
              </CardTitle>
              <CardDescription className="text-sm">
                <span className="hidden sm:inline">Nouveaux parcours de bien-être</span>
                <span className="sm:hidden">Récents</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <div className="space-y-4 md:space-y-8">
                {stats.recentClients.length === 0 ? (
                  <div className="text-center py-6 md:py-8">
                    <Users className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Prêt à commencer ?
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 px-2">
                      <span className="hidden sm:inline">Accompagnez votre première personne vers le bien-être.</span>
                      <span className="sm:hidden">Ajoutez votre premier client.</span>
                    </p>
                    <div className="mt-4 md:mt-6">
                      <Button
                        asChild
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                      >
                        <Link href="/dashboard/clients">
                          <Plus className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
                          <span className="hidden sm:inline">Nouveau client</span>
                          <span className="sm:hidden">Ajouter</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  stats.recentClients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/dashboard/clients/${client.id}`}
                      className="flex items-center p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                      <Avatar className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${client.email}`}
                          alt="Avatar"
                        />
                        <AvatarFallback>
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3 md:ml-4 space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">
                          {client.name}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {client.email}
                        </p>
                      </div>
                      <div className="ml-2 font-medium flex-shrink-0">
                        <Badge variant="default" className="text-xs">
                          <span className="hidden sm:inline">En parcours</span>
                          <span className="sm:hidden">Actif</span>
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Meal Plans */}
          <Card className="w-full min-w-0 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                <span className="hidden sm:inline">Parcours nutritionnels</span>
                <span className="sm:hidden">Plans alimentaires</span>
              </CardTitle>
              <CardDescription className="text-sm">
                <span className="hidden sm:inline">Vos dernières créations</span>
                <span className="sm:hidden">Récents</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <div className="space-y-4">
                {stats.recentMealPlans.length === 0 ? (
                  <div className="text-center py-6 md:py-8">
                    <FileText className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      <span className="hidden sm:inline">Aucun parcours créé</span>
                      <span className="sm:hidden">Aucun plan</span>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 px-2">
                      <span className="hidden sm:inline">Créez votre premier parcours nutritionnel !</span>
                      <span className="sm:hidden">Créez votre premier plan !</span>
                    </p>
                    <div className="mt-4 md:mt-6">
                      <Button
                        asChild
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                      >
                        <Link href="/dashboard/meal-plans">
                          <Plus className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
                          <span className="hidden sm:inline">Créer un parcours</span>
                          <span className="sm:hidden">Créer</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  stats.recentMealPlans.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/dashboard/meal-plans/${plan.id}`}
                      className="flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-green-600 rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {plan.name}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 truncate">
                          <span className="hidden sm:inline">
                            {plan.duration_days} jours de parcours •{" "}
                            {plan.calories_range || "Nutrition personnalisée"}
                          </span>
                          <span className="sm:hidden">
                            {plan.duration_days}j • {plan.calories_range || "Perso"}
                          </span>
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          <span className="hidden sm:inline">{plan.status}</span>
                          <span className="sm:hidden">
                            {plan.status === "Active" ? "Actif" : plan.status === "Draft" ? "Brouillon" : plan.status}
                          </span>
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Agenda */}
        <div className="mt-6">
          <MonthlyAgenda dietitianId={user.id} />
        </div>
      </div>
    </div>
  );
}
