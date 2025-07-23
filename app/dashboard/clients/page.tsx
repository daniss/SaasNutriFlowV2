"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSkeleton, GridSkeleton } from "@/components/shared/skeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuthNew";
import { useSubscription } from "@/hooks/useSubscription";
import { UsageCounter } from "@/components/dashboard/UsageCounter";
import { generateTemporaryPassword, hashPassword, formatClientAccountEmail } from "@/lib/client-account-utils";
import { supabase, type Client } from "@/lib/supabase";
import {
  Activity,
  Calendar,
  ChevronRight,
  Filter,
  Mail,
  Phone,
  Plus,
  Scale,
  Target,
  TrendingUp,
  Users,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ClientsPage() {
  const { user } = useAuth();
  const { hasReachedLimit } = useSubscription();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailValidationLoading, setEmailValidationLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [createClientAccount, setCreateClientAccount] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formSteps] = useState({
    1: { title: "Informations personnelles", subtitle: "Commençons par les bases" },
    2: { title: "Objectifs nutritionnels", subtitle: "Définissons ensemble le parcours" },
    3: { title: "Configuration du compte", subtitle: "Options d'accès et de suivi" }
  });
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    current_weight: "",
    goal_weight: "",
    goal: "",
    tags: [] as string[], // Dietary restrictions and preferences
  });
  
  const [customTag, setCustomTag] = useState("");

  // Form validation states for new client
  const [clientValidation, setClientValidation] = useState({
    name: { isValid: true, message: "" },
    email: { isValid: true, message: "" },
    phone: { isValid: true, message: "" },
    current_weight: { isValid: true, message: "" },
    goal_weight: { isValid: true, message: "" },
  });

  const canProceedToStep2 = () => {
    return newClient.name && 
           newClient.email && 
           clientValidation.name.isValid && 
           clientValidation.email.isValid && 
           clientValidation.phone.isValid && 
           !emailValidationLoading;
  };

  const canProceedToStep3 = () => {
    return canProceedToStep2() && 
           clientValidation.current_weight.isValid && 
           clientValidation.goal_weight.isValid;
  };

  const resetForm = () => {
    setCurrentStep(1);
    setNewClient({
      name: "",
      email: "",
      phone: "",
      current_weight: "",
      goal_weight: "",
      goal: "",
      tags: [],
    });
    setClientValidation({
      name: { isValid: true, message: "" },
      email: { isValid: true, message: "" },
      phone: { isValid: true, message: "" },
      current_weight: { isValid: true, message: "" },
      goal_weight: { isValid: true, message: "" },
    });
    setCreateClientAccount(false);
  };

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
      if (totalWeightToLose === 0) return 100; // Handle edge case where goal equals initial
      const weightLost = Math.max(0, initialWeight - currentWeight); // Ensure non-negative
      return Math.min(100, Math.round((weightLost / totalWeightToLose) * 100));
    }
    // If goal is weight gain (goal > initial)
    else if (goalWeight > initialWeight) {
      const totalWeightToGain = goalWeight - initialWeight;
      if (totalWeightToGain === 0) return 100; // Handle edge case where goal equals initial
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
      // RLS policies will automatically filter clients for the authenticated user
      const { data, error } = await supabase
        .from("clients")
        .select("*")
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

  const handleDeleteClient = async (client: Client) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${client.name}?\n\nCette action va :\n• Supprimer définitivement le client\n• Supprimer son compte d'accès au portail\n• Supprimer toutes ses données (historique de poids, messages, etc.)\n\nCette action est irréversible.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);

      // 1. Delete client account first (removes portal access)
      const { error: accountError } = await supabase
        .from("client_accounts")
        .delete()
        .eq("client_id", client.id);

      if (accountError && accountError.code !== "PGRST116") {
        console.error("Error deleting client account:", accountError);
        // Continue with deletion even if account deletion fails
      }

      // 2. Delete related data (weight history, messages, etc.)
      // Delete weight history
      const { error: weightError } = await supabase
        .from("weight_history")
        .delete()
        .eq("client_id", client.id);

      if (weightError && weightError.code !== "PGRST116") {
        console.error("Error deleting weight history:", weightError);
      }

      // Delete messages
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("client_id", client.id);

      if (messagesError && messagesError.code !== "PGRST116") {
        console.error("Error deleting messages:", messagesError);
      }

      // Delete documents
      const { error: documentsError } = await supabase
        .from("documents")
        .delete()
        .eq("client_id", client.id);

      if (documentsError && documentsError.code !== "PGRST116") {
        console.error("Error deleting documents:", documentsError);
      }

      // Delete progress photos
      const { error: photosError } = await supabase
        .from("progress_photos")
        .delete()
        .eq("client_id", client.id);

      if (photosError && photosError.code !== "PGRST116") {
        console.error("Error deleting progress photos:", photosError);
      }

      // 3. Finally delete the client record
      const { error: clientError } = await supabase
        .from("clients")
        .delete()
        .eq("id", client.id)
        .eq("dietitian_id", user!.id); // Extra security check

      if (clientError) {
        throw clientError;
      }

      // 4. Update local state
      setClients(prevClients => prevClients.filter(c => c.id !== client.id));
      
      // Show success message
      alert(`${client.name} a été supprimé avec succès, ainsi que toutes ses données associées.`);

    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Erreur lors de la suppression du client. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!user) return;

    // Check if client limit has been reached
    try {
      const limitReached = await hasReachedLimit('clients')
      if (limitReached) {
        toast({
          title: "Limite atteinte",
          description: "Vous avez atteint la limite de clients pour votre abonnement. Passez à un plan supérieur pour ajouter plus de clients.",
          variant: "destructive"
        })
        return
      }
    } catch (error) {
      console.error("Error checking client limit:", error)
    }

    // Validate all fields (email validation is async)
    const validations = {
      name: validateClientName(newClient.name),
      email: await validateClientEmail(newClient.email),
      phone: validateClientPhone(newClient.phone),
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
      // First, get the dietitian ID from the dietitians table
      const { data: dietitian, error: dietitianError } = await supabase
        .from("dietitians")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (dietitianError || !dietitian) {
        throw new Error("Dietitian profile not found");
      }

      const clientData = {
        dietitian_id: dietitian.id,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone || null,
        address: null,
        age: null,
        height: null,
        current_weight: newClient.current_weight
          ? Number.parseFloat(newClient.current_weight)
          : null,
        goal_weight: newClient.goal_weight
          ? Number.parseFloat(newClient.goal_weight)
          : null,
        goal: newClient.goal || "health_improvement",
        plan_type: null,
        status: "active",
        tags: newClient.tags,
        notes: null,
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

        } catch (weightError) {
          console.error(
            "⚠️ Error creating initial weight measurement:",
            weightError
          );
          // Don't fail the client creation if weight history fails
        }
      }

      // Create client account if checkbox is checked
      if (createClientAccount) {
        try {
          const tempPassword = generateTemporaryPassword(newClient.name);
          const hashedPassword = await hashPassword(tempPassword);
          const accountEmail = formatClientAccountEmail(newClient.email, newClient.name);

          console.log("🔧 Creating client account:", {
            tempPassword,
            hashedPassword,
            accountEmail,
            clientEmail: newClient.email,
            clientName: newClient.name
          });

          const { error: accountError } = await supabase
            .from("client_accounts")
            .insert({
              client_id: data.id,
              email: accountEmail,
              password_hash: hashedPassword,
              is_active: true,
            });

          if (accountError) {
            console.error("⚠️ Error creating client account:", accountError);
            // Don't fail the client creation if account creation fails
          } else {
            
            // Send password email with the account credentials we just created
            try {
              const response = await fetch("/api/notifications/send-password", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  clientId: data.id,
                  useExistingPassword: true, // Tell the API to not generate a new password
                }),
              })
              
              if (!response.ok) {
                console.error("Failed to send password notification")
              } else {
              }
            } catch (notifError) {
              console.error("Error sending password notification:", notifError)
            }
          }
        } catch (accountError) {
          console.error("⚠️ Unexpected error creating client account:", accountError);
          // Don't fail the client creation if account creation fails
        }
      } else {
        // Even without an account, send a simple welcome email
        try {
          const response = await fetch("/api/notifications/welcome", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              clientEmail: newClient.email,
              clientName: newClient.name,
              dietitianName: user.email?.split('@')[0] || "Votre nutritionniste",
              accountEmail: null,
              tempPassword: null,
            }),
          })
          
          if (!response.ok) {
            console.error("Failed to send welcome notification")
          }
        } catch (notifError) {
          console.error("Error sending welcome notification:", notifError)
        }
      }

      setClients([data, ...clients]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("❌ Unexpected error adding client:", error);
    }
  };

  const filteredClients = clients.filter(
    (client) => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === "all" || client.status.toLowerCase() === filterStatus.toLowerCase()

      return matchesSearch && matchesStatus
    }
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

    // Simple phone validation - just check if it contains digits
    const phoneRegex = /^[\d\s\+\-\(\)\.]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 8) {
      return {
        isValid: false,
        message: "Veuillez entrer un numéro de téléphone valide",
      };
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
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <UsageCounter type="clients" />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5">
                  <Plus className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Nouveau client</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] sm:max-h-[80vh] overflow-y-auto shadow-soft-lg border-0">
              <DialogHeader className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                  <div className="space-y-1">
                    <DialogTitle className="text-xl font-semibold text-gray-900">
                      {formSteps[currentStep as keyof typeof formSteps].title}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 leading-relaxed">
                      {formSteps[currentStep as keyof typeof formSteps].subtitle}
                    </DialogDescription>
                  </div>
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
                    {currentStep}/3
                  </div>
                </div>
                
                {/* Progress indicator */}
                <div className="flex items-center space-x-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`h-3 w-8 sm:h-2 sm:w-8 rounded-full transition-colors duration-200 ${
                        step <= currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                      }`} />
                      {step < 3 && <div className="w-2" />}
                    </div>
                  ))}
                </div>
              </DialogHeader>
              <div className="py-6">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-slide-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <div className="text-sm text-blue-600 flex items-center gap-1">
                            <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full"></div>
                            Vérification de l'email...
                          </div>
                        )}
                      </div>
                    </div>
                    
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
                  </div>
                )}

                {/* Step 2: Nutritional Goals */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-slide-in">
                    <div className="text-center mb-6">
                      <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <Target className="h-8 w-8 text-emerald-600" />
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Maintenant, définissons ensemble les objectifs nutritionnels pour créer un parcours personnalisé.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    {/* Dietary Restrictions Tags */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Restrictions alimentaires et préférences
                      </Label>
                      <p className="text-xs text-gray-500 mb-3">
                        Sélectionnez les allergies, intolérances ou restrictions alimentaires du client
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Sans gluten", "Sans lactose", "Végétarien", "Végétalien", "Sans noix",
                          "Sans fruits de mer", "Diabétique", "Faible en sodium", "Sans œufs",
                          "Halal", "Casher", "Sans porc", "Sans alcool", "Paléo", "Cétogène"
                        ].map((tag) => {
                          const isSelected = newClient.tags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                const updatedTags = isSelected
                                  ? newClient.tags.filter(t => t !== tag)
                                  : [...newClient.tags, tag];
                                setNewClient({ ...newClient, tags: updatedTags });
                              }}
                              className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                                isSelected
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                      {newClient.tags.length > 0 && (
                        <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <p className="text-xs text-emerald-700 mb-2">Tags sélectionnés:</p>
                          <div className="flex flex-wrap gap-1">
                            {newClient.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedTags = newClient.tags.filter(t => t !== tag);
                                    setNewClient({ ...newClient, tags: updatedTags });
                                  }}
                                  className="ml-1 hover:text-emerald-900"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Custom Tag Input */}
                      <div className="mt-4 space-y-2">
                        <Label className="text-xs font-medium text-gray-600">
                          Ajouter une restriction personnalisée
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Ex: Faible en FODMAP, Sans viande rouge..."
                            value={customTag}
                            onChange={(e) => setCustomTag(e.target.value)}
                            className="flex-1 text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (customTag.trim() && !newClient.tags.includes(customTag.trim())) {
                                  setNewClient({ 
                                    ...newClient, 
                                    tags: [...newClient.tags, customTag.trim()] 
                                  });
                                  setCustomTag("");
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (customTag.trim() && !newClient.tags.includes(customTag.trim())) {
                                setNewClient({ 
                                  ...newClient, 
                                  tags: [...newClient.tags, customTag.trim()] 
                                });
                                setCustomTag("");
                              }
                            }}
                            className="px-3 py-1 text-xs"
                          >
                            Ajouter
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Account Configuration */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-slide-in">
                    <div className="text-center mb-6">
                      <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-emerald-600" />
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Dernière étape : configurons l'accès et les options de suivi pour votre client.
                      </p>
                    </div>

                    {/* Client Account Creation Section */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="create-account"
                          checked={createClientAccount}
                          onCheckedChange={(checked) => setCreateClientAccount(checked as boolean)}
                          className="mt-1"
                        />
                        <div className="grid gap-2">
                          <Label
                            htmlFor="create-account"
                            className="text-sm font-semibold text-gray-700 cursor-pointer"
                          >
                            Créer un compte client
                          </Label>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Permettre au client d'accéder à son portail personnel pour consulter 
                            ses plans alimentaires, suivre ses progrès et communiquer avec vous.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Summary Section */}
                    <div className="space-y-4 p-4 bg-emerald-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-emerald-800 mb-3">Récapitulatif du profil</h4>
                      <div className="grid gap-3 text-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600">Nom :</span>
                          <span className="font-medium text-gray-900">{newClient.name}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600">Email :</span>
                          <span className="font-medium text-gray-900 break-all">{newClient.email}</span>
                        </div>
                        {newClient.phone && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="text-gray-600">Téléphone :</span>
                            <span className="font-medium text-gray-900">{newClient.phone}</span>
                          </div>
                        )}
                        {newClient.current_weight && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="text-gray-600">Poids actuel :</span>
                            <span className="font-medium text-gray-900">{newClient.current_weight} kg</span>
                          </div>
                        )}
                        {newClient.goal_weight && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="text-gray-600">Poids objectif :</span>
                            <span className="font-medium text-gray-900">{newClient.goal_weight} kg</span>
                          </div>
                        )}
                        {newClient.goal && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="text-gray-600">Objectif :</span>
                            <span className="font-medium text-gray-900">
                              {newClient.goal === 'weight_loss' && 'Perte de poids'}
                              {newClient.goal === 'weight_gain' && 'Prise de poids'}
                              {newClient.goal === 'muscle_gain' && 'Prise de masse musculaire'}
                              {newClient.goal === 'maintenance' && 'Maintien'}
                              {newClient.goal === 'health_improvement' && 'Amélioration de la santé'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === 1) {
                      setIsAddDialogOpen(false);
                      resetForm();
                    } else {
                      setCurrentStep(currentStep - 1);
                    }
                  }}
                  className="border-gray-200 hover:bg-gray-50"
                >
                  {currentStep === 1 ? 'Annuler' : 'Précédent'}
                </Button>
                
                {currentStep < 3 ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={
                      (currentStep === 1 && !canProceedToStep2()) ||
                      (currentStep === 2 && !canProceedToStep3())
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft disabled:opacity-50 font-medium"
                  >
                    Continuer
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleAddClient}
                    disabled={
                      !newClient.name ||
                      !newClient.email ||
                      !clientValidation.name.isValid ||
                      !clientValidation.email.isValid ||
                      !clientValidation.phone.isValid ||
                      !clientValidation.current_weight.isValid ||
                      !clientValidation.goal_weight.isValid ||
                      emailValidationLoading
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft disabled:opacity-50 font-medium"
                  >
                    Commencer l'accompagnement
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
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
                    {clients.filter((c) => c.status.toLowerCase() === "active").length}
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

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
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
                            <Mail className="mr-1 h-3 w-3 opacity-60 flex-shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            client.status === "active" ? "default" : "secondary"
                          }
                          className={`${
                            client.status === "active"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-600"
                          } border-0 font-medium px-3 py-1 flex-shrink-0`}
                        >
                          {client.status === "active" ? "Actif" : "Inactif"}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-lg">
                            <DropdownMenuItem asChild className="rounded-md">
                              <Link href={`/dashboard/clients/${client.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir le profil
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 hover:bg-red-50 rounded-md"
                              onClick={() => handleDeleteClient(client)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                          <span className="text-sm font-semibold text-gray-900">
                            {client.goal === 'weight_loss' && 'Perte de poids'}
                            {client.goal === 'weight_gain' && 'Prise de poids'}
                            {client.goal === 'muscle_gain' && 'Prise de masse musculaire'}
                            {client.goal === 'maintenance' && 'Maintien'}
                            {client.goal === 'health_improvement' && 'Amélioration de la santé'}
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
