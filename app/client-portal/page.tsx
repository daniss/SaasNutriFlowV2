"use client";

import { useClientAuth } from "@/components/auth/ClientAuthProvider";
import { ClientProtectedRoute } from "@/components/auth/ClientProtectedRoute";
import { ClientDocuments } from "@/components/client-portal/ClientDocuments";
import { ClientGDPRRights } from "@/components/client-portal/ClientGDPRRights";
// MASKED FOR MVP - Messages functionality will be added in future
// import { ClientMessages } from "@/components/client-portal/ClientMessages";
import { MandatoryConsentModal } from "@/components/client-portal/MandatoryConsentModal";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { clientGet, clientPost } from "@/lib/client-api";
import {
  Bell,
  Calendar,
  CalendarDays,
  Download,
  FileText,
  MessageCircle,
  Settings,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ClientPortalData {
  profile: {
    name: string;
    email: string;
    phone?: string;
    age?: number;
    height?: number;
    currentWeight?: number;
    goalWeight?: number;
    goal?: string;
    planType?: string;
    joinDate?: string;
    progress?: number;
  };
  currentPlan: {
    id: string;
    name: string;
    description: string;
    caloriesRange?: string;
    duration: number;
    status: string;
    content?: any;
  } | null;
  weightHistory: Array<{ date: string; weight: number; notes?: string }>;
  appointments: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    type: string;
    status: string;
    location?: string;
    isVirtual?: boolean;
    meetingLink?: string;
    notes?: string;
  }>;
  // MASKED FOR MVP - Messages functionality will be added in future
  /*
  messages: Array<{
    id: string;
    content: string;
    sender: "client" | "dietitian";
    timestamp: string;
    read: boolean;
  }>;
  */
}

function ClientPortalContent() {
  const { client: sessionClient, logout, isAuthenticated } = useClientAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [portalData, setPortalData] = useState<ClientPortalData | null>(null);
  const [newWeight, setNewWeight] = useState("");
  const [weightNote, setWeightNote] = useState("");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentsChecked, setConsentsChecked] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded

  // Load client data on component mount - only once per session
  useEffect(() => {
    const loadClientData = async () => {
      // Prevent redundant API calls
      if (dataLoaded || !sessionClient?.id) return;

      try {
        setLoading(true);

        // SECURITY FIX: Use secure API call without clientId parameter
        const response = await clientGet("/api/client-auth/data");

        if (response.success && response.data) {
          // Fix: The API double-wraps the data, so we need response.data.data
          const actualData = response.data.data || response.data;
          setClient(actualData.profile);
          setPortalData(actualData);
          setDataLoaded(true); // Mark data as loaded
        } else {
          console.error("Error loading client data:", response.error);
        }
      } catch (error) {
        console.error("Error loading client data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadClientData();
  }, [sessionClient?.id, dataLoaded]); // Only depend on sessionClient ID and data loaded state

  // Check if mandatory consents have been given - only after data is loaded
  useEffect(() => {
    const checkConsents = async () => {
      // Only check consents after portal data is loaded and not already checked
      if (!sessionClient?.id || !portalData || consentsChecked) return;

      try {
        // First check localStorage for quick access
        const consentGiven = localStorage.getItem("client-consents-given");

        if (consentGiven === "true") {
          setConsentsChecked(true);
          return;
        }

        // Check with server for current consents
        const response = await clientGet("/api/client-auth/gdpr/consents");

        if (response.success) {
          const data = response.data;

          if (data.success && data.consents) {
            // Check if mandatory consents (data_processing and health_data) are given
            const dataProcessingConsent = data.consents.find(
              (c: any) => c.consent_type === "data_processing" && c.granted
            );
            const healthDataConsent = data.consents.find(
              (c: any) => c.consent_type === "health_data" && c.granted
            );

            if (dataProcessingConsent && healthDataConsent) {
              setConsentsChecked(true);
              localStorage.setItem("client-consents-given", "true");
            } else {
              setShowConsentModal(true);
            }
          } else {
            // No consents found, show modal
            setShowConsentModal(true);
          }
        } else {
          // API error, show modal to be safe
          setShowConsentModal(true);
        }
      } catch (error) {
        console.error("Error checking consents:", error);
        setShowConsentModal(true);
      }
    };

    checkConsents();
  }, [sessionClient?.id, portalData, consentsChecked]); // Add consentsChecked to prevent duplicate checks

  const handleConsentGiven = () => {
    setShowConsentModal(false);
    setConsentsChecked(true);
  };

  const fetchClientPortalData = async () => {
    // Reuse the same logic but allow manual refresh
    try {
      setLoading(true);

      // SECURITY FIX: Use secure API call without clientId parameter
      const response = await clientGet("/api/client-auth/data");

      if (response.success && response.data) {
        setClient(response.data.profile);
        setPortalData(response.data);
        setDataLoaded(true); // Mark data as refreshed
      } else {
        console.error("Error fetching client data:", response.error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWeightUpdate = async () => {
    if (!newWeight || !sessionClient) return;

    try {
      // SECURITY FIX: Use secure API call without clientId in body
      const response = await clientPost("/api/client-auth/weight", {
        weight: parseFloat(newWeight),
        notes: weightNote || undefined,
      });

      if (response.success) {
        const weightValue = parseFloat(newWeight);
        const today = new Date().toISOString().split("T")[0];

        // Update the local state immediately for better UX
        if (portalData) {
          const newWeightEntry = {
            date: today,
            weight: weightValue,
            notes: weightNote || undefined,
          };

          // Update weight history
          const updatedWeightHistory = [
            ...portalData.weightHistory,
            newWeightEntry,
          ];

          // Update current weight in profile
          const updatedProfile = {
            ...portalData.profile,
            currentWeight: weightValue,
          };

          // Update the portal data with new weight info
          setPortalData({
            ...portalData,
            weightHistory: updatedWeightHistory,
            profile: updatedProfile,
          });

          // Also update the client state
          setClient(updatedProfile);
        }

        toast({
          title: "Poids mis à jour",
          description: "Votre nouveau poids a été enregistré avec succès",
        });

        setNewWeight("");
        setWeightNote("");
      } else {
        throw new Error(response.error || "Failed to update weight");
      }
    } catch (error) {
      console.error("Error updating weight:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre poids",
        variant: "destructive",
      });
    }
  };

  const downloadMealPlan = () => {
    // In real implementation, this would generate and download the meal plan PDF
    toast({
      title: "Téléchargement démarré",
      description: "Votre plan alimentaire est en cours de téléchargement",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!portalData || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">
              {loading ? "Chargement..." : "Aucune donnée disponible"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking consents
  if (!consentsChecked && !showConsentModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Vérification des consentements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mandatory Consent Modal */}
      <MandatoryConsentModal
        isOpen={showConsentModal}
        onConsentGiven={handleConsentGiven}
      />

      {/* Portal Content */}
      {consentsChecked && !showConsentModal && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Professional Header */}
          <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                    {portalData.profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Bonjour, {portalData.profile.name}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Votre espace personnel NutriFlow
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-gray-600"
                >
                  Se déconnecter
                </Button>
              </div>
            </div>
          </div>

          {/* Content Container */}
          <div className="p-6">
            {/* Navigation Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-7 mb-6 bg-white">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                >
                  Tableau de bord
                </TabsTrigger>
                <TabsTrigger
                  value="meal-plan"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                >
                  Mon Plan
                </TabsTrigger>
                <TabsTrigger
                  value="progress"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                >
                  Progrès
                </TabsTrigger>
                <TabsTrigger
                  value="appointments"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                >
                  Rendez-vous
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                >
                  Documents
                </TabsTrigger>
                {/* MASKED FOR MVP - Messages functionality will be added in future
                <TabsTrigger
                  value="messages"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                >
                  Messages
                </TabsTrigger>
                */}
                <TabsTrigger
                  value="privacy"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                >
                  Confidentialité
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                  <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-emerald-100 text-sm font-medium">
                            Progrès du plan
                          </p>
                          <p className="text-3xl font-bold">
                            {portalData.profile.progress || 0}%
                          </p>
                        </div>
                        <Target className="h-8 w-8 text-emerald-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">
                            Poids actuel
                          </p>
                          <p className="text-3xl font-bold">
                            {portalData.profile.currentWeight || "N/A"} kg
                          </p>
                          {(() => {
                            const currentWeight =
                              portalData.profile.currentWeight;
                            const weightHistory =
                              portalData.weightHistory || [];
                            if (currentWeight && weightHistory.length > 0) {
                              const initialWeight =
                                weightHistory[weightHistory.length - 1]
                                  ?.weight || currentWeight;
                              const weightChange =
                                currentWeight - initialWeight;
                              if (weightChange !== 0) {
                                return (
                                  <p className="text-blue-200 text-xs">
                                    {weightChange > 0 ? "+" : ""}
                                    {weightChange.toFixed(1)}kg depuis le début
                                  </p>
                                );
                              }
                            }
                            return null;
                          })()}
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium">
                            Progrès global
                          </p>
                          {(() => {
                            const progress = portalData.profile.progress || 0;
                            const weightHistory =
                              portalData.weightHistory || [];
                            const hasData = weightHistory.length > 0;
                            const achievementsCount = hasData
                              ? Math.min(Math.floor(progress / 25), 4)
                              : 0;

                            return (
                              <>
                                <p className="text-3xl font-bold">
                                  {progress.toFixed(0)}%
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {progress >= 75 ? (
                                    <Badge className="bg-purple-400 text-purple-900 border-0 text-xs">
                                      Excellent
                                    </Badge>
                                  ) : progress >= 50 ? (
                                    <Badge className="bg-purple-400 text-purple-900 border-0 text-xs">
                                      Très bien
                                    </Badge>
                                  ) : progress >= 25 ? (
                                    <Badge className="bg-purple-400 text-purple-900 border-0 text-xs">
                                      Bon progrès
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-purple-400 text-purple-900 border-0 text-xs">
                                      Début
                                    </Badge>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <Target className="h-8 w-8 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Current Plan - Takes 2 columns */}
                  <div className="lg:col-span-2 space-y-8">
                    {portalData.currentPlan && (
                      <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                          <CardTitle className="text-xl text-emerald-800">
                            Plan Alimentaire Actuel
                          </CardTitle>
                          <CardDescription className="text-emerald-600">
                            {portalData.currentPlan.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Progression
                                </span>
                                <span className="text-sm text-emerald-600 font-medium">
                                  {portalData.profile.progress || 0}%
                                </span>
                              </div>
                              <Progress
                                value={portalData.profile.progress || 0}
                                className="h-2 bg-gray-100"
                              />
                            </div>

                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-emerald-800">
                                    Prochain repas
                                  </h4>
                                  <p className="text-emerald-700">
                                    Déjeuner: Salade de quinoa aux légumes
                                    grillés
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Télécharger le plan
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <Button
                                variant="outline"
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Poser une question
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Achievements - Real Data */}
                    <Card className="shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                        <CardTitle className="text-xl text-amber-800">
                          Vos Réussites
                        </CardTitle>
                        <CardDescription className="text-amber-600">
                          Célébrez vos victoires, grandes et petites
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {(() => {
                            const achievements = [];
                            const weightHistory =
                              portalData.weightHistory || [];
                            const profile = portalData.profile || {};
                            const joinDate = profile.joinDate
                              ? new Date(profile.joinDate)
                              : null;
                            const currentWeight = profile.currentWeight;
                            const goalWeight = profile.goalWeight;

                            // Achievement 1: Weight loss milestones
                            if (
                              weightHistory.length >= 2 &&
                              currentWeight &&
                              goalWeight
                            ) {
                              const initialWeight =
                                weightHistory[weightHistory.length - 1]
                                  ?.weight || currentWeight;
                              const weightLost = initialWeight - currentWeight;

                              if (weightLost >= 1) {
                                const latestWeightDate = weightHistory.find(
                                  (w) => w.weight === currentWeight
                                )?.date;
                                achievements.push({
                                  id: "weight-loss",
                                  achieved: true,
                                  title: `${weightLost.toFixed(1)}kg perdus`,
                                  description: `Excellent progrès vers votre objectif !`,
                                  date: latestWeightDate || "Récemment",
                                });
                              }
                            }

                            // Achievement 2: Program consistency (being tracked for more than 30 days)
                            if (joinDate) {
                              const daysSinceJoin = Math.floor(
                                (new Date().getTime() - joinDate.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              );
                              if (daysSinceJoin >= 30) {
                                achievements.push({
                                  id: "consistency",
                                  achieved: true,
                                  title: "Engagement de 30 jours",
                                  description: `${daysSinceJoin} jours de suivi nutritionnel`,
                                  date: new Date(
                                    joinDate.getTime() +
                                      30 * 24 * 60 * 60 * 1000
                                  ).toLocaleDateString(),
                                });
                              }
                            }

                            // Achievement 3: Weight tracking consistency
                            if (weightHistory.length >= 5) {
                              achievements.push({
                                id: "weight-tracking",
                                achieved: true,
                                title: "Suivi régulier du poids",
                                description: `${weightHistory.length} pesées enregistrées`,
                                date: weightHistory[0]?.date || "Récemment",
                              });
                            }

                            // Achievement 4: Progress milestone (25%, 50%, 75% of goal)
                            if (
                              currentWeight &&
                              goalWeight &&
                              profile.currentWeight
                            ) {
                              const initialWeight =
                                weightHistory[weightHistory.length - 1]
                                  ?.weight || currentWeight;
                              const totalToLose = initialWeight - goalWeight;
                              const currentProgress =
                                ((initialWeight - currentWeight) /
                                  totalToLose) *
                                100;

                              if (currentProgress >= 25) {
                                let milestone = "";
                                if (currentProgress >= 75) milestone = "75%";
                                else if (currentProgress >= 50)
                                  milestone = "50%";
                                else milestone = "25%";

                                achievements.push({
                                  id: "progress",
                                  achieved: true,
                                  title: `${milestone} de l'objectif atteint`,
                                  description: `${currentProgress.toFixed(
                                    0
                                  )}% de votre objectif final`,
                                  date: "En cours",
                                });
                              }
                            }

                            // Achievement 5: Goal achieved
                            if (
                              currentWeight &&
                              goalWeight &&
                              currentWeight <= goalWeight
                            ) {
                              achievements.push({
                                id: "goal-achieved",
                                achieved: true,
                                title: "Objectif de poids atteint !",
                                description:
                                  "Félicitations pour cette réussite exceptionnelle !",
                                date: "Atteint !",
                              });
                            }

                            // Future achievements (not yet achieved)
                            const futureAchievements = [];

                            if (
                              achievements.length === 0 ||
                              !achievements.find((a) => a.id === "weight-loss")
                            ) {
                              futureAchievements.push({
                                id: "first-kg",
                                achieved: false,
                                title: "Premier kilogramme",
                                description: "Perdez votre premier kilogramme",
                              });
                            }

                            if (
                              !achievements.find(
                                (a) => a.id === "weight-tracking"
                              ) &&
                              weightHistory.length < 5
                            ) {
                              futureAchievements.push({
                                id: "tracking-goal",
                                achieved: false,
                                title: "Suivi régulier",
                                description: "Enregistrez 5 pesées",
                              });
                            }

                            return (
                              <>
                                {achievements.map((achievement) => (
                                  <div
                                    key={achievement.id}
                                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-3 w-3 rounded-full bg-green-500" />
                                      <div className="flex-1">
                                        <h4 className="font-medium text-green-800">
                                          {achievement.title}
                                        </h4>
                                        <p className="text-sm text-green-700">
                                          {achievement.description}
                                        </p>
                                        <p className="text-xs text-green-600 mt-1">
                                          Atteint le{" "}
                                          {typeof achievement.date === "string"
                                            ? achievement.date
                                            : new Date(
                                                achievement.date
                                              ).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {futureAchievements
                                  .slice(0, 2)
                                  .map((achievement) => (
                                    <div
                                      key={achievement.id}
                                      className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 rounded-full bg-gray-300" />
                                        <div className="flex-1">
                                          <h4 className="font-medium text-gray-600">
                                            {achievement.title}
                                          </h4>
                                          <p className="text-sm text-gray-600">
                                            {achievement.description}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                {achievements.length === 0 &&
                                  futureAchievements.length === 0 && (
                                    <div className="text-center py-6 text-gray-500">
                                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                      <p>
                                        Continuez votre parcours pour débloquer
                                        des réussites !
                                      </p>
                                    </div>
                                  )}
                              </>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Weight Chart */}
                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Évolution du Poids
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {portalData.weightHistory.length > 0 ? (
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={portalData.weightHistory}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f0f0f0"
                              />
                              <XAxis
                                dataKey="date"
                                tickFormatter={(value) =>
                                  new Date(value).toLocaleDateString()
                                }
                                fontSize={12}
                              />
                              <YAxis
                                domain={["dataMin - 1", "dataMax + 1"]}
                                fontSize={12}
                              />
                              <Tooltip
                                labelFormatter={(value) =>
                                  new Date(value).toLocaleDateString()
                                }
                                formatter={(value) => [`${value} kg`, "Poids"]}
                              />
                              <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>Aucune donnée de poids disponible</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-lg">Informations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Poids actuel
                          </span>
                          <Badge variant="secondary">
                            {portalData.profile.currentWeight || "N/A"} kg
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Objectif
                          </span>
                          <Badge variant="outline">
                            {portalData.profile.goalWeight || "N/A"} kg
                          </Badge>
                        </div>
                        {portalData.profile.age && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Âge</span>
                            <Badge variant="secondary">
                              {portalData.profile.age} ans
                            </Badge>
                          </div>
                        )}
                        {portalData.profile.goal && (
                          <div className="pt-4 border-t border-gray-100">
                            <span className="text-sm text-gray-600">Plan</span>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {portalData.profile.goal}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="meal-plan" className="mt-8">
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl text-emerald-800">
                          Plan Alimentaire
                        </CardTitle>
                        <CardDescription className="text-emerald-600">
                          Votre programme nutritionnel personnalisé
                        </CardDescription>
                      </div>
                      <Button
                        onClick={downloadMealPlan}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {portalData.currentPlan ? (
                      <div className="space-y-6">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                          <h3 className="font-semibold text-lg text-emerald-800 mb-2">
                            {portalData.currentPlan.name}
                          </h3>
                          <p className="text-emerald-700 mb-4">
                            {portalData.currentPlan.description}
                          </p>
                          <div className="text-sm text-emerald-600">
                            Plan: {portalData.currentPlan.name} • Durée:{" "}
                            {portalData.currentPlan.duration} jours
                          </div>
                        </div>

                        <div className="text-center py-12 text-gray-500">
                          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium mb-2">
                            Détails des repas
                          </h3>
                          <p>
                            Le détail de vos repas quotidiens sera bientôt
                            disponible ici.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">
                          Aucun plan assigné
                        </h3>
                        <p>
                          Votre diététicien vous assignera bientôt un plan
                          alimentaire personnalisé.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="mt-8">
                <div className="grid gap-8 lg:grid-cols-2">
                  {/* Weight Tracking */}
                  <Card className="shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                      <CardTitle className="text-xl text-blue-800">
                        Suivi du Poids
                      </CardTitle>
                      <CardDescription className="text-blue-600">
                        Enregistrez votre poids pour suivre votre progression
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label
                              htmlFor="weight"
                              className="text-sm font-medium"
                            >
                              Nouveau poids (kg)
                            </Label>
                            <Input
                              id="weight"
                              type="number"
                              step="0.1"
                              value={newWeight}
                              onChange={(e) => setNewWeight(e.target.value)}
                              placeholder="Ex: 70.5"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="note"
                              className="text-sm font-medium"
                            >
                              Note (optionnelle)
                            </Label>
                            <Textarea
                              id="note"
                              value={weightNote}
                              onChange={(e) => setWeightNote(e.target.value)}
                              placeholder="Comment vous sentez-vous ?"
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleWeightUpdate}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Enregistrer le poids
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Weight Chart */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        Graphique d'évolution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {portalData.weightHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={portalData.weightHistory}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) =>
                                new Date(value).toLocaleDateString()
                              }
                              fontSize={12}
                            />
                            <YAxis
                              domain={["dataMin - 1", "dataMax + 1"]}
                              fontSize={12}
                            />
                            <Tooltip
                              labelFormatter={(value) =>
                                new Date(value).toLocaleDateString()
                              }
                              formatter={(value) => [`${value} kg`, "Poids"]}
                            />
                            <Line
                              type="monotone"
                              dataKey="weight"
                              stroke="#3b82f6"
                              strokeWidth={3}
                              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium mb-2">
                            Commencer le suivi
                          </h3>
                          <p>
                            Enregistrez votre premier poids pour voir votre
                            progression
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Progress Summary */}
                  <Card className="lg:col-span-2 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                      <CardTitle className="text-xl text-emerald-800">
                        Résumé de progression
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-emerald-600 mb-4">
                          {portalData.profile.progress || 0}%
                        </div>
                        <p className="text-lg text-gray-600 mb-6">
                          Progression vers votre objectif
                        </p>
                        <div className="grid gap-4 md:grid-cols-3 text-center">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-blue-600">
                              {portalData.profile.currentWeight || "N/A"} kg
                            </div>
                            <div className="text-sm text-blue-600">
                              Poids actuel
                            </div>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-emerald-600">
                              {portalData.profile.goalWeight || "N/A"} kg
                            </div>
                            <div className="text-sm text-emerald-600">
                              Objectif
                            </div>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-amber-600">
                              {portalData.weightHistory.length}
                            </div>
                            <div className="text-sm text-amber-600">
                              Mesures enregistrées
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="appointments" className="mt-8">
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                    <CardTitle className="text-xl text-orange-800 flex items-center gap-2">
                      <CalendarDays className="h-5 w-5" />
                      Mes Rendez-vous
                    </CardTitle>
                    <CardDescription className="text-orange-600">
                      Vos consultations passées et à venir
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {portalData.appointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {appointment.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {new Date(
                                  appointment.date
                                ).toLocaleDateString()}{" "}
                                à {appointment.time}
                              </p>
                              {appointment.notes && (
                                <p className="text-sm text-gray-500 mt-2">
                                  {appointment.notes}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant={
                                appointment.status === "confirmed"
                                  ? "default"
                                  : appointment.status === "completed"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={
                                appointment.status === "confirmed"
                                  ? "bg-emerald-500 text-white"
                                  : appointment.status === "completed"
                                  ? "bg-gray-500 text-white"
                                  : ""
                              }
                            >
                              {appointment.status === "confirmed"
                                ? "Confirmé"
                                : appointment.status === "completed"
                                ? "Terminé"
                                : appointment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {portalData.appointments.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium mb-2">
                            Aucun rendez-vous
                          </h3>
                          <p>Vos prochains rendez-vous apparaîtront ici.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MASKED FOR MVP - Messages functionality will be added in future
              <TabsContent value="messages" className="mt-8">
                <ClientMessages initialMessages={portalData.messages} />
              </TabsContent>
              */}

              <TabsContent value="documents" className="mt-8">
                <Card className="bg-white shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-lg">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="h-6 w-6" />
                      Mes Documents
                    </CardTitle>
                    <CardDescription className="text-emerald-100">
                      Consultez et téléchargez les documents partagés par votre
                      diététicien
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ClientDocuments />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy" className="mt-8">
                <ClientGDPRRights />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </>
  );
}

export default function ClientPortalPage() {
  return (
    <ClientProtectedRoute>
      <ClientPortalContent />
    </ClientProtectedRoute>
  );
}
