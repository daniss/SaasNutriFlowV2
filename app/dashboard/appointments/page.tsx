"use client";

import { WeekView } from "@/components/appointments/WeekView";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  DashboardSkeleton,
  EmptyStateWithSkeleton,
} from "@/components/shared/skeletons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfessionalCalendar } from "@/components/ui/professional-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthNew";
import { api, type AppointmentWithClient } from "@/lib/api";
import { formatTime } from "@/lib/formatters";
import { getStatusDisplay, getStatusVariant } from "@/lib/status";
import { type Client } from "@/lib/supabase";
import {
  AlertCircle,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Edit3,
  MapPin,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Types
type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";
type AppointmentType =
  | "consultation"
  | "follow_up"
  | "nutrition_planning"
  | "assessment";

interface AppointmentFormData {
  title: string;
  description: string;
  client_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  type: AppointmentType | "";
  location: string;
  is_virtual: boolean;
  meeting_link: string;
  notes: string;
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialView =
    (searchParams.get("view") as "today" | "week" | "month" | "list") ||
    "today";

  // State management
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [clients, setClients] = useState<Pick<Client, "id" | "name">[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"today" | "week" | "month" | "list">(
    initialView
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentWithClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Utility function to get local date string (YYYY-MM-DD) without timezone conversion
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Form state
  const [newAppointment, setNewAppointment] = useState<AppointmentFormData>({
    title: "",
    description: "",
    client_id: "",
    appointment_date: getLocalDateString(new Date()),
    appointment_time: "09:00",
    duration_minutes: 60,
    type: "",
    location: "",
    is_virtual: false,
    meeting_link: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setError(null);
      setLoading(true);

      // Fetch both appointments and clients
      const [appointmentsData, clientsData] = await Promise.all([
        api.getAppointments(user.id),
        api.getActiveClients(user.id),
      ]);

      setAppointments(appointmentsData);
      setClients(clientsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Impossible de charger les rendez-vous. Veuillez réessayer.");
      toast({
        title: "Erreur",
        description: "Impossible de charger les rendez-vous",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = async () => {
    if (!user || !newAppointment.title || !newAppointment.client_id) return;

    try {
      setActionLoading("add");

      // Create appointment data
      const appointmentData = {
        dietitian_id: user.id,
        client_id: newAppointment.client_id,
        title: newAppointment.title,
        description: newAppointment.description || null,
        appointment_date: newAppointment.appointment_date,
        appointment_time: newAppointment.appointment_time,
        duration_minutes: newAppointment.duration_minutes,
        type: newAppointment.type as AppointmentType,
        status: "scheduled" as AppointmentStatus,
        location: newAppointment.is_virtual ? null : newAppointment.location,
        is_virtual: newAppointment.is_virtual,
        meeting_link: newAppointment.is_virtual
          ? newAppointment.meeting_link
          : null,
        notes: newAppointment.notes || null,
      };

      const createdAppointment = await api.createAppointment(appointmentData);

      setAppointments([createdAppointment, ...appointments]);
      setIsAddDialogOpen(false);
      resetForm();

      toast({
        title: "Succès",
        description: "Rendez-vous créé avec succès",
      });
    } catch (error) {
      console.error("Error adding appointment:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le rendez-vous",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditAppointment = async () => {
    if (
      !user ||
      !editingAppointment ||
      !newAppointment.title ||
      !newAppointment.client_id
    )
      return;

    try {
      setActionLoading("edit");

      // Update appointment data
      const appointmentData = {
        title: newAppointment.title,
        description: newAppointment.description || null,
        client_id: newAppointment.client_id,
        appointment_date: newAppointment.appointment_date,
        appointment_time: newAppointment.appointment_time,
        duration_minutes: newAppointment.duration_minutes,
        type: newAppointment.type as AppointmentType,
        location: newAppointment.is_virtual ? null : newAppointment.location,
        is_virtual: newAppointment.is_virtual,
        meeting_link: newAppointment.is_virtual
          ? newAppointment.meeting_link
          : null,
        notes: newAppointment.notes || null,
      };

      const updatedAppointment = await api.updateAppointment(
        editingAppointment.id,
        appointmentData
      );

      setAppointments(
        appointments.map((apt) =>
          apt.id === editingAppointment.id ? updatedAppointment : apt
        )
      );
      setIsEditDialogOpen(false);
      setEditingAppointment(null);
      resetForm();

      toast({
        title: "Succès",
        description: "Rendez-vous modifié avec succès",
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rendez-vous",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!user) return;

    try {
      setActionLoading(appointmentId);

      await api.deleteAppointment(appointmentId);

      setAppointments(appointments.filter((apt) => apt.id !== appointmentId));

      toast({
        title: "Succès",
        description: "Rendez-vous supprimé avec succès",
      });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rendez-vous",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: AppointmentStatus
  ) => {
    if (!user) return;

    try {
      setActionLoading(appointmentId);

      const updatedAppointment = await api.updateAppointment(appointmentId, {
        status: newStatus,
      });

      setAppointments(
        appointments.map((apt) =>
          apt.id === appointmentId ? updatedAppointment : apt
        )
      );

      toast({
        title: "Succès",
        description: "Statut du rendez-vous mis à jour",
      });
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const sendAppointmentReminder = async (
    appointment: AppointmentWithClient
  ) => {
    if (!appointment.clients?.email) {
      toast({
        title: "Erreur",
        description: "Email du client introuvable",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(`reminder-${appointment.id}`);

      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "appointment_reminder",
          recipient: {
            email: appointment.clients.email,
            name: appointment.clients.name,
          },
          data: {
            appointmentDate: appointment.appointment_date,
            appointmentTime: appointment.appointment_time,
            dietitianName: user?.email || "Votre diététicien",
            title: appointment.title,
            location: appointment.is_virtual
              ? appointment.meeting_link
              : appointment.location,
            isVirtual: appointment.is_virtual,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'envoi du rappel");
      }

      toast({
        title: "Rappel envoyé",
        description: `Rappel de rendez-vous envoyé à ${appointment.clients.name}`,
      });
    } catch (error) {
      console.error("❌ Send reminder error:", error);
      toast({
        title: "Erreur d'envoi",
        description:
          error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openEditDialog = (appointment: AppointmentWithClient) => {
    setEditingAppointment(appointment);
    setNewAppointment({
      title: appointment.title,
      description: appointment.description || "",
      client_id: appointment.client_id,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      duration_minutes: appointment.duration_minutes,
      type: appointment.type as AppointmentType,
      location: appointment.location || "",
      is_virtual: appointment.is_virtual,
      meeting_link: appointment.meeting_link || "",
      notes: appointment.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setNewAppointment({
      title: "",
      description: "",
      client_id: "",
      appointment_date: getLocalDateString(new Date()),
      appointment_time: "09:00",
      duration_minutes: 60,
      type: "",
      location: "",
      is_virtual: false,
      meeting_link: "",
      notes: "",
    });
  };

  const getAppointmentsByDate = (date: Date) => {
    const dateStr = getLocalDateString(date);
    return appointments.filter((apt) => apt.appointment_date === dateStr);
  };

  const todayAppointments = getAppointmentsByDate(new Date());
  const selectedDateAppointments = getAppointmentsByDate(selectedDate);

  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.clients?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          title="Rendez-vous"
          subtitle="Gérez vos rendez-vous clients"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Helper functions for calendar views
  const getAppointmentsForWeek = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return appointments.filter((apt) => {
      const appointmentDate = new Date(apt.appointment_date + "T00:00:00"); // Ensure local timezone
      return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
    });
  };

  const getTodayStats = () => {
    const today = getLocalDateString(new Date());
    const todayAppointments = appointments.filter(
      (apt) => apt.appointment_date === today
    );
    const thisWeekAppointments = getAppointmentsForWeek(new Date());
    const thisMonthAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date + "T00:00:00"); // Ensure local timezone
      const now = new Date();
      return (
        aptDate.getMonth() === now.getMonth() &&
        aptDate.getFullYear() === now.getFullYear()
      );
    });

    return {
      today: todayAppointments.length,
      week: thisWeekAppointments.length,
      month: thisMonthAppointments.length,
      completed: appointments.filter((apt) => apt.status === "completed")
        .length,
    };
  };

  const stats = getTodayStats();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Rendez-vous & Calendrier"
        subtitle="Gérez vos rendez-vous avec vue calendrier intégrée"
        searchPlaceholder="Rechercher des rendez-vous..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium text-xs sm:text-sm px-3 sm:px-4">
                <Plus className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Nouveau rendez-vous</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] shadow-soft-lg border-0 max-h-[90vh] overflow-y-auto">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Nouveau rendez-vous
                </DialogTitle>
                <DialogDescription className="text-gray-600 leading-relaxed">
                  Planifiez un nouveau rendez-vous avec votre client.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="appointment-title">Titre *</Label>
                  <Input
                    id="appointment-title"
                    value={newAppointment.title}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        title: e.target.value,
                      })
                    }
                    placeholder="ex: Consultation initiale"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={newAppointment.client_id}
                    onValueChange={(value) =>
                      setNewAppointment({ ...newAppointment, client_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointment-date">Date *</Label>
                    <Input
                      id="appointment-date"
                      type="date"
                      value={newAppointment.appointment_date}
                      onChange={(e) =>
                        setNewAppointment({
                          ...newAppointment,
                          appointment_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointment-time">Heure *</Label>
                    <Input
                      id="appointment-time"
                      type="time"
                      value={newAppointment.appointment_time}
                      onChange={(e) =>
                        setNewAppointment({
                          ...newAppointment,
                          appointment_time: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newAppointment.type}
                      onValueChange={(value) =>
                        setNewAppointment({
                          ...newAppointment,
                          type: value as AppointmentType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type de rendez-vous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">
                          Consultation
                        </SelectItem>
                        <SelectItem value="follow_up">Suivi</SelectItem>
                        <SelectItem value="nutrition_planning">
                          Planification nutritionnelle
                        </SelectItem>
                        <SelectItem value="assessment">Évaluation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée (min)</Label>
                    <Select
                      value={newAppointment.duration_minutes.toString()}
                      onValueChange={(value) =>
                        setNewAppointment({
                          ...newAppointment,
                          duration_minutes: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Durée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 heure</SelectItem>
                        <SelectItem value="90">1h30</SelectItem>
                        <SelectItem value="120">2 heures</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is-virtual"
                      checked={newAppointment.is_virtual}
                      onChange={(e) =>
                        setNewAppointment({
                          ...newAppointment,
                          is_virtual: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <Label htmlFor="is-virtual">Rendez-vous virtuel</Label>
                  </div>
                  {newAppointment.is_virtual ? (
                    <div className="space-y-2">
                      <Label htmlFor="meeting-link">
                        Lien de visioconférence
                      </Label>
                      <Input
                        id="meeting-link"
                        value={newAppointment.meeting_link}
                        onChange={(e) =>
                          setNewAppointment({
                            ...newAppointment,
                            meeting_link: e.target.value,
                          })
                        }
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="location">Lieu</Label>
                      <Input
                        id="location"
                        value={newAppointment.location}
                        onChange={(e) =>
                          setNewAppointment({
                            ...newAppointment,
                            location: e.target.value,
                          })
                        }
                        placeholder="Cabinet, adresse..."
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAppointment.description}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        description: e.target.value,
                      })
                    }
                    placeholder="Description du rendez-vous..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAddAppointment}
                  disabled={
                    !newAppointment.title ||
                    !newAppointment.client_id ||
                    actionLoading === "add"
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft disabled:opacity-50 font-medium"
                >
                  {actionLoading === "add"
                    ? "Création..."
                    : "Créer le rendez-vous"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] shadow-soft-lg border-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Modifier le rendez-vous
            </DialogTitle>
            <DialogDescription className="text-gray-600 leading-relaxed">
              Modifiez les détails de votre rendez-vous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="edit-appointment-title">Titre *</Label>
              <Input
                id="edit-appointment-title"
                value={newAppointment.title}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    title: e.target.value,
                  })
                }
                placeholder="ex: Consultation initiale"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client">Client *</Label>
              <Select
                value={newAppointment.client_id}
                onValueChange={(value) =>
                  setNewAppointment({ ...newAppointment, client_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-appointment-date">Date *</Label>
                <Input
                  id="edit-appointment-date"
                  type="date"
                  value={newAppointment.appointment_date}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      appointment_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-appointment-time">Heure *</Label>
                <Input
                  id="edit-appointment-time"
                  type="time"
                  value={newAppointment.appointment_time}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      appointment_time: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={newAppointment.type}
                  onValueChange={(value) =>
                    setNewAppointment({
                      ...newAppointment,
                      type: value as AppointmentType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de rendez-vous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="follow_up">Suivi</SelectItem>
                    <SelectItem value="nutrition_planning">
                      Planification nutritionnelle
                    </SelectItem>
                    <SelectItem value="assessment">Évaluation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Durée (min)</Label>
                <Select
                  value={newAppointment.duration_minutes.toString()}
                  onValueChange={(value) =>
                    setNewAppointment({
                      ...newAppointment,
                      duration_minutes: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="90">1h30</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-virtual"
                  checked={newAppointment.is_virtual}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      is_virtual: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="edit-is-virtual">Rendez-vous virtuel</Label>
              </div>
              {newAppointment.is_virtual ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-meeting-link">
                    Lien de visioconférence
                  </Label>
                  <Input
                    id="edit-meeting-link"
                    value={newAppointment.meeting_link}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        meeting_link: e.target.value,
                      })
                    }
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Lieu</Label>
                  <Input
                    id="edit-location"
                    value={newAppointment.location}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        location: e.target.value,
                      })
                    }
                    placeholder="Cabinet, adresse..."
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={newAppointment.description}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    description: e.target.value,
                  })
                }
                placeholder="Description du rendez-vous..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingAppointment(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditAppointment}
              disabled={
                !newAppointment.title ||
                !newAppointment.client_id ||
                actionLoading === "edit"
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft disabled:opacity-50 font-medium"
            >
              {actionLoading === "edit"
                ? "Modification..."
                : "Modifier le rendez-vous"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unified Calendar & Appointments Interface */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-4 lg:space-y-6">
          <Tabs
            value={viewMode}
            onValueChange={(value: any) => setViewMode(value)}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
              <TabsList className="grid w-full grid-cols-4 sm:w-auto bg-muted p-1 rounded-lg h-auto gap-1">
                <TabsTrigger value="today" className="text-xs sm:text-sm data-[state=active]:bg-background">
                  <span className="hidden sm:inline">Aujourd'hui</span>
                  <span className="sm:hidden">Jour</span>
                </TabsTrigger>
                <TabsTrigger value="week" className="text-xs sm:text-sm data-[state=active]:bg-background">
                  <span className="hidden sm:inline">Semaine</span>
                  <span className="sm:hidden">Sem</span>
                </TabsTrigger>
                <TabsTrigger value="month" className="text-xs sm:text-sm data-[state=active]:bg-background">
                  <span className="hidden sm:inline">Mois</span>
                  <span className="sm:hidden">Mois</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="text-xs sm:text-sm data-[state=active]:bg-background">
                  <span className="hidden sm:inline">Liste</span>
                  <span className="sm:hidden">Liste</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={fetchData} className="text-xs sm:text-sm px-3 sm:px-4">
                  <RefreshCw className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">Actualiser</span>
                  <span className="sm:hidden">Sync</span>
                </Button>
              </div>
            </div>

            {/* Today View */}
            <TabsContent value="today" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Rendez-vous d'aujourd'hui
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayAppointments.length === 0 ? (
                    <EmptyStateWithSkeleton
                      icon={CalendarIcon}
                      title="Aucun rendez-vous aujourd'hui"
                      description="Vous n'avez pas de rendez-vous programmés pour aujourd'hui."
                    />
                  ) : (
                    <div className="space-y-4">
                      {todayAppointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onEdit={openEditDialog}
                          onDelete={handleDeleteAppointment}
                          onUpdateStatus={handleUpdateStatus}
                          onSendReminder={sendAppointmentReminder}
                          isLoading={actionLoading === appointment.id}
                          isReminderLoading={
                            actionLoading === `reminder-${appointment.id}`
                          }
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Week View */}
            <TabsContent value="week" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vue hebdomadaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <WeekView
                    appointments={appointments}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    onAppointmentClick={openEditDialog}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Month View */}
            <TabsContent value="month" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <ProfessionalCalendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date instanceof Date) {
                        setSelectedDate(date);
                      }
                    }}
                    className="rounded-md border"
                    events={appointments.map((appointment) => ({
                      date: new Date(
                        appointment.appointment_date + "T00:00:00"
                      ), // Ensure local timezone
                      title: appointment.title,
                      type: appointment.type,
                    }))}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* List View */}
            <TabsContent value="list" className="mt-6">
              {filteredAppointments.length === 0 ? (
                <EmptyStateWithSkeleton
                  icon={CalendarIcon}
                  title={
                    searchTerm
                      ? "Aucun rendez-vous trouvé"
                      : "Aucun rendez-vous"
                  }
                  description={
                    searchTerm
                      ? "Essayez d'ajuster vos termes de recherche."
                      : "Créez votre premier rendez-vous pour commencer."
                  }
                  action={
                    !searchTerm ? (
                      <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Créer votre premier rendez-vous
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteAppointment}
                      onUpdateStatus={handleUpdateStatus}
                      onSendReminder={sendAppointmentReminder}
                      isLoading={actionLoading === appointment.id}
                      isReminderLoading={
                        actionLoading === `reminder-${appointment.id}`
                      }
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Context Sidebar */}
        <div className="space-y-4 lg:space-y-6">
          {/* Selected Date Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedDateAppointments.length === 0 ? (
                  <p className="text-sm text-gray-600">Aucun événement</p>
                ) : (
                  selectedDateAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => openEditDialog(appointment)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-sm font-medium">
                          {appointment.title}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {formatTime(appointment.appointment_time)} (
                        {appointment.duration_minutes}min)
                      </p>
                      {appointment.clients?.name && (
                        <p className="text-xs text-blue-600 mt-1">
                          {appointment.clients.name}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Aujourd'hui</span>
                  <span className="text-sm font-semibold">
                    {stats.today} RDV
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cette semaine</span>
                  <span className="text-sm font-semibold">
                    {stats.week} RDV
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ce mois</span>
                  <span className="text-sm font-semibold">
                    {stats.month} RDV
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Terminés</span>
                  <span className="text-sm font-semibold">
                    {stats.completed}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs sm:text-sm px-3"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Nouveau rendez-vous</span>
                <span className="sm:hidden">Nouveau RDV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setViewMode("today")}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Vue d'aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedDate(new Date());
                  setViewMode("month");
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Aller à aujourd'hui
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] shadow-soft-lg border-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Modifier le rendez-vous
            </DialogTitle>
            <DialogDescription className="text-gray-600 leading-relaxed">
              Modifiez les détails de ce rendez-vous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre *</Label>
              <Input
                id="edit-title"
                value={newAppointment.title}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    title: e.target.value,
                  })
                }
                placeholder="ex: Consultation initiale"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client">Client *</Label>
              <Select
                value={newAppointment.client_id}
                onValueChange={(value) =>
                  setNewAppointment({ ...newAppointment, client_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-appointment-date">Date *</Label>
                <Input
                  id="edit-appointment-date"
                  type="date"
                  value={newAppointment.appointment_date}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      appointment_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-appointment-time">Heure *</Label>
                <Input
                  id="edit-appointment-time"
                  type="time"
                  value={newAppointment.appointment_time}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      appointment_time: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={newAppointment.type}
                  onValueChange={(value) =>
                    setNewAppointment({
                      ...newAppointment,
                      type: value as AppointmentType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de rendez-vous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="follow_up">Suivi</SelectItem>
                    <SelectItem value="nutrition_planning">
                      Planification nutritionnelle
                    </SelectItem>
                    <SelectItem value="assessment">Évaluation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Durée (min)</Label>
                <Select
                  value={newAppointment.duration_minutes.toString()}
                  onValueChange={(value) =>
                    setNewAppointment({
                      ...newAppointment,
                      duration_minutes: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={newAppointment.description}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    description: e.target.value,
                  })
                }
                placeholder="Description du rendez-vous..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is-virtual"
                checked={newAppointment.is_virtual}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    is_virtual: e.target.checked,
                  })
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-is-virtual">Rendez-vous virtuel</Label>
            </div>
            {!newAppointment.is_virtual ? (
              <div className="space-y-2">
                <Label htmlFor="edit-location">Lieu</Label>
                <Input
                  id="edit-location"
                  value={newAppointment.location}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      location: e.target.value,
                    })
                  }
                  placeholder="Adresse ou lieu du rendez-vous..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="edit-meeting-link">
                  Lien de visioconférence
                </Label>
                <Input
                  id="edit-meeting-link"
                  value={newAppointment.meeting_link}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      meeting_link: e.target.value,
                    })
                  }
                  placeholder="https://meet.google.com/..."
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={newAppointment.notes}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    notes: e.target.value,
                  })
                }
                placeholder="Notes internes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={actionLoading === "edit"}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditAppointment}
              disabled={actionLoading === "edit"}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {actionLoading === "edit" ? "Modification..." : "Modifier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Appointment Card Component
function AppointmentCard({
  appointment,
  onEdit,
  onDelete,
  onUpdateStatus,
  onSendReminder,
  isLoading,
  isReminderLoading,
}: {
  appointment: AppointmentWithClient;
  onEdit: (appointment: AppointmentWithClient) => void;
  onDelete: (appointmentId: string) => void;
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onSendReminder: (appointment: AppointmentWithClient) => void;
  isLoading: boolean;
  isReminderLoading: boolean;
}) {
  const getTypeLabel = (type: string) => {
    const labels = {
      consultation: "Consultation",
      follow_up: "Suivi",
      nutrition_planning: "Planification",
      assessment: "Évaluation",
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm hover:shadow-soft-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 min-w-0 flex-1">
                {appointment.title}
              </h3>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <Badge variant="outline" className="text-xs">
                  {getTypeLabel(appointment.type)}
                </Badge>
                <Badge variant={getStatusVariant(appointment.status)} className="text-xs">
                  {getStatusDisplay(appointment.status)}
                </Badge>
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span>{appointment.clients?.name || "Client inconnu"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  {formatTime(appointment.appointment_time)} (
                  {appointment.duration_minutes}min)
                </span>
              </div>
              {appointment.is_virtual ? (
                <div className="flex items-center gap-2">
                  <Video className="h-3 w-3" />
                  <span>Visioconférence</span>
                </div>
              ) : (
                appointment.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{appointment.location}</span>
                  </div>
                )
              )}
            </div>
            {appointment.description && (
              <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                {appointment.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading} className="text-xs sm:text-sm px-2 sm:px-3">
                  <MoreHorizontal className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="hidden sm:inline">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(appointment)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSendReminder(appointment)}
                  disabled={
                    isReminderLoading || appointment.status === "cancelled"
                  }
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {isReminderLoading ? "Envoi..." : "Envoyer rappel"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(appointment.id, "completed")}
                  disabled={appointment.status === "completed"}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marquer comme terminé
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(appointment.id, "cancelled")}
                  disabled={appointment.status === "cancelled"}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Annuler
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(appointment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {appointment.is_virtual && appointment.meeting_link && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={appointment.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="h-4 w-4 mr-1" />
                  Rejoindre
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
