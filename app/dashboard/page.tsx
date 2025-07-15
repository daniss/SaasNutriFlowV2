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

      // Fetch clients
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("dietitian_id", user.id)
        .order("created_at", { ascending: false });

      if (clientsError) {
        throw clientsError;
      }

      // Fetch meal plans
      const { data: mealPlans, error: mealPlansError } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("dietitian_id", user.id)
        .in("status", ["Active", "Draft"])
        .order("created_at", { ascending: false });

      if (mealPlansError) {
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
    <div className="space-y-6">
      <DashboardHeader
        title={`Bienvenue, ${profile?.first_name || "Diététicien(ne)"}!`}
        subtitle="Voici vos accompagnements nutritionnels en cours"
        showSearch={false}
        action={
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
          >
            <Link href="/dashboard/clients">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </Link>
          </Button>
        }
      />

      <div className="px-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Personnes accompagnées
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.supportedPeople}</div>
              <p className="text-xs text-muted-foreground">
                Parcours de bien-être en cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Parcours nutritionnels
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ongoingJourneys}</div>
              <p className="text-xs text-muted-foreground">
                Transformations en cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Actions bienveillantes
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                >
                  <Link href="/dashboard/meal-plans">
                    Créer un parcours
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Progrès cette semaine
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.recentMealPlans.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Nouveaux parcours créés
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Clients */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Vos personnes accompagnées</CardTitle>
              <CardDescription>Nouveaux parcours de bien-être</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {stats.recentClients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Prêt à commencer ?
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Accompagnez votre première personne vers le bien-être.
                    </p>
                    <div className="mt-6">
                      <Button
                        asChild
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                      >
                        <Link href="/dashboard/clients">
                          <Plus className="mr-2 h-4 w-4" />
                          Nouveau client
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  stats.recentClients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/dashboard/clients/${client.id}`}
                      className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                      <Avatar className="h-9 w-9">
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
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {client.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {client.email}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        <Badge variant="default">En parcours</Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Meal Plans */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Parcours nutritionnels</CardTitle>
              <CardDescription>Vos dernières créations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentMealPlans.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Aucun parcours créé
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Créez votre premier parcours nutritionnel !
                    </p>
                    <div className="mt-6">
                      <Button
                        asChild
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                      >
                        <Link href="/dashboard/meal-plans">
                          <Plus className="mr-2 h-4 w-4" />
                          Créer un parcours
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  stats.recentMealPlans.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/dashboard/meal-plans/${plan.id}`}
                      className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-green-600 rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {plan.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {plan.duration_days} jours de parcours •{" "}
                          {plan.calories_range || "Nutrition personnalisée"}
                        </p>
                      </div>
                      <Badge variant="outline">{plan.status}</Badge>
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
