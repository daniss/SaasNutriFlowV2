"use client"

import { ClientProtectedRoute } from "@/components/auth/ClientProtectedRoute"
import { useClientAuth } from "@/components/auth/ClientAuthProvider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Bell, Calendar, CalendarDays, Download, MessageCircle, Settings, Target, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface ClientPortalData {
  profile: {
    name: string
    email: string
    phone?: string
    age?: number
    height?: number
    currentWeight?: number
    goalWeight?: number
    goal?: string
    planType?: string
    joinDate?: string
    progress?: number
  }
  currentPlan: {
    id: string
    name: string
    description: string
    caloriesRange?: string
    duration: number
    status: string
    content?: any
  } | null
  weightHistory: Array<{ date: string; weight: number; notes?: string }>
  appointments: Array<{
    id: string
    title: string
    date: string
    time: string
    type: string
    status: string
    location?: string
    isVirtual?: boolean
    meetingLink?: string
    notes?: string
  }>
  messages: Array<{
    id: string
    content: string
    sender: 'client' | 'dietitian'
    timestamp: string
    read: boolean
  }>
}

function ClientPortalContent() {
  const { client: sessionClient, logout, isAuthenticated } = useClientAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [portalData, setPortalData] = useState<ClientPortalData | null>(null)
  const [newWeight, setNewWeight] = useState("")
  const [weightNote, setWeightNote] = useState("")

  // Load client data on component mount
  useEffect(() => {
    const loadClientData = async () => {
      try {
        setLoading(true)
        
        const clientResponse = await fetch(`/api/client-auth/data?clientId=${sessionClient!.id}`, {
          credentials: 'include'
        })
        
        if (clientResponse.ok) {
          const response = await clientResponse.json()
          if (response.success && response.data) {
            setClient(response.data.profile)
            setPortalData(response.data)
          } else {
            console.error('Invalid response format:', response)
          }
        } else {
          console.error('Failed to fetch client data')
        }
      } catch (error) {
        console.error('Error loading client data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (sessionClient?.id) {
      loadClientData()
    }
  }, [sessionClient])

  const fetchClientPortalData = async () => {
    try {
      setLoading(true)
      
      const clientResponse = await fetch(`/api/client-auth/data?clientId=${sessionClient?.id}`, {
        credentials: 'include'
      })
      
      if (clientResponse.ok) {
        const response = await clientResponse.json()
        if (response.success && response.data) {
          setClient(response.data.profile)
          setPortalData(response.data)
        } else {
          console.error('Invalid response format:', response)
        }
      } else {
        console.error('Failed to fetch client data')
      }
    } catch (error) {
      console.error('Error fetching client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWeightUpdate = async () => {
    if (!newWeight || !sessionClient) return

    try {
      const response = await fetch('/api/client-auth/weight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          clientId: sessionClient.id,
          weight: parseFloat(newWeight),
          notes: weightNote || undefined
        })
      })

      if (response.ok) {
        const weightValue = parseFloat(newWeight)
        const today = new Date().toISOString().split('T')[0]
        
        // Update the local state immediately for better UX
        if (portalData) {
          const newWeightEntry = {
            date: today,
            weight: weightValue,
            notes: weightNote || undefined
          }
          
          // Update weight history
          const updatedWeightHistory = [...portalData.weightHistory, newWeightEntry]
          
          // Update current weight in profile
          const updatedProfile = {
            ...portalData.profile,
            currentWeight: weightValue
          }
          
          // Update the portal data with new weight info
          setPortalData({
            ...portalData,
            weightHistory: updatedWeightHistory,
            profile: updatedProfile
          })
          
          // Also update the client state
          setClient(updatedProfile)
        }
        
        toast({
          title: "Poids mis à jour",
          description: "Votre nouveau poids a été enregistré avec succès"
        })
        
        setNewWeight("")
        setWeightNote("")
      } else {
        throw new Error('Failed to update weight')
      }
    } catch (error) {
      console.error("Error updating weight:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre poids",
        variant: "destructive"
      })
    }
  }

  const downloadMealPlan = () => {
    // In real implementation, this would generate and download the meal plan PDF
    toast({
      title: "Téléchargement démarré",
      description: "Votre plan alimentaire est en cours de téléchargement"
    })
  }

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
    )
  }

  if (!portalData || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Aucune donnée disponible</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                {portalData.profile.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Bonjour, {portalData.profile.name}
              </h1>
              <p className="text-sm text-gray-600">Votre espace personnel NutriFlow</p>
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
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-600">
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-6">
        {/* Navigation Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="meal-plan" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              Mon Plan
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              Progrès
            </TabsTrigger>
            <TabsTrigger value="appointments" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              Rendez-vous
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Progrès du plan</p>
                      <p className="text-3xl font-bold">{portalData.profile.progress || 0}%</p>
                    </div>
                    <Target className="h-8 w-8 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Poids actuel</p>
                      <p className="text-3xl font-bold">
                        {portalData.profile.currentWeight || 'N/A'} kg
                      </p>
                      {portalData.weightHistory.length > 0 && (
                        <p className="text-blue-200 text-xs">
                          -2kg depuis le début
                        </p>
                      )}
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Objectifs atteints</p>
                      <p className="text-3xl font-bold">2/3</p>
                    </div>
                    <Badge className="bg-purple-400 text-purple-900 border-0">
                      Excellent
                    </Badge>
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
                      <CardTitle className="text-xl text-emerald-800">Plan Alimentaire Actuel</CardTitle>
                      <CardDescription className="text-emerald-600">
                        {portalData.currentPlan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Progression</span>
                            <span className="text-sm text-emerald-600 font-medium">{portalData.profile.progress || 0}%</span>
                          </div>
                          <Progress value={portalData.profile.progress || 0} className="h-2 bg-gray-100" />
                        </div>
                        
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-emerald-800">Prochain repas</h4>
                              <p className="text-emerald-700">Déjeuner: Salade de quinoa aux légumes grillés</p>
                            </div>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger le plan
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Poser une question
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Achievements */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                    <CardTitle className="text-xl text-amber-800">Vos Réussites</CardTitle>
                    <CardDescription className="text-amber-600">
                      Célébrez vos victoires, grandes et petites
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                          <div className="flex-1">
                            <h4 className="font-medium text-green-800">Premier objectif atteint</h4>
                            <p className="text-sm text-green-700">Vous avez perdu vos premiers 2kg !</p>
                            <p className="text-xs text-green-600 mt-1">Atteint le 29/01/2024</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                          <div className="flex-1">
                            <h4 className="font-medium text-green-800">Consistance alimentaire</h4>
                            <p className="text-sm text-green-700">Suivez votre plan 7 jours consécutifs</p>
                            <p className="text-xs text-green-600 mt-1">Atteint le 05/02/2024</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-gray-300" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-600">Hydratation optimale</h4>
                            <p className="text-sm text-gray-600">Buvez 2L d'eau par jour pendant une semaine</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Weight Chart */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Évolution du Poids</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {portalData.weightHistory.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={portalData.weightHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            fontSize={12}
                          />
                          <YAxis domain={['dataMin - 1', 'dataMax + 1']} fontSize={12} />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value) => [`${value} kg`, 'Poids']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
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
                      <span className="text-sm text-gray-600">Poids actuel</span>
                      <Badge variant="secondary">
                        {portalData.profile.currentWeight || 'N/A'} kg
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Objectif</span>
                      <Badge variant="outline">
                        {portalData.profile.goalWeight || 'N/A'} kg
                      </Badge>
                    </div>
                    {portalData.profile.age && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Âge</span>
                        <Badge variant="secondary">{portalData.profile.age} ans</Badge>
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
                    <CardTitle className="text-xl text-emerald-800">Plan Alimentaire</CardTitle>
                    <CardDescription className="text-emerald-600">
                      Votre programme nutritionnel personnalisé
                    </CardDescription>
                  </div>
                  <Button onClick={downloadMealPlan} className="bg-emerald-600 hover:bg-emerald-700">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {portalData.currentPlan ? (
                  <div className="space-y-6">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                      <h3 className="font-semibold text-lg text-emerald-800 mb-2">{portalData.currentPlan.name}</h3>
                      <p className="text-emerald-700 mb-4">{portalData.currentPlan.description}</p>
                      <div className="text-sm text-emerald-600">
                        Plan: {portalData.currentPlan.name} • 
                        Durée: {portalData.currentPlan.duration} jours
                      </div>
                    </div>
                    
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">Détails des repas</h3>
                      <p>Le détail de vos repas quotidiens sera bientôt disponible ici.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Aucun plan assigné</h3>
                    <p>Votre diététicien vous assignera bientôt un plan alimentaire personnalisé.</p>
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
                  <CardTitle className="text-xl text-blue-800">Suivi du Poids</CardTitle>
                  <CardDescription className="text-blue-600">
                    Enregistrez votre poids pour suivre votre progression
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="weight" className="text-sm font-medium">Nouveau poids (kg)</Label>
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
                        <Label htmlFor="note" className="text-sm font-medium">Note (optionnelle)</Label>
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
                    <Button onClick={handleWeightUpdate} className="w-full bg-blue-600 hover:bg-blue-700">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Enregistrer le poids
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Weight Chart */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Graphique d'évolution</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {portalData.weightHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={portalData.weightHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          fontSize={12}
                        />
                        <YAxis domain={['dataMin - 1', 'dataMax + 1']} fontSize={12} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value) => [`${value} kg`, 'Poids']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">Commencer le suivi</h3>
                      <p>Enregistrez votre premier poids pour voir votre progression</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Progress Summary */}
              <Card className="lg:col-span-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                  <CardTitle className="text-xl text-emerald-800">Résumé de progression</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-emerald-600 mb-4">
                      {portalData.profile.progress || 0}%
                    </div>
                    <p className="text-lg text-gray-600 mb-6">Progression vers votre objectif</p>
                    <div className="grid gap-4 md:grid-cols-3 text-center">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">
                          {portalData.profile.currentWeight || 'N/A'} kg
                        </div>
                        <div className="text-sm text-blue-600">Poids actuel</div>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-emerald-600">
                          {portalData.profile.goalWeight || 'N/A'} kg
                        </div>
                        <div className="text-sm text-emerald-600">Objectif</div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-amber-600">
                          {portalData.weightHistory.length}
                        </div>
                        <div className="text-sm text-amber-600">Mesures enregistrées</div>
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
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{appointment.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(appointment.date).toLocaleDateString()} à {appointment.time}
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-gray-500 mt-2">{appointment.notes}</p>
                          )}
                        </div>
                        <Badge
                          variant={
                            appointment.status === 'confirmed' ? 'default' :
                            appointment.status === 'completed' ? 'secondary' :
                            'outline'
                          }
                          className={
                            appointment.status === 'confirmed' ? 'bg-emerald-500 text-white' :
                            appointment.status === 'completed' ? 'bg-gray-500 text-white' :
                            ''
                          }
                        >
                          {appointment.status === 'confirmed' ? 'Confirmé' :
                           appointment.status === 'completed' ? 'Terminé' :
                           appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {portalData.appointments.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">Aucun rendez-vous</h3>
                      <p>Vos prochains rendez-vous apparaîtront ici.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-8">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="text-xl text-purple-800 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Messages avec votre diététicien
                </CardTitle>
                <CardDescription className="text-purple-600">
                  Échangez avec votre professionnel de santé
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
                  {portalData.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-lg shadow-sm ${
                          message.sender === 'client'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="mb-2">{message.content}</p>
                        <p className={`text-xs ${
                          message.sender === 'client' ? 'text-emerald-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {portalData.messages.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">Aucun message</h3>
                      <p>Vos conversations avec votre diététicien apparaîtront ici.</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Textarea 
                    placeholder="Écrivez votre message..."
                    className="flex-1 resize-none"
                    rows={3}
                  />
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <MessageCircle className="h-4 w-4" />
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

export default function ClientPortalPage() {
  return (
    <ClientProtectedRoute>
      <ClientPortalContent />
    </ClientProtectedRoute>
  )
}
