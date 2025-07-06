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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Bell, Calendar, Clock, Users } from "lucide-react"
import { useAuth } from "@/hooks/useAuthNew"
import { supabase, type Reminder, type Client } from "@/lib/supabase"
import { DashboardHeader } from "@/components/dashboard-header"

interface ReminderWithClient extends Reminder {
  clients: { name: string } | null
}

export default function RemindersPage() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<ReminderWithClient[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newReminder, setNewReminder] = useState({
    title: "",
    message: "",
    client_id: "",
    type: "",
    scheduled_date: "",
    is_recurring: false,
    frequency: "",
    channels: [] as string[],
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      console.log("🔔 Fetching reminders for user:", user.id)

      // Fetch reminders with client names
      const { data: reminderData, error: reminderError } = await supabase
        .from("reminders")
        .select(`
          *,
          clients (name)
        `)
        .eq("dietitian_id", user.id)
        .order("scheduled_date", { ascending: true })

      if (reminderError) {
        console.error("❌ Error fetching reminders:", reminderError)
      } else {
        setReminders(reminderData || [])
      }

      // Fetch clients for the dropdown
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, name")
        .eq("dietitian_id", user.id)
        .eq("status", "active")
        .order("name", { ascending: true })

      if (clientError) {
        console.error("❌ Error fetching clients:", clientError)
      } else {
        setClients(clientData || [])
      }

      console.log("✅ Reminders data loaded successfully")
    } catch (error) {
      console.error("❌ Unexpected error fetching reminders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddReminder = async () => {
    if (!user || !newReminder.title || !newReminder.client_id || !newReminder.scheduled_date) return

    try {
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
        status: "pending",
        sent_at: null,
      }

      console.log("➕ Adding new reminder:", reminderData)

      const { data, error } = await supabase
        .from("reminders")
        .insert(reminderData)
        .select(`
          *,
          clients (name)
        `)
        .single()

      if (error) {
        console.error("❌ Error adding reminder:", error)
        return
      }

      console.log("✅ Reminder added successfully:", data)
      setReminders([data, ...reminders])
      setIsAddDialogOpen(false)
      setNewReminder({
        title: "",
        message: "",
        client_id: "",
        type: "",
        scheduled_date: "",
        is_recurring: false,
        frequency: "",
        channels: [],
      })
    } catch (error) {
      console.error("❌ Unexpected error adding reminder:", error)
    }
  }

  const handleChannelChange = (channel: string, checked: boolean) => {
    if (checked) {
      setNewReminder({ ...newReminder, channels: [...newReminder.channels, channel] })
    } else {
      setNewReminder({ ...newReminder, channels: newReminder.channels.filter((c) => c !== channel) })
    }
  }

  const filteredReminders = reminders.filter(
    (reminder) =>
      reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex-1 space-y-8 p-6 lg:p-8 bg-gradient-to-br from-gray-50/50 via-white to-emerald-50/20 min-h-screen">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="space-y-2">
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-48 animate-pulse" />
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-64 animate-pulse" />
          </div>
          <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-40 animate-pulse" />
        </div>
        <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl max-w-sm animate-pulse" />
        <div className="grid gap-6 animate-slide-up">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="space-y-3">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32 animate-pulse" />
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full animate-pulse" />
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

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
          <DialogContent className="sm:max-w-[500px] shadow-soft-lg border-0">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-semibold text-gray-900">Créer un nouveau rappel</DialogTitle>
              <DialogDescription className="text-gray-600 leading-relaxed">
                Configurez un rappel pour votre client.
              </DialogDescription>
            </DialogHeader>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newReminder.type}
                    onValueChange={(value) => setNewReminder({ ...newReminder, type: value })}
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
                  <Label htmlFor="recurring">Recurring reminder</Label>
                </div>
                {newReminder.is_recurring && (
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={newReminder.frequency}
                      onValueChange={(value) => setNewReminder({ ...newReminder, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddReminder}
                disabled={!newReminder.title || !newReminder.client_id || !newReminder.scheduled_date}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft disabled:opacity-50 font-medium"
              >
                Create Reminder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        }
      />

      <div className="px-6 space-y-6">
      {filteredReminders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "Try adjusting your search terms." : "Create your first reminder to get started."}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Button onClick={() => setIsAddDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Reminder
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReminders.map((reminder) => (
            <Card key={reminder.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{reminder.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Users className="mr-1 h-3 w-3" />
                      {reminder.clients?.name || "Unknown Client"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {reminder.type}
                    </Badge>
                    <Badge
                      variant={
                        reminder.status === "pending"
                          ? "secondary"
                          : reminder.status === "sent"
                            ? "default"
                            : "destructive"
                      }
                    >
                      {reminder.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {reminder.message && <p className="text-sm text-muted-foreground">{reminder.message}</p>}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(reminder.scheduled_date).toLocaleString()}
                  </div>
                  {reminder.is_recurring && (
                    <Badge variant="outline" className="text-xs">
                      Recurring ({reminder.frequency})
                    </Badge>
                  )}
                </div>
                {reminder.channels.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Channels:</span>
                    <div className="flex space-x-1">
                      {reminder.channels.map((channel) => (
                        <Badge key={channel} variant="outline" className="text-xs capitalize">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    Created {new Date(reminder.created_at).toLocaleDateString()}
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
