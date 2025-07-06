"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  MoreHorizontal,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Video,
  MapPin
} from "lucide-react"
import { useAuth } from "@/hooks/useAuthNew"
import { supabase, type Client, type Appointment } from "@/lib/supabase"
import { DashboardHeader } from "@/components/dashboard-header"
import { getStatusDisplay, getStatusVariant } from "@/lib/status"
import { formatDate, formatTime } from "@/lib/formatters"
import { DashboardSkeleton, ListSkeleton, EmptyStateWithSkeleton } from "@/components/shared/skeletons"
import { api, type AppointmentWithClient } from "@/lib/api"
import { handleApiError } from "@/lib/errors"

// Types
type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
type AppointmentType = 'consultation' | 'follow_up' | 'nutrition_planning' | 'assessment'

interface AppointmentFormData {
  title: string
  description: string
  client_id: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  type: AppointmentType | ""
  location: string
  is_virtual: boolean
  meeting_link: string
  notes: string
}

export default function AppointmentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State management
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([])
  const [clients, setClients] = useState<Pick<Client, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithClient | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [newAppointment, setNewAppointment] = useState<AppointmentFormData>({
    title: "",
    description: "",
    client_id: "",
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: "09:00",
    duration_minutes: 60,
    type: "",
    location: "",
    is_virtual: false,
    meeting_link: "",
    notes: "",
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      setError(null)
      setLoading(true)
      
      // Fetch both appointments and clients
      const [appointmentsData, clientsData] = await Promise.all([
        api.getAppointments(user.id),
        api.getActiveClients(user.id)
      ])
      
      setAppointments(appointmentsData)
      setClients(clientsData)
    } catch (error) {
      console.error("Error fetching appointments:", error)
      setError("Impossible de charger les rendez-vous. Veuillez réessayer.")
      toast({
        title: "Erreur",
        description: "Impossible de charger les rendez-vous",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddAppointment = async () => {
    if (!user || !newAppointment.title || !newAppointment.client_id) return

    try {
      setActionLoading("add")
      
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
        meeting_link: newAppointment.is_virtual ? newAppointment.meeting_link : null,
        notes: newAppointment.notes || null,
      }
      
      const createdAppointment = await api.createAppointment(appointmentData)
      
      setAppointments([createdAppointment, ...appointments])
      setIsAddDialogOpen(false)
      resetForm()
      
      toast({
        title: "Succès",
        description: "Rendez-vous créé avec succès",
      })
    } catch (error) {
      console.error("Error adding appointment:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le rendez-vous",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditAppointment = async () => {
    if (!user || !editingAppointment || !newAppointment.title || !newAppointment.client_id) return

    try {
      setActionLoading("edit")
      
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
        meeting_link: newAppointment.is_virtual ? newAppointment.meeting_link : null,
        notes: newAppointment.notes || null,
      }
      
      const updatedAppointment = await api.updateAppointment(editingAppointment.id, appointmentData)
      
      setAppointments(appointments.map(apt => 
        apt.id === editingAppointment.id ? updatedAppointment : apt
      ))
      setIsEditDialogOpen(false)
      setEditingAppointment(null)
      resetForm()
      
      toast({
        title: "Succès",
        description: "Rendez-vous modifié avec succès",
      })
    } catch (error) {
      console.error("Error updating appointment:", error)
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rendez-vous",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!user) return

    try {
      setActionLoading(appointmentId)
      
      await api.deleteAppointment(appointmentId)
      
      setAppointments(appointments.filter(apt => apt.id !== appointmentId))
      
      toast({
        title: "Succès",
        description: "Rendez-vous supprimé avec succès",
      })
    } catch (error) {
      console.error("Error deleting appointment:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rendez-vous",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    if (!user) return

    try {
      setActionLoading(appointmentId)
      
      const updatedAppointment = await api.updateAppointment(appointmentId, { status: newStatus })
      
      setAppointments(appointments.map(apt => 
        apt.id === appointmentId ? updatedAppointment : apt
      ))
      
      toast({
        title: "Succès",
        description: "Statut du rendez-vous mis à jour",
      })
    } catch (error) {
      console.error("Error updating appointment status:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openEditDialog = (appointment: AppointmentWithClient) => {
    setEditingAppointment(appointment)
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
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setNewAppointment({
      title: "",
      description: "",
      client_id: "",
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: "09:00",
      duration_minutes: 60,
      type: "",
      location: "",
      is_virtual: false,
      meeting_link: "",
      notes: "",
    })
  }

  const getAppointmentsByDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter(apt => apt.appointment_date === dateStr)
  }

  const todayAppointments = getAppointmentsByDate(new Date())
  const selectedDateAppointments = getAppointmentsByDate(selectedDate)

  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.clients?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Rendez-vous" subtitle="Gérez vos rendez-vous clients" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={fetchData} className="ml-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Rendez-vous"
        subtitle="Gérez vos rendez-vous clients"
        searchPlaceholder="Rechercher des rendez-vous..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau rendez-vous
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] shadow-soft-lg border-0 max-h-[90vh] overflow-y-auto">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold text-gray-900">Nouveau rendez-vous</DialogTitle>
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
                    onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                    placeholder="ex: Consultation initiale"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={newAppointment.client_id}
                    onValueChange={(value) => setNewAppointment({ ...newAppointment, client_id: value })}
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
                      onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointment-time">Heure *</Label>
                    <Input
                      id="appointment-time"
                      type="time"
                      value={newAppointment.appointment_time}
                      onChange={(e) => setNewAppointment({ ...newAppointment, appointment_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newAppointment.type}
                      onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value as AppointmentType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type de rendez-vous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="follow_up">Suivi</SelectItem>
                        <SelectItem value="nutrition_planning">Planification nutritionnelle</SelectItem>
                        <SelectItem value="assessment">Évaluation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée (min)</Label>
                    <Select
                      value={newAppointment.duration_minutes.toString()}
                      onValueChange={(value) => setNewAppointment({ ...newAppointment, duration_minutes: parseInt(value) })}
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
                      onChange={(e) => setNewAppointment({ ...newAppointment, is_virtual: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="is-virtual">Rendez-vous virtuel</Label>
                  </div>
                  {newAppointment.is_virtual ? (
                    <div className="space-y-2">
                      <Label htmlFor="meeting-link">Lien de visioconférence</Label>
                      <Input
                        id="meeting-link"
                        value={newAppointment.meeting_link}
                        onChange={(e) => setNewAppointment({ ...newAppointment, meeting_link: e.target.value })}
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="location">Lieu</Label>
                      <Input
                        id="location"
                        value={newAppointment.location}
                        onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
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
                    onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                    placeholder="Description du rendez-vous..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleAddAppointment}
                  disabled={!newAppointment.title || !newAppointment.client_id || actionLoading === "add"}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft disabled:opacity-50 font-medium"
                >
                  {actionLoading === "add" ? "Création..." : "Créer le rendez-vous"}
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
            <DialogTitle className="text-xl font-semibold text-gray-900">Modifier le rendez-vous</DialogTitle>
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
                onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                placeholder="ex: Consultation initiale"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client">Client *</Label>
              <Select
                value={newAppointment.client_id}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, client_id: value })}
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
                  onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-appointment-time">Heure *</Label>
                <Input
                  id="edit-appointment-time"
                  type="time"
                  value={newAppointment.appointment_time}
                  onChange={(e) => setNewAppointment({ ...newAppointment, appointment_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={newAppointment.type}
                  onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value as AppointmentType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de rendez-vous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="follow_up">Suivi</SelectItem>
                    <SelectItem value="nutrition_planning">Planification nutritionnelle</SelectItem>
                    <SelectItem value="assessment">Évaluation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Durée (min)</Label>
                <Select
                  value={newAppointment.duration_minutes.toString()}
                  onValueChange={(value) => setNewAppointment({ ...newAppointment, duration_minutes: parseInt(value) })}
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
                  onChange={(e) => setNewAppointment({ ...newAppointment, is_virtual: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-is-virtual">Rendez-vous virtuel</Label>
              </div>
              {newAppointment.is_virtual ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-meeting-link">Lien de visioconférence</Label>
                  <Input
                    id="edit-meeting-link"
                    value={newAppointment.meeting_link}
                    onChange={(e) => setNewAppointment({ ...newAppointment, meeting_link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Lieu</Label>
                  <Input
                    id="edit-location"
                    value={newAppointment.location}
                    onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
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
                onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                placeholder="Description du rendez-vous..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false)
              setEditingAppointment(null)
              resetForm()
            }}>
              Annuler
            </Button>
            <Button
              onClick={handleEditAppointment}
              disabled={!newAppointment.title || !newAppointment.client_id || actionLoading === "edit"}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft disabled:opacity-50 font-medium"
            >
              {actionLoading === "edit" ? "Modification..." : "Modifier le rendez-vous"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="px-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1 border-0 shadow-soft bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Calendrier</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border-0"
              />
            </CardContent>
          </Card>

          {/* Appointments List */}
          <div className="lg:col-span-3 space-y-4">
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="today">
                  Aujourd'hui ({todayAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="selected">
                  {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ({selectedDateAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  Tous ({filteredAppointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="space-y-4 mt-6">
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
                        isLoading={actionLoading === appointment.id}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="selected" className="space-y-4 mt-6">
                {selectedDateAppointments.length === 0 ? (
                  <EmptyStateWithSkeleton 
                    icon={CalendarIcon}
                    title="Aucun rendez-vous ce jour"
                    description="Vous n'avez pas de rendez-vous programmés pour cette date."
                  />
                ) : (
                  <div className="space-y-4">
                    {selectedDateAppointments.map((appointment) => (
                      <AppointmentCard 
                        key={appointment.id} 
                        appointment={appointment}
                        onEdit={openEditDialog}
                        onDelete={handleDeleteAppointment}
                        onUpdateStatus={handleUpdateStatus}
                        isLoading={actionLoading === appointment.id}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-4 mt-6">
                {filteredAppointments.length === 0 ? (
                  <EmptyStateWithSkeleton 
                    icon={CalendarIcon}
                    title={searchTerm ? "Aucun rendez-vous trouvé" : "Aucun rendez-vous"}
                    description={searchTerm 
                      ? "Essayez d'ajuster vos termes de recherche." 
                      : "Créez votre premier rendez-vous pour commencer."
                    }
                    action={!searchTerm ? (
                      <Button 
                        onClick={() => setIsAddDialogOpen(true)} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Créer votre premier rendez-vous
                      </Button>
                    ) : undefined}
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
                        isLoading={actionLoading === appointment.id}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

// Appointment Card Component
function AppointmentCard({ 
  appointment, 
  onEdit, 
  onDelete, 
  onUpdateStatus, 
  isLoading 
}: { 
  appointment: AppointmentWithClient
  onEdit: (appointment: AppointmentWithClient) => void
  onDelete: (appointmentId: string) => void
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void
  isLoading: boolean
}) {
  const getTypeLabel = (type: string) => {
    const labels = {
      consultation: "Consultation",
      follow_up: "Suivi",
      nutrition_planning: "Planification",
      assessment: "Évaluation"
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm hover:shadow-soft-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{appointment.title}</h3>
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(appointment.type)}
              </Badge>
              <Badge variant={getStatusVariant(appointment.status)}>
                {getStatusDisplay(appointment.status)}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span>{appointment.clients?.name || "Client inconnu"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>{formatTime(appointment.appointment_time)} ({appointment.duration_minutes}min)</span>
              </div>
              {appointment.is_virtual ? (
                <div className="flex items-center gap-2">
                  <Video className="h-3 w-3" />
                  <span>Visioconférence</span>
                </div>
              ) : appointment.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>{appointment.location}</span>
                </div>
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
                <Button variant="outline" size="sm" disabled={isLoading}>
                  <MoreHorizontal className="h-4 w-4 mr-1" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(appointment)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Modifier
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
                <a href={appointment.meeting_link} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4 mr-1" />
                  Rejoindre
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
