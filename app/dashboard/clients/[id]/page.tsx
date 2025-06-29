"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Edit,
  Save,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Mail,
  Phone,
  Calendar,
  Target,
  Activity,
  MessageSquare,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/auth/AuthProvider"
import { DashboardHeader } from "@/components/dashboard-header"

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  age?: number
  height?: number
  weight?: number
  goal?: string
  dietary_restrictions?: string
  medical_conditions?: string
  notes?: string
  status: string
  created_at: string
  updated_at: string
}

interface WeightEntry {
  id: string
  client_id: string
  weight: number
  date: string
  notes?: string
}

interface Message {
  id: string
  client_id: string
  message: string
  sender: "dietitian" | "client"
  created_at: string
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const { user, profile } = useAuthContext()

  const [client, setClient] = useState<Client | null>(null)
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form states
  const [editForm, setEditForm] = useState<Partial<Client>>({})
  const [newWeight, setNewWeight] = useState("")
  const [newWeightNotes, setNewWeightNotes] = useState("")
  const [newMessage, setNewMessage] = useState("")

  useEffect(() => {
    if (clientId) {
      fetchClientData()
    }
  }, [clientId])

  const fetchClientData = async () => {
    try {
      setLoading(true)

      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single()

      if (clientError) throw clientError

      setClient(clientData)
      setEditForm(clientData)

      // Fetch weight entries
      const { data: weightData, error: weightError } = await supabase
        .from("weight_history")
        .select("*")
        .eq("client_id", clientId)
        .order("recorded_date", { ascending: true })

      if (weightError) throw weightError
      setWeightEntries(weightData || [])

      // Fetch messages
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true })

      if (messageError) throw messageError
      setMessages(messageData || [])
    } catch (err) {
      console.error("Error fetching client data:", err)
      setError("Failed to load client data")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveClient = async () => {
    try {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("clients")
        .update({
          ...editForm,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId)
        .select()
        .single()

      if (error) throw error

      setClient(data)
      setEditing(false)
      setSuccess("Client updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating client:", err)
      setError("Failed to update client")
    } finally {
      setLoading(false)
    }
  }

  const handleAddWeight = async () => {
    if (!newWeight) return

    try {
      const { data, error } = await supabase
        .from("weight_history")
        .insert({
          client_id: clientId,
          weight: Number.parseFloat(newWeight),
          recorded_date: new Date().toISOString().split("T")[0],
          notes: newWeightNotes || null,
        })
        .select()
        .single()

      if (error) throw error

      setWeightEntries([...weightEntries, data])
      setNewWeight("")
      setNewWeightNotes("")
      setSuccess("Weight entry added!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error adding weight entry:", err)
      setError("Failed to add weight entry")
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          client_id: clientId,
          dietitian_id: user?.id, // Add the dietitian_id from current user
          message: newMessage,
          sender_type: "dietitian", // Updated column name
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setMessages([...messages, data])
      setNewMessage("")
      setSuccess("Message sent!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Failed to send message")
    }
  }

  const getWeightTrend = () => {
    if (weightEntries.length < 2) return null
    const latest = weightEntries[weightEntries.length - 1]?.weight
    const previous = weightEntries[weightEntries.length - 2]?.weight
    const diff = latest - previous
    return {
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable",
      amount: Math.abs(diff),
    }
  }

  const chartData = weightEntries.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString(),
    weight: entry.weight,
  }))

  if (loading && !client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Client not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const trend = getWeightTrend()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>
      </div>

      <DashboardHeader
        title={client.name}
        action={
          <Button onClick={() => (editing ? handleSaveClient() : setEditing(true))} disabled={loading}>
            {editing ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit Client
              </>
            )}
          </Button>
        }
      />

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weightEntries.length > 0 ? `${weightEntries[weightEntries.length - 1].weight} lbs` : "No data"}
            </div>
            {trend && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {trend.direction === "up" && <TrendingUp className="h-3 w-3 text-red-500" />}
                {trend.direction === "down" && <TrendingDown className="h-3 w-3 text-green-500" />}
                {trend.direction === "stable" && <Minus className="h-3 w-3 text-gray-500" />}
                {trend.amount.toFixed(1)} lbs from last entry
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.goal || "Not set"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={client.status === "active" ? "default" : "secondary"}>{client.status}</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email || ""}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editForm.phone || ""}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={editForm.age || ""}
                      onChange={(e) => setEditForm({ ...editForm, age: Number.parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (inches)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={editForm.height || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, height: Number.parseInt(e.target.value) || undefined })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal">Goal</Label>
                    <Input
                      id="goal"
                      value={editForm.goal || ""}
                      onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
                    <Textarea
                      id="dietary_restrictions"
                      value={editForm.dietary_restrictions || ""}
                      onChange={(e) => setEditForm({ ...editForm, dietary_restrictions: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="medical_conditions">Medical Conditions</Label>
                    <Textarea
                      id="medical_conditions"
                      value={editForm.medical_conditions || ""}
                      onChange={(e) => setEditForm({ ...editForm, medical_conditions: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.age && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{client.age} years old</span>
                    </div>
                  )}
                  {client.height && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{client.height}" tall</span>
                    </div>
                  )}
                  {client.dietary_restrictions && (
                    <div className="md:col-span-2">
                      <h4 className="font-medium mb-2">Dietary Restrictions</h4>
                      <p className="text-sm text-muted-foreground">{client.dietary_restrictions}</p>
                    </div>
                  )}
                  {client.medical_conditions && (
                    <div className="md:col-span-2">
                      <h4 className="font-medium mb-2">Medical Conditions</h4>
                      <p className="text-sm text-muted-foreground">{client.medical_conditions}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weight Progress</CardTitle>
                <CardDescription>Track weight changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No weight data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Weight Entry</CardTitle>
                <CardDescription>Record a new weight measurement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="Enter weight"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weightNotes">Notes (optional)</Label>
                  <Textarea
                    id="weightNotes"
                    value={newWeightNotes}
                    onChange={(e) => setNewWeightNotes(e.target.value)}
                    placeholder="Any notes about this measurement"
                    rows={2}
                  />
                </div>
                <Button onClick={handleAddWeight} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weight History</CardTitle>
            </CardHeader>
            <CardContent>
              {weightEntries.length > 0 ? (
                <div className="space-y-2">
                  {weightEntries
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{entry.weight} lbs</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                        </div>
                        {entry.notes && <span className="text-sm text-muted-foreground">{entry.notes}</span>}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No weight entries yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Communicate with your client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.sender === "dietitian" ? "bg-emerald-100 ml-8" : "bg-gray-100 mr-8"
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.sender === "dietitian" ? "You" : client.name} •{" "}
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {messages.length === 0 && <p className="text-center text-muted-foreground py-4">No messages yet</p>}
              </div>
              <Separator />
              <div className="space-y-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                />
                <Button onClick={handleSendMessage} className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Notes</CardTitle>
              <CardDescription>Private notes about this client</CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={editForm.notes || ""}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Add your private notes about this client..."
                  rows={8}
                />
              ) : (
                <div className="min-h-32">
                  {client.notes ? (
                    <p className="whitespace-pre-wrap">{client.notes}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No notes added yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
