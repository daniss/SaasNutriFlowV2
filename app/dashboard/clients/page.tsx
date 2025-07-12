"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSkeleton, GridSkeleton } from "@/components/shared/skeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuthNew";
import { supabase, type Client } from "@/lib/supabase";
import {
  Activity,
  Calendar,
  ChevronRight,
  Mail,
  Phone,
  Plus,
  Scale,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailValidationLoading, setEmailValidationLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    age: "",
    height: "",
    current_weight: "",
    goal_weight: "",
    goal: "",
    plan_type: "",
    notes: "",
  });

  // Form validation states for new client
  const [clientValidation, setClientValidation] = useState({
    name: { isValid: true, message: "" },
    email: { isValid: true, message: "" },
    phone: { isValid: true, message: "" },
    age: { isValid: true, message: "" },
    height: { isValid: true, message: "" },
    current_weight: { isValid: true, message: "" },
    goal_weight: { isValid: true, message: "" },
  });

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const calculateProgress = (
    initialWeight: number,
    currentWeight: number,
    goalWeight: number
  ): number => {
    // If goal is weight loss (goal < initial)
    if (goalWeight < initialWeight) {
      const totalWeightToLose = initialWeight - goalWeight;
      const weightLost = Math.max(0, initialWeight - currentWeight); // Ensure non-negative
      return Math.min(100, Math.round((weightLost / totalWeightToLose) * 100));
    }
    // If goal is weight gain (goal > initial)
    else if (goalWeight > initialWeight) {
      const totalWeightToGain = goalWeight - initialWeight;
      const weightGained = Math.max(0, currentWeight - initialWeight); // Ensure non-negative
      return Math.min(
        100,
        Math.round((weightGained / totalWeightToGain) * 100)
      );
    }
    // If goal equals initial weight (maintenance)
    else {
      return 100;
    }
  };

  const fetchClients = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("dietitian_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching clients:", error);
        return;
      }

      // Fetch weight history for each client and calculate progress
      const clientsWithProgress = await Promise.all(
        (data || []).map(async (client) => {
          if (!client.goal_weight || !client.current_weight) {
            return { ...client, progress_percentage: 0 };
          }

          // Fetch weight history to get initial weight
          const { data: weightHistory, error: weightError } = await supabase
            .from("weight_history")
            .select("*")
            .eq("client_id", client.id)
            .order("recorded_date", { ascending: true });

          if (weightError || !weightHistory || weightHistory.length === 0) {
            // No weight history, use current weight as baseline
            return { ...client, progress_percentage: 0 };
          }

          const initialWeight = weightHistory[0].weight;
          const progress = calculateProgress(
            initialWeight,
            client.current_weight,
            client.goal_weight
          );

          return { ...client, progress_percentage: progress };
        })
      );

      setClients(clientsWithProgress);
    } catch (error) {
      console.error("Unexpected error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!user) return;

    // Validate all fields (email validation is async)
    const validations = {
      name: validateClientName(newClient.name),
      email: await validateClientEmail(newClient.email),
      phone: validateClientPhone(newClient.phone),
      age: validateClientAge(newClient.age),
      height: validateClientHeight(newClient.height),
      current_weight: validateClientWeight(newClient.current_weight),
      goal_weight: validateClientWeight(newClient.goal_weight),
    };

    setClientValidation(validations);

    // Check if any validation failed
    const hasErrors = Object.values(validations).some(
      (validation) => !validation.isValid
    );
    if (hasErrors) {
      return;
    }

    try {
      const clientData = {
        dietitian_id: user.id,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone || null,
        address: newClient.address || null,
        age: newClient.age ? Number.parseInt(newClient.age) : null,
        height: newClient.height || null,
        current_weight: newClient.current_weight
          ? Number.parseFloat(newClient.current_weight)
          : null,
        goal_weight: newClient.goal_weight
          ? Number.parseFloat(newClient.goal_weight)
          : null,
        goal: newClient.goal,
        plan_type: newClient.plan_type,
        status: "active",
        tags: [],
        notes: newClient.notes || null,
        emergency_contact: null,
        join_date: new Date().toISOString().split("T")[0],
        last_session: null,
        next_appointment: null,
        progress_percentage: 0,
      };

      const { data, error } = await supabase
        .from("clients")
        .insert(clientData)
        .select()
        .single();

      if (error) {
        console.error("Error adding client:", error);
        return;
      }

      // If client has a current weight, create an initial weight measurement
      if (clientData.current_weight) {
        try {
          await supabase.from("weight_history").insert({
            client_id: data.id,
            weight: clientData.current_weight,
            recorded_date: new Date().toISOString().split("T")[0],
            notes: "Poids initial lors de la création du profil",
          });

          console.log("✅ Initial weight measurement created");
        } catch (weightError) {
          console.error(
            "⚠️ Error creating initial weight measurement:",
            weightError
          );
          // Don't fail the client creation if weight history fails
        }
      }

      setClients([data, ...clients]);
      setIsAddDialogOpen(false);
      // Reset form and validation
      setNewClient({
        name: "",
        email: "",
        phone: "",
        address: "",
        age: "",
        height: "",
        current_weight: "",
        goal_weight: "",
        goal: "",
        plan_type: "",
        notes: "",
      });
      setClientValidation({
        name: { isValid: true, message: "" },
        email: { isValid: true, message: "" },
        phone: { isValid: true, message: "" },
        age: { isValid: true, message: "" },
        height: { isValid: true, message: "" },
        current_weight: { isValid: true, message: "" },
        goal_weight: { isValid: true, message: "" },
      });
    } catch (error) {
      console.error("❌ Unexpected error adding client:", error);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Validation functions for new client
  const validateClientEmail = async (
    email: string
  ): Promise<{ isValid: boolean; message: string }> => {
    if (!email.trim()) {
      return { isValid: false, message: "L'email est requis" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: "Veuillez entrer un email valide" };
    }

    // Check if email already exists for this dietitian
    if (user) {
      setEmailValidationLoading(true);
      try {
        const { data: existingClient, error } = await supabase
          .from("clients")
          .select("id")
          .eq("dietitian_id", user.id)
          .eq("email", email.trim())
          .limit(1)
          .single();

        if (existingClient && !error) {
          return {
            isValid: false,
            message:
              "Cette adresse email est déjà utilisée par un autre client",
          };
        }
      } catch (err) {
        // If no client found, that's good (error expected)
        // Only log unexpected errors
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          err.code !== "PGRST116"
        ) {
          console.error("Error checking email uniqueness:", err);
        }
      } finally {
        setEmailValidationLoading(false);
      }
    }

    return { isValid: true, message: "" };
  };

  const validateClientName = (
    name: string
  ): { isValid: boolean; message: string } => {
    if (!name.trim()) {
      return { isValid: false, message: "Le nom est requis" };
    }

    if (name.trim().length < 2) {
      return {
        isValid: false,
        message: "Le nom doit contenir au moins 2 caractères",
      };
    }

    return { isValid: true, message: "" };
  };

  const validateClientPhone = (
    phone: string
  ): { isValid: boolean; message: string } => {
    if (!phone.trim()) {
      return { isValid: true, message: "" }; // Phone is optional
    }

    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      return {
        isValid: false,
        message: "Veuillez entrer un numéro de téléphone français valide",
      };
    }

    return { isValid: true, message: "" };
  };

  const validateClientAge = (
    age: string
  ): { isValid: boolean; message: string } => {
    if (!age.trim()) {
      return { isValid: true, message: "" }; // Age is optional
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum)) {
      return { isValid: false, message: "Veuillez entrer un âge valide" };
    }

    if (ageNum < 1 || ageNum > 120) {
      return { isValid: false, message: "L'âge doit être entre 1 et 120 ans" };
    }

    return { isValid: true, message: "" };
  };

  const validateClientWeight = (
    weight: string
  ): { isValid: boolean; message: string } => {
    if (!weight.trim()) {
      return { isValid: true, message: "" }; // Weight is optional
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum)) {
      return { isValid: false, message: "Veuillez entrer un poids valide" };
    }

    if (weightNum <= 0 || weightNum > 999) {
      return {
        isValid: false,
        message: "Le poids doit être entre 1 et 999 kg",
      };
    }

    return { isValid: true, message: "" };
  };

  const validateClientHeight = (
    height: string
  ): { isValid: boolean; message: string } => {
    if (!height.trim()) {
      return { isValid: true, message: "" }; // Height is optional
    }

    // Remove any non-numeric characters except decimal point and "m"
    const cleanHeight = height.replace(/[^\d.m]/g, "");

    // If it contains "m", convert to cm
    let heightValue = cleanHeight;
    if (cleanHeight.includes("m")) {
      const meters = parseFloat(cleanHeight.replace("m", ""));
      if (!isNaN(meters)) {
        heightValue = (meters * 100).toString();
      }
    }

    const heightNum = parseFloat(heightValue);
    if (isNaN(heightNum)) {
      return {
        isValid: false,
        message: "Veuillez entrer une taille valide (ex: 175)",
      };
    }

    if (heightNum < 50 || heightNum > 300) {
      return {
        isValid: false,
        message: "La taille doit être entre 50 et 300 cm",
      };
    }

    return { isValid: true, message: "" };
  };

  // ...existing code...

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Gestion des clients"
        subtitle="Gérez et suivez les parcours nutritionnels de vos clients"
        searchPlaceholder="Rechercher des clients..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto shadow-soft-lg border-0">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Ajouter un nouveau client
                </DialogTitle>
                <DialogDescription className="text-gray-600 leading-relaxed">
                  Créez un nouveau profil client pour commencer à gérer son
                  parcours nutritionnel.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Nom complet *
                    </Label>
                    <Input
                      id="name"
                      value={newClient.name}
                      onChange={(e) => {
                        setNewClient({ ...newClient, name: e.target.value });
                        if (clientValidation.name.message) {
                          setClientValidation({
                            ...clientValidation,
                            name: { isValid: true, message: "" },
                          });
                        }
                      }}
                      onBlur={() => {
                        if (newClient.name) {
                          const validation = validateClientName(newClient.name);
                          setClientValidation({
                            ...clientValidation,
                            name: validation,
                          });
                        }
                      }}
                      placeholder="Marie Dupont"
                      className={`border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 ${
                        !clientValidation.name.isValid
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
                          : ""
                      }`}
                    />
                    {!clientValidation.name.isValid && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {clientValidation.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClient.email}
                      onChange={(e) => {
                        setNewClient({ ...newClient, email: e.target.value });
                        if (clientValidation.email.message) {
                          setClientValidation({
                            ...clientValidation,
                            email: { isValid: true, message: "" },
                          });
                        }
                      }}
                      onBlur={async () => {
                        if (newClient.email) {
                          const validation = await validateClientEmail(
                            newClient.email
                          );
                          setClientValidation({
                            ...clientValidation,
                            email: validation,
                          });
                        }
                      }}
                      placeholder="marie@exemple.fr"
                      className={`border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 ${
                        !clientValidation.email.isValid
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
                          : ""
                      }`}
                    />
                    {!clientValidation.email.isValid && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {clientValidation.email.message}
                      </p>
                    )}
                    {emailValidationLoading && (
                      <p className="text-sm text-blue-600 flex items-center gap-1">
                        <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full"></div>
                        Vérification de l'email...
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      value={newClient.phone}
                      onChange={(e) => {
                        setNewClient({ ...newClient, phone: e.target.value });
                        if (clientValidation.phone.message) {
                          setClientValidation({
                            ...clientValidation,
                            phone: { isValid: true, message: "" },
                          });
                        }
                      }}
                      onBlur={() => {
                        if (newClient.phone) {
                          const validation = validateClientPhone(
                            newClient.phone
                          );
                          setClientValidation({
                            ...clientValidation,
                            phone: validation,
                          });
                        }
                      }}
                      placeholder="+33 1 23 45 67 89"
                      className={`border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 ${
                        !clientValidation.phone.isValid
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
                          : ""
                      }`}
                    />
                    {!clientValidation.phone.isValid && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {clientValidation.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="age"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Âge
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      value={newClient.age}
                      onChange={(e) => {
                        setNewClient({ ...newClient, age: e.target.value });
                        if (clientValidation.age.message) {
                          setClientValidation({
                            ...clientValidation,
                            age: { isValid: true, message: "" },
                          });
                        }
                      }}
                      onBlur={() => {
                        if (newClient.age) {
                          const validation = validateClientAge(newClient.age);
                          setClientValidation({
                            ...clientValidation,
                            age: validation,
                          });
                        }
                      }}
                      placeholder="30"
                      className={`border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 ${
                        !clientValidation.age.isValid
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
                          : ""
                      }`}
                    />
                    {!clientValidation.age.isValid && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {clientValidation.age.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Adresse
                  </Label>
                  <Input
                    id="address"
                    value={newClient.address}
                    onChange={(e) =>
                      setNewClient({ ...newClient, address: e.target.value })
                    }
                    placeholder="123 Rue de la Paix, 75001 Paris"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="height"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Taille
                    </Label>
                    <Input
                      id="height"
                      value={newClient.height}
                      onChange={(e) => {
                        setNewClient({ ...newClient, height: e.target.value });
                        if (clientValidation.height.message) {
                          setClientValidation({
                            ...clientValidation,
                            height: { isValid: true, message: "" },
                          });
                        }
                      }}
                      onBlur={() => {
                        if (newClient.height) {
                          const validation = validateClientHeight(
                            newClient.height
                          );
                          setClientValidation({
                            ...clientValidation,
                            height: validation,
                          });
                        }
                      }}
                      placeholder="175"
                      className={`border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 ${
                        !clientValidation.height.isValid
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
                          : ""
                      }`}
                    />
                    {!clientValidation.height.isValid && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {clientValidation.height.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="current_weight"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Poids actuel (kg)
                    </Label>
                    <Input
                      id="current_weight"
                      type="number"
                      value={newClient.current_weight}
                      onChange={(e) => {
                        setNewClient({
                          ...newClient,
                          current_weight: e.target.value,
                        });
                        if (clientValidation.current_weight.message) {
                          setClientValidation({
                            ...clientValidation,
                            current_weight: { isValid: true, message: "" },
                          });
                        }
                      }}
                      onBlur={() => {
                        if (newClient.current_weight) {
                          const validation = validateClientWeight(
                            newClient.current_weight
                          );
                          setClientValidation({
                            ...clientValidation,
                            current_weight: validation,
                          });
                        }
                      }}
                      placeholder="70"
                      className={`border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 ${
                        !clientValidation.current_weight.isValid
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
                          : ""
                      }`}
                    />
                    {!clientValidation.current_weight.isValid && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {clientValidation.current_weight.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="goal_weight"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Poids objectif (kg)
                    </Label>
                    <Input
                      id="goal_weight"
                      type="number"
                      value={newClient.goal_weight}
                      onChange={(e) => {
                        setNewClient({
                          ...newClient,
                          goal_weight: e.target.value,
                        });
                        if (clientValidation.goal_weight.message) {
                          setClientValidation({
                            ...clientValidation,
                            goal_weight: { isValid: true, message: "" },
                          });
                        }
                      }}
                      onBlur={() => {
                        if (newClient.goal_weight) {
                          const validation = validateClientWeight(
                            newClient.goal_weight
                          );
                          setClientValidation({
                            ...clientValidation,
                            goal_weight: validation,
                          });
                        }
                      }}
                      placeholder="65"
                      className={`border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 ${
                        !clientValidation.goal_weight.isValid
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
                          : ""
                      }`}
                    />
                    {!clientValidation.goal_weight.isValid && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {clientValidation.goal_weight.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="goal"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Objectif principal
                    </Label>
                    <Select
                      value={newClient.goal}
                      onValueChange={(value: string) =>
                        setNewClient({ ...newClient, goal: value })
                      }
                    >
                      <SelectTrigger className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20">
                        <SelectValue placeholder="Choisir un objectif" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight_loss">
                          Perte de poids
                        </SelectItem>
                        <SelectItem value="weight_gain">
                          Prise de poids
                        </SelectItem>
                        <SelectItem value="muscle_gain">
                          Prise de masse musculaire
                        </SelectItem>
                        <SelectItem value="maintenance">Maintien</SelectItem>
                        <SelectItem value="health_improvement">
                          Amélioration de la santé
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="plan_type"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Type de plan
                    </Label>
                    <Select
                      value={newClient.plan_type}
                      onValueChange={(value: string) =>
                        setNewClient({ ...newClient, plan_type: value })
                      }
                    >
                      <SelectTrigger className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20">
                        <SelectValue placeholder="Choisir un plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basique</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="custom">Personnalisé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="notes"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={newClient.notes}
                    onChange={(e) =>
                      setNewClient({ ...newClient, notes: e.target.value })
                    }
                    placeholder="Notes supplémentaires concernant le client..."
                    rows={3}
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 resize-none"
                  />
                </div>
              </div>
              <DialogFooter className="gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="border-gray-200 hover:bg-gray-50"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAddClient}
                  disabled={
                    !newClient.name ||
                    !newClient.email ||
                    !clientValidation.name.isValid ||
                    !clientValidation.email.isValid ||
                    !clientValidation.phone.isValid ||
                    !clientValidation.age.isValid ||
                    !clientValidation.height.isValid ||
                    !clientValidation.current_weight.isValid ||
                    !clientValidation.goal_weight.isValid ||
                    emailValidationLoading
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft disabled:opacity-50 font-medium"
                >
                  Ajouter client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="px-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-slide-up animate-delay-100">
          <Card className="border-0 shadow-soft hover:shadow-soft-lg bg-gradient-to-br from-emerald-50/90 to-emerald-100/60 hover:from-emerald-50 hover:to-emerald-100/80 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-emerald-700 text-sm font-semibold tracking-wide">
                    Total clients
                  </p>
                  <p className="text-2xl font-bold text-emerald-900 tabular-nums">
                    {clients.length}
                  </p>
                  <p className="text-emerald-600 text-xs font-medium">
                    Relations actives
                  </p>
                </div>
                <div className="h-12 w-12 bg-emerald-200/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Users className="h-6 w-6 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft hover:shadow-soft-lg bg-gradient-to-br from-blue-50/90 to-blue-100/60 hover:from-blue-50 hover:to-blue-100/80 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-blue-700 text-sm font-semibold tracking-wide">
                    Objectifs actifs
                  </p>
                  <p className="text-2xl font-bold text-blue-900 tabular-nums">
                    {clients.filter((c) => c.status === "active").length}
                  </p>
                  <p className="text-blue-600 text-xs font-medium">En cours</p>
                </div>
                <div className="h-12 w-12 bg-blue-200/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Target className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft hover:shadow-soft-lg bg-gradient-to-br from-orange-50/90 to-orange-100/60 hover:from-orange-50 hover:to-orange-100/80 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-orange-700 text-sm font-semibold tracking-wide">
                    Progrès moyen
                  </p>
                  <p className="text-2xl font-bold text-orange-900 tabular-nums">
                    {clients.length > 0
                      ? Math.round(
                          clients.reduce(
                            (sum, c) => sum + (c.progress_percentage || 0),
                            0
                          ) / clients.length
                        )
                      : 0}
                    %
                  </p>
                  <p className="text-orange-600 text-xs font-medium">
                    Accomplissement objectif
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-200/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <TrendingUp className="h-6 w-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft hover:shadow-soft-lg bg-gradient-to-br from-purple-50/90 to-purple-100/60 hover:from-purple-50 hover:to-purple-100/80 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-purple-700 text-sm font-semibold tracking-wide">
                    Ce mois-ci
                  </p>
                  <p className="text-2xl font-bold text-purple-900 tabular-nums">
                    {
                      clients.filter((c) => {
                        const joinDate = new Date(c.join_date);
                        const now = new Date();
                        return (
                          joinDate.getMonth() === now.getMonth() &&
                          joinDate.getFullYear() === now.getFullYear()
                        );
                      }).length
                    }
                  </p>
                  <p className="text-purple-600 text-xs font-medium">
                    Nouveaux clients
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-200/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Activity className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client List Section */}
        <div>
          {loading ? (
            <GridSkeleton items={6} />
          ) : filteredClients.length === 0 ? (
            <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm animate-scale-in">
              <CardContent className="pt-16 pb-16">
                <div className="text-center">
                  <div className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-8 shadow-soft">
                    <Users className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {searchTerm
                      ? "Aucun client trouvé"
                      : "Aucun client pour le moment"}
                  </h3>
                  <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                    {searchTerm
                      ? "Essayez d'ajuster vos critères de recherche ou ajoutez un nouveau client."
                      : "Commencez par ajouter votre premier client pour débuter son parcours nutritionnel."}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajoutez votre premier client
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-slide-up animate-delay-300">
              {filteredClients.map((client, index) => (
                <Card
                  key={client.id}
                  className="group border-0 shadow-soft bg-white/90 backdrop-blur-sm hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6">
                    {/* Client Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-white shadow-soft group-hover:ring-emerald-100 transition-all duration-200">
                            <AvatarImage
                              src={`https://avatar.vercel.sh/${client.email}`}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 font-semibold">
                              {client.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {client.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate flex items-center">
                            <Mail className="mr-1 h-3 w-3 opacity-60" />
                            {client.email}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          client.status === "active" ? "default" : "secondary"
                        }
                        className={`${
                          client.status === "active"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-600"
                        } border-0 font-medium px-3 py-1`}
                      >
                        {client.status === "active" ? "Actif" : "Inactif"}
                      </Badge>
                    </div>

                    {/* Client Info */}
                    <div className="space-y-3 mb-6">
                      {client.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="mr-3 h-3 w-3 text-gray-400" />
                          <span className="font-medium">{client.phone}</span>
                        </div>
                      )}

                      {client.goal && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-600">
                            <Target className="mr-3 h-3 w-3 text-gray-400" />
                            <span>Objectif:</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 capitalize">
                            {client.goal.replace("_", " ")}
                          </span>
                        </div>
                      )}

                      {client.current_weight && client.goal_weight && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-600">
                            <Scale className="mr-3 h-3 w-3 text-gray-400" />
                            <span>Poids:</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">
                            {client.current_weight} → {client.goal_weight} kg
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {client.current_weight && client.goal_weight && (
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">
                            Progrès
                          </span>
                          <span className="text-sm font-bold text-emerald-600 tabular-nums">
                            {client.progress_percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 shadow-inner">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full transition-all duration-700 shadow-sm"
                            style={{
                              width: `${Math.min(
                                client.progress_percentage,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center text-xs text-gray-500 font-medium">
                        <Calendar className="mr-1 h-3 w-3 opacity-60" />
                        Inscrit le{" "}
                        {new Date(client.join_date).toLocaleDateString("fr-FR")}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 group-hover:bg-emerald-50/80 transition-all duration-200 font-medium"
                      >
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="flex items-center"
                        >
                          Voir
                          <ChevronRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
