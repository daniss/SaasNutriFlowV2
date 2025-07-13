"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthNew";
import { supabase } from "@/lib/supabase";
import {
  DollarSign,
  Download,
  FileText,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsData {
  clientGrowth: Array<{ month: string; clients: number; newClients: number }>;
  planDistribution: Array<{ status: string; count: number; color: string }>;
  revenueData: Array<{ month: string; revenue: number; invoices: number }>;
  clientEngagement: Array<{
    name: string;
    sessions: number;
    lastActive: string;
  }>;
  nutritionalGoals: Array<{ goal: string; achieved: number; total: number }>;
  popularMealTypes: Array<{ type: string; count: number; percentage: number }>;
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("last30days");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [selectedMetric, setSelectedMetric] = useState("overview");

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, timeRange]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch clients data
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name, created_at, last_session_date")
        .eq("dietitian_id", user.id);

      // Fetch meal plans data
      const { data: mealPlans } = await supabase
        .from("meal_plans")
        .select("status, created_at, calories_range")
        .eq("dietitian_id", user.id);

      // Fetch invoices data
      const { data: invoices } = await supabase
        .from("invoices")
        .select("amount, status, created_at")
        .eq("dietitian_id", user.id);

      // Fetch appointments data
      const { data: appointments } = await supabase
        .from("appointments")
        .select("client_id, created_at, status, appointment_date")
        .eq("dietitian_id", user.id);

      // Process data into analytics format
      const processedData: AnalyticsData = {
        clientGrowth: generateClientGrowthData(clients || []),
        planDistribution: generatePlanDistribution(mealPlans || []),
        revenueData: generateRevenueData(invoices || []),
        clientEngagement: generateEngagementData(
          clients || [],
          appointments || []
        ),
        nutritionalGoals: generateNutritionalGoals(mealPlans || []),
        popularMealTypes: generateMealTypeData(mealPlans || []),
      };

      setAnalyticsData(processedData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données analytiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateClientGrowthData = (clients: any[]) => {
    const months = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];
    const currentDate = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const month = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthClients = clients.filter((client) => {
        const clientDate = new Date(client.created_at);
        return (
          clientDate.getMonth() === month.getMonth() &&
          clientDate.getFullYear() === month.getFullYear()
        );
      });

      data.push({
        month: months[month.getMonth()],
        clients: clients.filter(
          (client) => new Date(client.created_at) <= month
        ).length,
        newClients: monthClients.length,
      });
    }

    return data;
  };

  const generatePlanDistribution = (plans: any[]) => {
    const statusCounts = plans.reduce((acc, plan) => {
      acc[plan.status] = (acc[plan.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count], index) => ({
      status:
        status === "active"
          ? "Actif"
          : status === "completed"
          ? "Terminé"
          : "Brouillon",
      count: count as number,
      color: COLORS[index % COLORS.length],
    }));
  };

  const generateRevenueData = (invoices: any[]) => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"];
    const currentDate = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const month = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthInvoices = invoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.created_at);
        return (
          invoiceDate.getMonth() === month.getMonth() &&
          invoiceDate.getFullYear() === month.getFullYear() &&
          invoice.status === "paid"
        );
      });

      const monthRevenue = monthInvoices.reduce(
        (sum, invoice) => sum + (invoice.amount || 0),
        0
      );

      data.push({
        month: months[month.getMonth()],
        revenue: monthRevenue,
        invoices: monthInvoices.length,
      });
    }

    return data;
  };

  const generateEngagementData = (clients: any[], appointments: any[]) => {
    // Get clients with their recent activity
    return clients
      .slice(0, 5)
      .map((client) => {
        const clientAppointments = appointments.filter(
          (apt) => apt.client_id === client.id
        );
        const recentAppointments = clientAppointments.filter((apt) => {
          const aptDate = new Date(apt.appointment_date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return aptDate >= thirtyDaysAgo;
        });

        return {
          name: client.name || `Client ${client.id.slice(0, 8)}`,
          sessions: recentAppointments.length,
          lastActive: client.last_session_date || client.created_at,
        };
      })
      .sort((a, b) => b.sessions - a.sessions);
  };

  const generateNutritionalGoals = (plans: any[]) => {
    // Count meal plans by client goals
    const goalCounts = plans.reduce((acc, plan) => {
      // Get client goal from plan or default categorization
      let goal = "Santé générale";
      if (plan.calories_range) {
        if (plan.calories_range.includes("1200-1500")) goal = "Perte de poids";
        else if (plan.calories_range.includes("2500+")) goal = "Prise de masse";
        else if (plan.calories_range.includes("1800-2200")) goal = "Maintien";
      }

      if (!acc[goal]) acc[goal] = { achieved: 0, total: 0 };
      acc[goal].total++;
      if (plan.status === "completed") acc[goal].achieved++;

      return acc;
    }, {} as Record<string, { achieved: number; total: number }>);

    return Object.entries(goalCounts).map(([goal, data]) => ({
      goal,
      achieved: (data as { achieved: number; total: number }).achieved,
      total: (data as { achieved: number; total: number }).total,
    }));
  };

  const generateMealTypeData = (plans: any[]) => {
    // Extract meal types from meal plan names/descriptions
    const typeCounts: Record<string, number> = {};

    plans.forEach((plan) => {
      let type = "Équilibré"; // default
      const planName = (plan.name || "").toLowerCase();

      if (
        planName.includes("méditerranéen") ||
        planName.includes("mediterranean")
      )
        type = "Méditerranéen";
      else if (
        planName.includes("végétarien") ||
        planName.includes("vegetarian")
      )
        type = "Végétarien";
      else if (planName.includes("céto") || planName.includes("keto"))
        type = "Cétogène";
      else if (planName.includes("paléo") || planName.includes("paleo"))
        type = "Paléo";
      else if (planName.includes("vegan")) type = "Végétalien";

      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const total = Object.values(typeCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    return Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  };

  const exportReport = async () => {
    if (!analyticsData) return;

    toast({
      title: "Exportation en cours",
      description: "Génération du rapport PDF...",
    });

    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import("jspdf")).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to check page break
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
      };

      // Header
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text("NutriFlow", 20, yPosition);

      yPosition += 10;
      doc.setFontSize(18);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text("Rapport d'Analyse", 20, yPosition);

      yPosition += 5;
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(
        `Généré le ${new Date().toLocaleDateString("fr-FR")}`,
        20,
        yPosition
      );
      doc.text(`Période: ${getTimeRangeLabel(timeRange)}`, 20, yPosition + 5);

      yPosition += 20;

      // Key Metrics
      checkPageBreak(40);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("Métriques Clés", 20, yPosition);
      yPosition += 15;

      const metrics = [
        {
          label: "Total Clients",
          value:
            analyticsData.clientGrowth[analyticsData.clientGrowth.length - 1]
              ?.clients || 0,
        },
        {
          label: "Plans Actifs",
          value:
            analyticsData.planDistribution.find((p) => p.status === "Actif")
              ?.count || 0,
        },
        {
          label: "Revenus du Mois",
          value: `${
            analyticsData.revenueData[analyticsData.revenueData.length - 1]
              ?.revenue || 0
          }€`,
        },
        {
          label: "Factures Émises",
          value:
            analyticsData.revenueData[analyticsData.revenueData.length - 1]
              ?.invoices || 0,
        },
      ];

      metrics.forEach((metric, index) => {
        const xPos = 20 + (index % 2) * 90;
        const yPos = yPosition + Math.floor(index / 2) * 15;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(metric.label + ":", xPos, yPos);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text(metric.value.toString(), xPos + 40, yPos);
      });

      yPosition += 35;

      // Client Growth Data
      checkPageBreak(60);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("Évolution des Clients", 20, yPosition);
      yPosition += 10;

      analyticsData.clientGrowth.slice(-6).forEach((data, index) => {
        checkPageBreak(8);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(
          `${data.month}: ${data.clients} clients (+${data.newClients} nouveaux)`,
          25,
          yPosition
        );
        yPosition += 8;
      });

      yPosition += 10;

      // Plan Distribution
      checkPageBreak(60);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("Distribution des Plans", 20, yPosition);
      yPosition += 10;

      analyticsData.planDistribution.forEach((plan) => {
        checkPageBreak(8);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(`${plan.status}: ${plan.count} plans`, 25, yPosition);
        yPosition += 8;
      });

      yPosition += 10;

      // Revenue Data
      checkPageBreak(60);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("Données de Revenus", 20, yPosition);
      yPosition += 10;

      analyticsData.revenueData.slice(-6).forEach((revenue) => {
        checkPageBreak(8);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(
          `${revenue.month}: ${revenue.revenue}€ (${revenue.invoices} factures)`,
          25,
          yPosition
        );
        yPosition += 8;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("Rapport généré par NutriFlow", pageWidth - 60, pageHeight - 10);

      // Save the PDF
      doc.save(
        `rapport-analytics-${new Date().toISOString().split("T")[0]}.pdf`
      );

      toast({
        title: "Rapport exporté",
        description: "Le rapport PDF a été téléchargé avec succès",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Erreur d'exportation",
        description: "Impossible de générer le rapport PDF",
        variant: "destructive",
      });
    }
  };

  const getTimeRangeLabel = (range: string) => {
    const labels = {
      last7days: "7 derniers jours",
      last30days: "30 derniers jours",
      last3months: "3 derniers mois",
      last6months: "6 derniers mois",
      lastyear: "Dernière année",
    };
    return labels[range as keyof typeof labels] || range;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          title="Analyses & Rapports"
          subtitle="Suivez les performances de votre pratique"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Analyses & Rapports"
        subtitle="Tableau de bord analytique de votre pratique nutritionnelle"
        action={
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">7 derniers jours</SelectItem>
                <SelectItem value="last30days">30 derniers jours</SelectItem>
                <SelectItem value="last3months">3 derniers mois</SelectItem>
                <SelectItem value="last6months">6 derniers mois</SelectItem>
                <SelectItem value="lastyear">Dernière année</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportReport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        }
      />

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Clients
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.clientGrowth[
                    analyticsData.clientGrowth.length - 1
                  ]?.clients || 0}
                </p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% ce mois
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Plans Actifs
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.planDistribution.find(
                    (p) => p.status === "Actif"
                  )?.count || 0}
                </p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% ce mois
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Revenus (mois)
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.revenueData[
                    analyticsData.revenueData.length - 1
                  ]?.revenue || 0}
                  €
                </p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15% ce mois
                </p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Taux de Succès
                </p>
                <p className="text-2xl font-bold text-gray-900">87%</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +3% ce mois
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs
        value={selectedMetric}
        onValueChange={setSelectedMetric}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Croissance des Clients</CardTitle>
              <CardDescription>
                Évolution du nombre de clients sur 6 mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData?.clientGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="clients"
                    stroke="#3b82f6"
                    fill="#93c5fd"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribution des Plans</CardTitle>
              <CardDescription>
                Répartition des plans par statut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData?.planDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {analyticsData?.planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Objectifs Nutritionnels</CardTitle>
              <CardDescription>
                Progression vers les objectifs clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData?.nutritionalGoals.map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{goal.goal}</span>
                    <span className="text-gray-600">
                      {goal.achieved}/{goal.total}
                    </span>
                  </div>
                  <Progress
                    value={(goal.achieved / goal.total) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Types de Plans Populaires</CardTitle>
              <CardDescription>
                Répartition des types de plans alimentaires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analyticsData?.popularMealTypes.map((type, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{type.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{type.count}</div>
                    <div className="text-sm text-gray-600">
                      {type.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution Mensuelle des Clients</CardTitle>
              <CardDescription>
                Nouveaux clients vs total des clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData?.clientGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="newClients"
                    fill="#10b981"
                    name="Nouveaux clients"
                  />
                  <Bar dataKey="clients" fill="#3b82f6" name="Total clients" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Revenus</CardTitle>
              <CardDescription>
                Revenus mensuels et nombre de factures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData?.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Revenus (€)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="invoices"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Nb factures"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement des Clients</CardTitle>
              <CardDescription>
                Nombre de sessions par client actif
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.clientEngagement.map((client, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-gray-600">
                          Dernière activité:{" "}
                          {new Date(client.lastActive).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {client.sessions} sessions
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
