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
  Clock,
  Ruler,
  Weight,
  FileText,
  Trash2,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuthNew"

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  age?: number
  height?: string
  current_weight?: number
  goal_weight?: number
  goal?: string
  notes?: string
  status: string
  created_at: string
  updated_at: string
}

interface WeightEntry {
  id: string
  client_id: string
  weight: number
  recorded_date: string
  notes?: string
  created_at: string
}

interface Note {
  id: string
  client_id: string
  dietitian_id: string
  message: string
  sender_type: "dietitian" | "client"
  created_at: string
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const { user } = useAuth()

  const [client, setClient] = useState<Client | null>(null)
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form states
  const [editForm, setEditForm] = useState<Partial<Client>>({})
  const [newWeight, setNewWeight] = useState("")
  const [newWeightNotes, setNewWeightNotes] = useState("")
  const [newNote, setNewNote] = useState("")

  // Form validation states
  const [weightValidation, setWeightValidation] = useState({ isValid: true, message: "" })
  const [profileValidation, setProfileValidation] = useState({
    name: { isValid: true, message: "" },
    email: { isValid: true, message: "" },
    phone: { isValid: true, message: "" },
    age: { isValid: true, message: "" },
    height: { isValid: true, message: "" },
    goal_weight: { isValid: true, message: "" },
    current_weight: { isValid: true, message: "" }
  })
  // Note validation state
  const [noteValidation, setNoteValidation] = useState({ isValid: true, message: "" })

  useEffect(() => {
    if (clientId) {
      fetchClientData()
    }
  }, [clientId])

  const fetchClientData = async () => {
    try {
      setLoading(true)
      setError("")

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

      if (weightError && weightError.code !== "PGRST116") {
        console.error("Weight data error:", weightError)
      }
      setWeightEntries(weightData || [])

      // Fetch notes/messages
      const { data: notesData, error: notesError } = await supabase
        .from("messages")
        .select("*")
        .eq("client_id", clientId)
        .eq("sender_type", "dietitian")
        .order("created_at", { ascending: true })

      if (notesError && notesError.code !== "PGRST116") {
        console.error("Notes data error:", notesError)
      }
      setNotes(notesData || [])
    } catch (err) {
      console.error("Error fetching client data:", err)
      setError("Impossible de charger les données du client")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveClient = async () => {
    // Validate all fields
    const validations = {
      name: validateName(editForm.name || ""),
      email: validateEmail(editForm.email || ""),
      phone: validatePhone(editForm.phone || ""),
      age: validateAge(editForm.age?.toString() || ""),
      height: validateHeight(editForm.height || ""),
      goal_weight: validateGoalWeight(editForm.goal_weight?.toString() || ""),
      current_weight: validateGoalWeight(editForm.current_weight?.toString() || "")
    }

    setProfileValidation(validations)

    // Check if any validation failed
    const hasErrors = Object.values(validations).some(validation => !validation.isValid)
    if (hasErrors) {
      setError("Veuillez corriger les erreurs dans le formulaire")
      return
    }

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
      // Reset validation states
      setProfileValidation({
        name: { isValid: true, message: "" },
        email: { isValid: true, message: "" },
        phone: { isValid: true, message: "" },
        age: { isValid: true, message: "" },
        height: { isValid: true, message: "" },
        goal_weight: { isValid: true, message: "" },
        current_weight: { isValid: true, message: "" }
      })
      setSuccess("Client mis à jour avec succès!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating client:", err)
      setError("Impossible de mettre à jour le client")
    } finally {
      setLoading(false)
    }
  }

  const handleAddWeight = async () => {
    // Validate weight
    const weightValidationResult = validateWeight(newWeight)
    setWeightValidation(weightValidationResult)
    
    if (!weightValidationResult.isValid) {
      return
    }

    try {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("weight_history")
        .insert({
          client_id: clientId,
          weight: parseFloat(newWeight),
          recorded_date: new Date().toISOString().split("T")[0],
          notes: newWeightNotes || null,
        })
        .select()
        .single()

      if (error) throw error

      setWeightEntries([...weightEntries, data])
      setNewWeight("")
      setNewWeightNotes("")
      setWeightValidation({ isValid: true, message: "" })
      setSuccess("Mesure ajoutée avec succès!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error adding weight entry:", err)
      setError("Impossible d'ajouter la mesure")
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    // Validate note
    const noteText = newNote.trim()
    if (!noteText) {
      setNoteValidation({ isValid: false, message: "La note ne peut pas être vide" })
      return
    }
    if (noteText.length < 3) {
      setNoteValidation({ isValid: false, message: "La note doit contenir au moins 3 caractères" })
      return
    }
    setNoteValidation({ isValid: true, message: "" })

    try {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("messages")
        .insert({
          client_id: clientId,
          dietitian_id: user?.id,
          message: newNote,
          sender_type: "dietitian",
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setNotes([...notes, data])
      setNewNote("")
      setNoteValidation({ isValid: true, message: "" })
      setSuccess("Note ajoutée avec succès!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error adding note:", err)
      setError("Impossible d'ajouter la note")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) return

    try {
      setLoading(true)
      setError("")

      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", noteId)

      if (error) throw error

      setNotes(notes.filter(note => note.id !== noteId))
      setSuccess("Note supprimée avec succès!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error deleting note:", err)
      setError("Impossible de supprimer la note")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWeight = async (weightId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette mesure de poids ?")) return

    try {
      setLoading(true)
      setError("")

      const { error } = await supabase
        .from("weight_history")
        .delete()
        .eq("id", weightId)

      if (error) throw error

      setWeightEntries(weightEntries.filter(entry => entry.id !== weightId))
      setSuccess("Mesure supprimée avec succès!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error deleting weight entry:", err)
      setError("Impossible de supprimer la mesure")
    } finally {
      setLoading(false)
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

  const getCurrentWeight = () => {
    if (weightEntries.length > 0) {
      return weightEntries[weightEntries.length - 1].weight
    }
    return client?.current_weight || null
  }

  const chartData = weightEntries.map((entry) => ({
    date: new Date(entry.recorded_date).toLocaleDateString("fr-FR"),
    weight: entry.weight,
  }))

  // Validation functions
  const validateWeight = (weight: string): { isValid: boolean; message: string } => {
    if (!weight.trim()) {
      return { isValid: false, message: "Le poids est requis" }
    }
    
    const weightNum = parseFloat(weight)
    if (isNaN(weightNum)) {
      return { isValid: false, message: "Veuillez entrer un nombre valide" }
    }
    
    if (weightNum <= 0) {
      return { isValid: false, message: "Le poids doit être supérieur à 0" }
    }
    
    if (weightNum > 999) {
      return { isValid: false, message: "Le poids ne peut pas dépasser 999 kg" }
    }
    
    return { isValid: true, message: "" }
  }

  const validateEmail = (email: string): { isValid: boolean; message: string } => {
    if (!email.trim()) {
      return { isValid: false, message: "L'email est requis" }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { isValid: false, message: "Veuillez entrer un email valide" }
    }
    
    return { isValid: true, message: "" }
  }

  const validateName = (name: string): { isValid: boolean; message: string } => {
    if (!name.trim()) {
      return { isValid: false, message: "Le nom est requis" }
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, message: "Le nom doit contenir au moins 2 caractères" }
    }
    
    return { isValid: true, message: "" }
  }

  const validatePhone = (phone: string): { isValid: boolean; message: string } => {
    if (!phone.trim()) {
      return { isValid: true, message: "" } // Phone is optional
    }
    
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return { isValid: false, message: "Veuillez entrer un numéro de téléphone français valide" }
    }
    
    return { isValid: true, message: "" }
  }

  const validateAge = (age: string): { isValid: boolean; message: string } => {
    if (!age.trim()) {
      return { isValid: true, message: "" } // Age is optional
    }
    
    const ageNum = parseInt(age)
    if (isNaN(ageNum)) {
      return { isValid: false, message: "Veuillez entrer un âge valide" }
    }
    
    if (ageNum < 1 || ageNum > 120) {
      return { isValid: false, message: "L'âge doit être entre 1 et 120 ans" }
    }
    
    return { isValid: true, message: "" }
  }

  const validateHeight = (height: string): { isValid: boolean; message: string } => {
    if (!height.trim()) {
      return { isValid: true, message: "" } // Height is optional
    }
    
    const heightNum = parseFloat(height)
    if (isNaN(heightNum)) {
      return { isValid: false, message: "Veuillez entrer une taille valide" }
    }
    
    if (heightNum < 50 || heightNum > 300) {
      return { isValid: false, message: "La taille doit être entre 50 et 300 cm" }
    }
    
    return { isValid: true, message: "" }
  }

  const validateGoalWeight = (weight: string): { isValid: boolean; message: string } => {
    if (!weight.trim()) {
      return { isValid: true, message: "" } // Goal weight is optional
    }
    
    const weightNum = parseFloat(weight)
    if (isNaN(weightNum)) {
      return { isValid: false, message: "Veuillez entrer un poids objectif valide" }
    }
    
    if (weightNum <= 0 || weightNum > 999) {
      return { isValid: false, message: "Le poids objectif doit être entre 1 et 999 kg" }
    }
    
    return { isValid: true, message: "" }
  }

  const handleNoteBlur = (note: string) => {
    const noteText = note.trim()
    if (!noteText) {
      return { isValid: false, message: "La note ne peut pas être vide" }
    }
    if (noteText.length < 3) {
      return { isValid: false, message: "La note doit contenir au moins 3 caractères" }
    }
    return { isValid: true, message: "" }
  }

  if (loading && !client) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="px-4 sm:px-6">
          <Alert variant="destructive">
            <AlertDescription>Client non trouvé</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const trend = getWeightTrend()
  const currentWeight = getCurrentWeight()

  return (
    <div className="space-y-6">
      <div className="px-4 sm:px-6 space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux clients
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
              <p className="text-slate-600">{client.email}</p>
            </div>
          </div>
          <Button 
            onClick={() => (editing ? handleSaveClient() : setEditing(true))} 
            disabled={loading}
            className={editing 
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200" 
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
            }
          >
            {editing ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </>
            )}
          </Button>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="mb-6 bg-emerald-50 border-emerald-200 text-emerald-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Poids actuel</CardTitle>
              <Weight className="h-5 w-5 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {currentWeight ? `${currentWeight} kg` : "Non défini"}
              </div>
              {trend && (
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-2">
                  {trend.direction === "up" && <TrendingUp className="h-3 w-3 text-red-500" />}
                  {trend.direction === "down" && <TrendingDown className="h-3 w-3 text-emerald-500" />}
                  {trend.direction === "stable" && <Minus className="h-3 w-3 text-slate-500" />}
                  {trend.amount.toFixed(1)} kg depuis la dernière mesure
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Objectif</CardTitle>
              <Target className="h-5 w-5 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-900">
                {client.goal_weight ? `${client.goal_weight} kg` : "Non défini"}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {client.goal || "Objectif non défini"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Taille</CardTitle>
              <Ruler className="h-5 w-5 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-900">
                {client.height ? `${client.height} cm` : "Non défini"}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {client.age ? `${client.age} ans` : "Âge non défini"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Statut</CardTitle>
              <Activity className="h-5 w-5 text-slate-500" />
            </CardHeader>
            <CardContent>
              <Badge 
                variant={client.status === "active" ? "default" : "secondary"}
                className={client.status === "active" 
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" 
                  : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                }
              >
                {client.status === "active" ? "Actif" : "Inactif"}
              </Badge>
              <p className="text-xs text-slate-600 mt-2">
                Client depuis {new Date(client.created_at).toLocaleDateString("fr-FR")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
            <TabsTrigger 
              value="progress" 
              className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-200 text-slate-600"
            >
              <Activity className="h-4 w-4 mr-2" />
              Progrès
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-200 text-slate-600"
            >
              <User className="h-4 w-4 mr-2" />
              Profil complet
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-200 text-slate-600"
            >
              <FileText className="h-4 w-4 mr-2" />
              Notes privées
            </TabsTrigger>
          </TabsList>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Évolution du poids
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Suivi des changements de poids au fil du temps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          stroke="#94a3b8"
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          stroke="#94a3b8"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: '#10b981' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 mb-2">Aucune donnée de poids disponible</p>
                      <p className="text-sm text-slate-500">Ajoutez une première mesure pour commencer le suivi</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-emerald-600" />
                    Nouvelle mesure
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Enregistrer une nouvelle mesure de poids
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-semibold text-slate-700">Poids (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={newWeight}
                      onChange={(e) => {
                        setNewWeight(e.target.value)
                        if (weightValidation.message) {
                          setWeightValidation({ isValid: true, message: "" })
                        }
                      }}
                      onBlur={() => {
                        if (newWeight) {
                          setWeightValidation(validateWeight(newWeight))
                        }
                      }}
                      placeholder="ex: 68.5"
                      className={`border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 ${
                        !weightValidation.isValid ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : ""
                      }`}
                    />
                    {!weightValidation.isValid && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {weightValidation.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weightNotes" className="text-sm font-semibold text-slate-700">Notes (optionnel)</Label>
                    <Textarea
                      id="weightNotes"
                      value={newWeightNotes}
                      onChange={(e) => setNewWeightNotes(e.target.value)}
                      placeholder="Contexte de la mesure, observations..."
                      rows={3}
                      className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 resize-none"
                    />
                  </div>
                  <Button 
                    onClick={handleAddWeight} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                    disabled={!newWeight || loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {loading ? "Ajout en cours..." : "Ajouter la mesure"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Historique des mesures
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weightEntries.length > 0 ? (
                  <div className="space-y-3">
                    {weightEntries
                      .slice()
                      .reverse()
                      .map((entry, index) => (
                        <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg border border-slate-100 group hover:bg-slate-100/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <span className="text-emerald-700 font-semibold text-sm">#{weightEntries.length - index}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">{entry.weight} kg</span>
                              <div className="text-sm text-slate-600">
                                {new Date(entry.recorded_date).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {entry.notes && (
                              <div className="text-sm text-slate-600 bg-white px-3 py-2 rounded-md border max-w-xs">
                                {entry.notes}
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteWeight(entry.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 mb-2">Aucune mesure enregistrée</p>
                    <p className="text-sm text-slate-500">Commencez le suivi en ajoutant une première mesure</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Informations du client
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Profil complet et informations personnelles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {editing ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Nom complet</Label>
                      <Input
                        id="name"
                        value={editForm.name || ""}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                      {!profileValidation.name.isValid && (
                        <p className="text-red-500 text-sm mt-1">{profileValidation.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email || ""}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                      {!profileValidation.email.isValid && (
                        <p className="text-red-500 text-sm mt-1">{profileValidation.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Téléphone</Label>
                      <Input
                        id="phone"
                        value={editForm.phone || ""}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                      {!profileValidation.phone.isValid && (
                        <p className="text-red-500 text-sm mt-1">{profileValidation.phone.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-sm font-semibold text-slate-700">Âge</Label>
                      <Input
                        id="age"
                        type="number"
                        value={editForm.age || ""}
                        onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || undefined })}
                        className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                      {!profileValidation.age.isValid && (
                        <p className="text-red-500 text-sm mt-1">{profileValidation.age.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height" className="text-sm font-semibold text-slate-700">Taille (cm)</Label>
                      <Input
                        id="height"
                        value={editForm.height || ""}
                        onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                        className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                      {!profileValidation.height.isValid && (
                        <p className="text-red-500 text-sm mt-1">{profileValidation.height.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal" className="text-sm font-semibold text-slate-700">Objectif</Label>
                      <Input
                        id="goal"
                        value={editForm.goal || ""}
                        onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                        className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goalWeight" className="text-sm font-semibold text-slate-700">Poids objectif (kg)</Label>
                      <Input
                        id="goalWeight"
                        type="number"
                        step="0.1"
                        value={editForm.goal_weight || ""}
                        onChange={(e) => setEditForm({ ...editForm, goal_weight: parseFloat(e.target.value) || undefined })}
                        className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                      {!profileValidation.goal_weight.isValid && (
                        <p className="text-red-500 text-sm mt-1">{profileValidation.goal_weight.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentWeight" className="text-sm font-semibold text-slate-700">Poids actuel (kg)</Label>
                      <Input
                        id="currentWeight"
                        type="number"
                        step="0.1"
                        value={editForm.current_weight || ""}
                        onChange={(e) => setEditForm({ ...editForm, current_weight: parseFloat(e.target.value) || undefined })}
                        className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                      {!profileValidation.current_weight.isValid && (
                        <p className="text-red-500 text-sm mt-1">{profileValidation.current_weight.message}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                        <Mail className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Email</p>
                          <p className="text-slate-900">{client.email}</p>
                        </div>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                          <Phone className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">Téléphone</p>
                            <p className="text-slate-900">{client.phone}</p>
                          </div>
                        </div>
                      )}
                      {client.age && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                          <Calendar className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">Âge</p>
                            <p className="text-slate-900">{client.age} ans</p>
                          </div>
                        </div>
                      )}
                      {client.height && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                          <Ruler className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">Taille</p>
                            <p className="text-slate-900">{client.height} cm</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {client.goal && (
                        <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
                          <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Objectif principal
                          </h4>
                          <p className="text-emerald-700">{client.goal}</p>
                        </div>
                      )}
                      {client.goal_weight && (
                        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                            <Weight className="h-4 w-4" />
                            Poids objectif
                          </h4>
                          <p className="text-blue-700">{client.goal_weight} kg</p>
                        </div>
                      )}
                      {currentWeight && (
                        <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                          <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                            <Weight className="h-4 w-4" />
                            Poids actuel
                          </h4>
                          <p className="text-purple-700">{currentWeight} kg</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Notes privées
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Notes personnelles visibles uniquement par vous
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 bg-slate-50/50 rounded-lg border border-slate-100 group hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-slate-900 leading-relaxed">{note.message}</p>
                          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(note.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity ml-3"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <div className="text-center py-12">
                      <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 mb-2">Aucune note ajoutée</p>
                      <p className="text-sm text-slate-500">Ajoutez des notes privées sur ce client</p>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="space-y-3">
                  <Label htmlFor="newNote" className="text-sm font-semibold text-slate-700">Ajouter une note privée</Label>
                  <Textarea
                    id="newNote"
                    value={newNote}
                    onChange={(e) => {
                      setNewNote(e.target.value)
                      if (noteValidation.message) setNoteValidation({ isValid: true, message: "" })
                    }}
                    onBlur={() => {
                      if (newNote) setNoteValidation(handleNoteBlur(newNote))
                    }}
                    placeholder="Observations, recommandations, suivi..."
                    rows={4}
                    className={`border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 resize-none ${!noteValidation.isValid ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : ""}`}
                  />
                  {!noteValidation.isValid && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="text-red-500">⚠</span>
                      {noteValidation.message}
                    </p>
                  )}
                  <Button 
                    onClick={handleAddNote} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                    disabled={!newNote.trim() || loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {loading ? "Ajout en cours..." : "Ajouter la note"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
