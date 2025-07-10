"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSkeleton, EmptyStateWithSkeleton } from "@/components/shared/skeletons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuthNew"
import { api, type ReminderWithClient } from "@/lib/api"
import { formatDate } from "@/lib/formatters"
import { getStatusDisplay, getStatusVariant } from "@/lib/status"
import { type Client } from "@/lib/supabase"
import {
    AlertCircle,
    Bell,
    Calendar,
    CheckCircle,
    Clock,
    Edit3,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Send,
    Trash2,
    Users
} from "lucide-react"
import { useEffect, useState } from "react"

// Enhanced types for better UX
type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled'
type ReminderType = 'appointment' | 'follow_up' | 'check_in' | 'meal_plan' | 'weigh_in' | 'other'
type FilterTab = 'all' | 'pending' | 'sent' | 'overdue'

interface ReminderFormData {
  title: string
  message: string
  client_id: string
  type: ReminderType | ""
  scheduled_date: string
  is_recurring: boolean
  frequency: string
  channels: string[]
}

export default function RemindersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State management
  const [reminders, setReminders] = useState<ReminderWithClient[]>([])
  const [clients, setClients] = useState<Pick<Client, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<ReminderWithClient | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [newReminder, setNewReminder] = useState<ReminderFormData>({
    title: "",
    message: "",
    client_id: "",
    type: "",
    scheduled_date: "",
    is_recurring: false,
    frequency: "",
    channels: ["email"],
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
      const [remindersData, clientsData] = await Promise.all([
        api.getReminders(user.id),
        api.getActiveClients(user.id)
      ])

      setReminders(remindersData)
      setClients(clientsData)
    } catch (error) {
      console.error("Error fetching reminders:", error)
      setError("Impossible de charger les rappels. Veuillez réessayer.")
      toast({
        title: "Erreur",
        description: "Impossible de charger les rappels",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddReminder = async () => {
    if (!user || !newReminder.title || !newReminder.client_id || !newReminder.scheduled_date) return

    try {
      setActionLoading("add")
      const reminderData = {
        dietitian_id: user.id,
        client_id: newReminder.client_id,
        type: newReminder.type,
        title: newReminder.title,
        message: newReminder.message,
        scheduled_date: newReminder.scheduled_date,
        is_recurring: newReminder.is_recurring,
        frequency: newReminder.is_recurring ? newReminder.frequency : null,
        channels: newReminder.channels,
        status: "pending" as ReminderStatus,
        sent_at: null,
      }

      const data = await api.createReminder(reminderData)
      
      setReminders([data, ...reminders])
      setIsAddDialogOpen(false)
      resetForm()
      
      toast({
        title: "Succès",
        description: "Rappel créé avec succès",
      })
    } catch (error) {
      console.error("Error adding reminder:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le rappel",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditReminder = async () => {
    if (!editingReminder || !user) return

    try {
      setActionLoading("edit")
      const reminderData = {
        ...editingReminder,
        title: newReminder.title,
        message: newReminder.message,
        client_id: newReminder.client_id,
        type: newReminder.type,
        scheduled_date: newReminder.scheduled_date,
        is_recurring: newReminder.is_recurring,
        frequency: newReminder.is_recurring ? newReminder.frequency : null,
        channels: newReminder.channels,
      }

      const data = await api.updateReminder(editingReminder.id, reminderData)
      
      setReminders(reminders.map(r => r.id === editingReminder.id ? data : r))
      setIsEditDialogOpen(false)
      setEditingReminder(null)
      resetForm()
      
      toast({
        title: "Succès",
        description: "Rappel modifié avec succès",
      })
    } catch (error) {
      console.error("Error editing reminder:", error)
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rappel",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      setActionLoading(reminderId)
      await api.deleteReminder(reminderId)
      
      setReminders(reminders.filter(r => r.id !== reminderId))
      
      toast({
        title: "Succès",
        description: "Rappel supprimé avec succès",
      })
    } catch (error) {
      console.error("Error deleting reminder:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rappel",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAsSent = async (reminderId: string) => {
    try {
      setActionLoading(reminderId)
      const data = await api.markReminderAsSent(reminderId)
      
      setReminders(reminders.map(r => r.id === reminderId ? data : r))
      
      toast({
        title: "Succès",
        description: "Rappel marqué comme envoyé",
      })
    } catch (error) {
      console.error("Error marking reminder as sent:", error)
      toast({
        title: "Erreur",
        description: "Impossible de marquer le rappel comme envoyé",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const sendReminderNow = async (reminder: ReminderWithClient) => {
    if (!reminder.clients?.email) {
      toast({
        title: "Erreur",
        description: "Email du client introuvable",
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading(`send-${reminder.id}`)

      // Map reminder type to notification type
      let notificationType = 'appointment_reminder'
      switch (reminder.type) {
        case 'appointment':
          notificationType = 'appointment_reminder'
          break
        case 'meal_plan':
          notificationType = 'meal_plan_notification'
          break
        case 'follow_up':
        case 'check_in':
        case 'weigh_in':
        case 'other':
        default:
          notificationType = 'custom_notification'
          break
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: notificationType,
          recipient: {
            email: reminder.clients.email,
            name: reminder.clients.name,
            phone: reminder.clients.phone, // Add phone if available
          },
          data: {
            title: reminder.title,
            message: reminder.message,
            clientName: reminder.clients.name,
            scheduledDate: reminder.scheduled_date,
            reminderType: reminder.type,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'envoi du rappel')
      }

      // Mark as sent in the database
      await handleMarkAsSent(reminder.id)

      toast({
        title: "Rappel envoyé",
        description: `Rappel envoyé à ${reminder.clients.name}`,
      })
    } catch (error) {
      console.error('❌ Send reminder error:', error)
      toast({
        title: "Erreur d'envoi",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openEditDialog = (reminder: ReminderWithClient) => {
    setEditingReminder(reminder)
    setNewReminder({
      title: reminder.title,
      message: reminder.message || "",
      client_id: reminder.client_id,
      type: reminder.type as ReminderType,
      scheduled_date: reminder.scheduled_date,
      is_recurring: reminder.is_recurring,
      frequency: reminder.frequency || "",
      channels: reminder.channels || ["email"],
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setNewReminder({
      title: "",
      message: "",
      client_id: "",
      type: "",
      scheduled_date: "",
      is_recurring: false,
      frequency: "",
      channels: ["email"],
    })
  }

  const handleChannelChange = (channel: string, checked: boolean) => {
    if (checked) {
      setNewReminder({ ...newReminder, channels: [...newReminder.channels, channel] })
    } else {
      setNewReminder({ ...newReminder, channels: newReminder.channels.filter((c) => c !== channel) })
    }
  }

  const isOverdue = (scheduledDate: string) => {
    return new Date(scheduledDate) < new Date()
  }

  const getFilteredReminders = () => {
    let filtered = reminders.filter(
      (reminder) =>
        reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminder.clients?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    switch (activeTab) {
      case 'pending':
        filtered = filtered.filter(r => r.status === 'pending')
        break
      case 'sent':
        filtered = filtered.filter(r => r.status === 'sent')
        break
      case 'overdue':
        filtered = filtered.filter(r => r.status === 'pending' && isOverdue(r.scheduled_date))
        break
      default:
        break
    }

    return filtered
  }

  const filteredReminders = getFilteredReminders()

  const getTabCounts = () => {
    return {
      all: reminders.length,
      pending: reminders.filter(r => r.status === 'pending').length,
      sent: reminders.filter(r => r.status === 'sent').length,
      overdue: reminders.filter(r => r.status === 'pending' && isOverdue(r.scheduled_date)).length,
    }
  }

  const tabCounts = getTabCounts()

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Rappels" subtitle="Gérez les rappels et notifications clients" />
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

  const ReminderForm = () => (
    <div className="grid gap-6 py-6">
      <div className="space-y-2">
        <Label htmlFor="reminder-title">Titre *</Label>
        <Input
          id="reminder-title"
          value={newReminder.title}
          onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
          placeholder="ex: Suivi hebdomadaire"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client">Client *</Label>
        <Select
          value={newReminder.client_id}
          onValueChange={(value) => setNewReminder({ ...newReminder, client_id: value })}
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
      </div>              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={newReminder.type}
            onValueChange={(value) => setNewReminder({ ...newReminder, type: value as ReminderType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="appointment">Rendez-vous</SelectItem>
              <SelectItem value="follow_up">Suivi</SelectItem>
              <SelectItem value="check_in">Check-in</SelectItem>
              <SelectItem value="meal_plan">Plan alimentaire</SelectItem>
              <SelectItem value="weigh_in">Pesée</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduled-date">Date programmée *</Label>
          <Input
            id="scheduled-date"
            type="datetime-local"
            value={newReminder.scheduled_date}
            onChange={(e) => setNewReminder({ ...newReminder, scheduled_date: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={newReminder.message}
          onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
          placeholder="Message du rappel..."
          rows={3}
        />
      </div>
      <div className="space-y-3">
        <Label>Canaux de notification</Label>
        <div className="flex flex-wrap gap-4">
          {["email", "sms", "push"].map((channel) => (
            <div key={channel} className="flex items-center space-x-2">
              <Checkbox
                id={channel}
                checked={newReminder.channels.includes(channel)}
                onCheckedChange={(checked) => handleChannelChange(channel, checked as boolean)}
              />
              <Label htmlFor={channel} className="capitalize">
                {channel === "email" ? "Email" : channel === "sms" ? "SMS" : "Push"}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="recurring"
            checked={newReminder.is_recurring}
            onCheckedChange={(checked) => setNewReminder({ ...newReminder, is_recurring: checked as boolean })}
          />
          <Label htmlFor="recurring">Rappel récurrent</Label>
        </div>
        {newReminder.is_recurring && (
          <div className="space-y-2">
            <Label htmlFor="frequency">Fréquence</Label>
            <Select
              value={newReminder.frequency}
              onValueChange={(value) => setNewReminder({ ...newReminder, frequency: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la fréquence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Rappels"
        subtitle="Gérez les rappels et notifications clients"
        searchPlaceholder="Rechercher des rappels..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium">
                <Plus className="mr-2 h-4 w-4" />
                Créer un rappel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] shadow-soft-lg border-0 max-h-[90vh] overflow-y-auto">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold text-gray-900">Créer un nouveau rappel</DialogTitle>
                <DialogDescription className="text-gray-600 leading-relaxed">
                  Configurez un rappel pour votre client.
                </DialogDescription>
              </DialogHeader>
              <ReminderForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleAddReminder}
                  disabled={!newReminder.title || !newReminder.client_id || !newReminder.scheduled_date || actionLoading === "add"}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft disabled:opacity-50 font-medium"
                >
                  {actionLoading === "add" ? "Création..." : "Créer le rappel"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="px-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilterTab)}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger value="all" className="flex items-center gap-2">
              Tous
              <Badge variant="secondary" className="ml-1">{tabCounts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              En attente
              <Badge variant="secondary" className="ml-1">{tabCounts.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              Envoyés
              <Badge variant="secondary" className="ml-1">{tabCounts.sent}</Badge>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              En retard
              <Badge variant="destructive" className="ml-1">{tabCounts.overdue}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredReminders.length === 0 ? (
              <EmptyStateWithSkeleton 
                icon={Bell}
                title={searchTerm ? "Aucun rappel trouvé" : "Aucun rappel pour le moment"}
                description={searchTerm 
                  ? "Essayez d'ajuster vos termes de recherche." 
                  : "Créez votre premier rappel pour commencer à organiser le suivi de vos clients."
                }
                action={!searchTerm ? (
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer votre premier rappel
                  </Button>
                ) : undefined}
              />
            ) : (
              <div className="grid gap-4">
                {filteredReminders.map((reminder) => (
                  <Card key={reminder.id} className="border-0 shadow-soft bg-white/80 backdrop-blur-sm hover:shadow-soft-md transition-all duration-200 animate-scale-in">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-900 font-semibold">
                            {reminder.title}
                          </CardTitle>
                          <CardDescription className="flex items-center mt-1 text-gray-600">
                            <Users className="mr-1 h-3 w-3" />
                            {reminder.clients?.name || "Client inconnu"}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {reminder.type && (
                            <Badge variant="outline" className="capitalize">
                              {reminder.type === "appointment" ? "Rendez-vous" :
                               reminder.type === "follow_up" ? "Suivi" :
                               reminder.type === "check_in" ? "Check-in" :
                               reminder.type === "meal_plan" ? "Plan alimentaire" :
                               reminder.type === "weigh_in" ? "Pesée" :
                               "Autre"}
                            </Badge>
                          )}
                          <Badge
                            variant={
                              reminder.status === 'pending' && isOverdue(reminder.scheduled_date) 
                                ? 'destructive' 
                                : getStatusVariant(reminder.status)
                            }
                          >
                            {reminder.status === 'pending' && isOverdue(reminder.scheduled_date) 
                              ? 'En retard' 
                              : getStatusDisplay(reminder.status)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Ouvrir le menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(reminder)}>
                                <Edit3 className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              {reminder.status === 'pending' && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => sendReminderNow(reminder)}
                                    disabled={actionLoading === `send-${reminder.id}`}
                                  >
                                    <Send className="mr-2 h-4 w-4" />
                                    {actionLoading === `send-${reminder.id}` ? "Envoi..." : "Envoyer maintenant"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleMarkAsSent(reminder.id)}
                                    disabled={actionLoading === reminder.id}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Marquer comme envoyé
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteReminder(reminder.id)}
                                disabled={actionLoading === reminder.id}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {reminder.message && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {reminder.message}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(reminder.scheduled_date)}
                        </div>
                        {reminder.is_recurring && (
                          <Badge variant="outline" className="text-xs w-fit">
                            Récurrent ({reminder.frequency === 'daily' ? 'Quotidien' : 
                                       reminder.frequency === 'weekly' ? 'Hebdomadaire' : 
                                       reminder.frequency === 'monthly' ? 'Mensuel' : reminder.frequency})
                          </Badge>
                        )}
                      </div>
                      {reminder.channels && reminder.channels.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-sm text-gray-600">Canaux:</span>
                          <div className="flex flex-wrap gap-1">
                            {reminder.channels.map((channel) => (
                              <Badge key={channel} variant="outline" className="text-xs capitalize">
                                {channel === "email" ? "Email" : channel === "sms" ? "SMS" : "Push"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-500 pt-2 border-t">
                        <Clock className="mr-1 h-3 w-3" />
                        Créé le {formatDate(reminder.created_at)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] shadow-soft-lg border-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900">Modifier le rappel</DialogTitle>
            <DialogDescription className="text-gray-600 leading-relaxed">
              Modifiez les détails du rappel.
            </DialogDescription>
          </DialogHeader>
          <ReminderForm />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingReminder(null)
                resetForm()
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditReminder}
              disabled={!newReminder.title || !newReminder.client_id || !newReminder.scheduled_date || actionLoading === "edit"}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft disabled:opacity-50 font-medium"
            >
              {actionLoading === "edit" ? "Modification..." : "Modifier le rappel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
