"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ProfessionalCalendar } from "@/components/ui/professional-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuthNew"
import { supabase } from "@/lib/supabase"
import {
    Check,
    Download,
    ExternalLink,
    Plus,
    RefreshCw,
    Repeat,
    Settings,
    Video
} from "lucide-react"
import { useEffect, useState } from "react"

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  type: 'consultation' | 'follow_up' | 'group_session' | 'workshop' | 'personal'
  client_id?: string
  client_name?: string
  location?: string
  meeting_url?: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  reminders: Array<{ type: 'email' | 'sms'; minutes_before: number }>
  recurring?: {
    pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly'
    end_date?: string
    occurrences?: number
  }
  notes?: string
  preparation_needed?: string[]
  follow_up_required?: boolean
}

interface CalendarIntegration {
  id: string
  provider: 'google' | 'outlook' | 'apple' | 'caldav'
  name: string
  email: string
  connected: boolean
  last_sync: string
  sync_enabled: boolean
}

export default function AdvancedCalendarPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    client_id: "",
    start_date: "",
    start_time: "",
    end_time: "",
    type: "consultation" as const,
    location: "",
    meeting_url: "",
    recurring: false,
    recurring_pattern: "weekly" as const,
    recurring_end: "",
    reminders: [{ type: "email" as 'email' | 'sms', minutes_before: 30 }],
    preparation_needed: [] as string[],
    notes: ""
  })

  useEffect(() => {
    if (user) {
      fetchCalendarData()
      fetchClients()
      fetchIntegrations()
    }
  }, [user])

  const fetchCalendarData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // In production, this would fetch real appointment data
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          title: "Consultation initiale - Marie Dubois",
          description: "Première consultation pour établir les objectifs et le plan alimentaire",
          start_time: "2024-02-15T09:00:00Z",
          end_time: "2024-02-15T10:00:00Z",
          type: "consultation",
          client_id: "client-1",
          client_name: "Marie Dubois",
          location: "Cabinet - Salle 1",
          status: "confirmed",
          reminders: [
            { type: "email", minutes_before: 1440 }, // 24h
            { type: "email", minutes_before: 30 }
          ],
          preparation_needed: ["Dossier médical", "Questionnaire alimentaire", "Analyses sanguines"],
          follow_up_required: true
        },
        {
          id: "2",
          title: "Suivi nutritionnel - Jean Martin",
          description: "Bilan mensuel et ajustement du plan",
          start_time: "2024-02-15T14:30:00Z",
          end_time: "2024-02-15T15:30:00Z",
          type: "follow_up",
          client_id: "client-2",
          client_name: "Jean Martin",
          meeting_url: "https://meet.google.com/abc-defg-hij",
          status: "scheduled",
          reminders: [{ type: "email", minutes_before: 60 }],
          recurring: {
            pattern: "monthly",
            end_date: "2024-06-15"
          }
        },
        {
          id: "3",
          title: "Atelier groupe - Nutrition sportive",
          description: "Atelier sur l'alimentation pour les sportifs",
          start_time: "2024-02-20T18:00:00Z",
          end_time: "2024-02-20T20:00:00Z",
          type: "workshop",
          location: "Salle de conférence",
          status: "confirmed",
          reminders: [{ type: "email", minutes_before: 2880 }], // 48h
          preparation_needed: ["Supports de présentation", "Échantillons alimentaires"]
        }
      ]

      setEvents(mockEvents)
    } catch (error) {
      console.error("Error fetching calendar data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le calendrier",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("dietitian_id", user.id)

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const fetchIntegrations = async () => {
    // Mock integrations data
    const mockIntegrations: CalendarIntegration[] = [
      {
        id: "google-1",
        provider: "google",
        name: "Google Calendar",
        email: "nutritionist@example.com",
        connected: true,
        last_sync: "2024-02-14T10:30:00Z",
        sync_enabled: true
      },
      {
        id: "outlook-1",
        provider: "outlook",
        name: "Outlook Calendar",
        email: "office@nutritionist.com",
        connected: false,
        last_sync: "",
        sync_enabled: false
      }
    ]

    setIntegrations(mockIntegrations)
  }

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.start_date || !eventForm.start_time || !eventForm.end_time) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    try {
      const newEvent: CalendarEvent = {
        id: `event-${Date.now()}`,
        title: eventForm.title,
        description: eventForm.description,
        start_time: `${eventForm.start_date}T${eventForm.start_time}:00Z`,
        end_time: `${eventForm.start_date}T${eventForm.end_time}:00Z`,
        type: eventForm.type,
        client_id: eventForm.client_id || undefined,
        client_name: clients.find(c => c.id === eventForm.client_id)?.name,
        location: eventForm.location,
        meeting_url: eventForm.meeting_url,
        status: "scheduled",
        reminders: eventForm.reminders,
        preparation_needed: eventForm.preparation_needed,
        notes: eventForm.notes,
        recurring: eventForm.recurring ? {
          pattern: eventForm.recurring_pattern,
          end_date: eventForm.recurring_end || undefined
        } : undefined
      }

      // In production, save to database and sync with external calendars
      setEvents([...events, newEvent])
      
      // Reset form and close dialog
      setEventForm({
        title: "",
        description: "",
        client_id: "",
        start_date: "",
        start_time: "",
        end_time: "",
        type: "consultation",
        location: "",
        meeting_url: "",
        recurring: false,
        recurring_pattern: "weekly",
        recurring_end: "",
        reminders: [{ type: "email" as 'email' | 'sms', minutes_before: 30 }],
        preparation_needed: [],
        notes: ""
      })
      setIsEventDialogOpen(false)

      toast({
        title: "Événement créé",
        description: "Le rendez-vous a été ajouté à votre calendrier"
      })

      // Sync with external calendars
      await syncWithExternalCalendars(newEvent)
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer l'événement",
        variant: "destructive"
      })
    }
  }

  const syncWithExternalCalendars = async (event: CalendarEvent) => {
    // In production, this would sync with Google Calendar, Outlook, etc.
    console.log("Syncing event with external calendars:", event)
    
    toast({
      title: "Synchronisation",
      description: "Événement synchronisé avec vos calendriers externes"
    })
  }

  const handleConnectCalendar = async (provider: string) => {
    // In production, this would handle OAuth flow
    console.log("Connecting to", provider)
    
    toast({
      title: "Connexion en cours",
      description: `Connexion à ${provider} Calendar...`
    })
    
    // Simulate connection
    setTimeout(() => {
      setIntegrations(integrations.map(integration => 
        integration.provider === provider 
          ? { ...integration, connected: true, last_sync: new Date().toISOString() }
          : integration
      ))
      
      toast({
        title: "Connexion réussie",
        description: `${provider} Calendar connecté avec succès`
      })
    }, 2000)
  }

  const exportCalendar = async (format: 'ics' | 'pdf') => {
    try {
      // In production, generate actual export file
      console.log(`Exporting calendar as ${format}`)
      
      toast({
        title: "Export en cours",
        description: `Génération du fichier ${format.toUpperCase()}...`
      })
      
      setTimeout(() => {
        toast({
          title: "Export terminé",
          description: "Votre calendrier a été téléchargé"
        })
      }, 2000)
    } catch (error) {
      console.error("Error exporting calendar:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le calendrier",
        variant: "destructive"
      })
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-500'
      case 'follow_up': return 'bg-green-500'
      case 'group_session': return 'bg-purple-500'
      case 'workshop': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation': return 'Consultation'
      case 'follow_up': return 'Suivi'
      case 'group_session': return 'Séance groupe'
      case 'workshop': return 'Atelier'
      default: return 'Autre'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Calendrier Avancé" subtitle="Gestion complète des rendez-vous" />
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Calendrier Avancé"
        subtitle="Gestion complète des rendez-vous avec synchronisation externe"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCalendar('ics')}>
              <Download className="h-4 w-4 mr-2" />
              Export ICS
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCalendar('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau RDV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un rendez-vous</DialogTitle>
                  <DialogDescription>
                    Planifiez un nouveau rendez-vous avec synchronisation automatique
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre *</Label>
                      <Input
                        id="title"
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        placeholder="Consultation initiale..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select value={eventForm.type} onValueChange={(value: any) => setEventForm({ ...eventForm, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultation">Consultation</SelectItem>
                          <SelectItem value="follow_up">Suivi</SelectItem>
                          <SelectItem value="group_session">Séance groupe</SelectItem>
                          <SelectItem value="workshop">Atelier</SelectItem>
                          <SelectItem value="personal">Personnel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      placeholder="Détails du rendez-vous..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client">Client</Label>
                    <Select value={eventForm.client_id} onValueChange={(value) => setEventForm({ ...eventForm, client_id: value })}>
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

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={eventForm.start_date}
                        onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Heure début *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={eventForm.start_time}
                        onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">Heure fin *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={eventForm.end_time}
                        onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Lieu</Label>
                      <Input
                        id="location"
                        value={eventForm.location}
                        onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                        placeholder="Cabinet, Visio..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meeting_url">Lien visio</Label>
                      <Input
                        id="meeting_url"
                        value={eventForm.meeting_url}
                        onChange={(e) => setEventForm({ ...eventForm, meeting_url: e.target.value })}
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rappels</Label>
                    <div className="space-y-2">
                      {eventForm.reminders.map((reminder, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Select
                            value={reminder.type}
                            onValueChange={(value: 'email' | 'sms') => {
                              const newReminders = [...eventForm.reminders]
                              newReminders[index].type = value
                              setEventForm({ ...eventForm, reminders: newReminders })
                            }}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={reminder.minutes_before}
                            onChange={(e) => {
                              const newReminders = [...eventForm.reminders]
                              newReminders[index].minutes_before = parseInt(e.target.value)
                              setEventForm({ ...eventForm, reminders: newReminders })
                            }}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600">min avant</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={eventForm.notes}
                      onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                      placeholder="Notes internes..."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateEvent}>
                    Créer le rendez-vous
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="month">Mois</TabsTrigger>
            <TabsTrigger value="week">Semaine</TabsTrigger>
            <TabsTrigger value="day">Jour</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Synchroniser
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <TabsContent value="month" className="mt-0">
              <Card>
                <CardContent className="p-6">
                  <ProfessionalCalendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date instanceof Date) {
                        setSelectedDate(date)
                      }
                    }}
                    className="rounded-md border"
                    events={events.map(event => ({
                      date: new Date(event.start_time),
                      title: event.title,
                      type: event.type
                    }))}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agenda" className="mt-0">
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`} />
                          <div>
                            <h4 className="font-semibold">{event.title}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(event.start_time).toLocaleDateString()} • {' '}
                              {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {' '}
                              {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {event.client_name && (
                              <p className="text-sm text-blue-600">{event.client_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            event.status === 'confirmed' ? 'default' :
                            event.status === 'completed' ? 'secondary' : 'outline'
                          }>
                            {event.status}
                          </Badge>
                          {event.meeting_url && (
                            <Button variant="ghost" size="sm">
                              <Video className="h-4 w-4" />
                            </Button>
                          )}
                          {event.recurring && (
                            <Button variant="ghost" size="sm">
                              <Repeat className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {event.preparation_needed && event.preparation_needed.length > 0 && (
                        <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200">
                          <p className="text-sm font-medium text-amber-800 mb-1">Préparation nécessaire:</p>
                          <ul className="text-sm text-amber-700">
                            {event.preparation_needed.map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Events for selected date */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <p className="text-sm text-gray-600">Aucun événement</p>
                  ) : (
                    getEventsForDate(selectedDate).map((event) => (
                      <div key={event.id} className="p-3 rounded-lg border bg-gray-50">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`} />
                          <span className="text-sm font-medium">{event.title}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {' '}
                          {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {event.client_name && (
                          <p className="text-xs text-blue-600 mt-1">{event.client_name}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Calendar Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Intégrations</CardTitle>
                <CardDescription>Synchronisez avec vos calendriers externes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${integration.connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <p className="text-sm font-medium">{integration.name}</p>
                          <p className="text-xs text-gray-600">{integration.email}</p>
                        </div>
                      </div>
                      {integration.connected ? (
                        <div className="flex items-center gap-1">
                          <Check className="h-4 w-4 text-green-600" />
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConnectCalendar(integration.provider)}
                        >
                          Connecter
                        </Button>
                      )}
                    </div>
                  ))}
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
                    <span className="text-sm text-gray-600">Cette semaine</span>
                    <span className="text-sm font-semibold">12 RDV</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ce mois</span>
                    <span className="text-sm font-semibold">45 RDV</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Taux présence</span>
                    <span className="text-sm font-semibold">92%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Consultations</span>
                    <span className="text-sm font-semibold">28</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
