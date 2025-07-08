"use client"

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
import { useAuth } from "@/hooks/useAuthNew"
import { Bell, Calendar, CalendarDays, Download, MessageCircle, Settings, Target, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface ClientPortalData {
  profile: {
    name: string
    email: string
    phone?: string
    birthDate?: string
    goals: string[]
    allergies: string[]
    preferences: string[]
  }
  currentPlan: {
    name: string
    description: string
    startDate: string
    duration: number
    progress: number
    nextMeal: string
  } | null
  weightProgress: Array<{ date: string; weight: number }>
  appointments: Array<{
    id: string
    date: string
    time: string
    type: string
    status: string
    notes?: string
  }>
  messages: Array<{
    id: string
    content: string
    sender: 'client' | 'dietitian'
    timestamp: string
    read: boolean
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    achieved: boolean
    date?: string
  }>
}

export default function ClientPortalPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [portalData, setPortalData] = useState<ClientPortalData | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [newWeight, setNewWeight] = useState("")
  const [weightNote, setWeightNote] = useState("")

  useEffect(() => {
    if (user) {
      fetchClientPortalData()
    }
  }, [user])

  const fetchClientPortalData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // In a real implementation, this would fetch data for the specific client
      // For demo purposes, we'll use mock data
      const mockData: ClientPortalData = {
        profile: {
          name: "Marie Dubois",
          email: "marie.dubois@email.com",
          phone: "+33 1 23 45 67 89",
          birthDate: "1985-03-15",
          goals: ["Perte de poids", "Amélioration de l'énergie", "Santé digestive"],
          allergies: ["Gluten", "Fruits à coque"],
          preferences: ["Végétarien", "Bio", "Local"]
        },
        currentPlan: {
          name: "Plan Méditerranéen - Perte de Poids",
          description: "Un plan alimentaire équilibré inspiré du régime méditerranéen, adapté à vos objectifs de perte de poids.",
          startDate: "2024-01-15",
          duration: 30,
          progress: 65,
          nextMeal: "Déjeuner: Salade de quinoa aux légumes grillés"
        },
        weightProgress: [
          { date: "2024-01-01", weight: 75 },
          { date: "2024-01-08", weight: 74.5 },
          { date: "2024-01-15", weight: 74.2 },
          { date: "2024-01-22", weight: 73.8 },
          { date: "2024-01-29", weight: 73.5 },
          { date: "2024-02-05", weight: 73.0 },
        ],
        appointments: [
          {
            id: "1",
            date: "2024-02-15",
            time: "14:00",
            type: "Consultation de suivi",
            status: "confirmed",
            notes: "Bilan mensuel et ajustements du plan"
          },
          {
            id: "2",
            date: "2024-02-01",
            time: "10:30",
            type: "Consultation initiale",
            status: "completed",
            notes: "Première consultation - établissement du plan"
          }
        ],
        messages: [
          {
            id: "1",
            content: "Comment vous sentez-vous avec le nouveau plan alimentaire ?",
            sender: "dietitian",
            timestamp: "2024-02-10T10:00:00Z",
            read: true
          },
          {
            id: "2",
            content: "Je me sens beaucoup mieux ! J'ai plus d'énergie et moins de fringales.",
            sender: "client",
            timestamp: "2024-02-10T14:30:00Z",
            read: true
          },
          {
            id: "3",
            content: "Excellente nouvelle ! Continuez comme ça. N'hésitez pas si vous avez des questions.",
            sender: "dietitian",
            timestamp: "2024-02-10T16:00:00Z",
            read: false
          }
        ],
        achievements: [
          {
            id: "1",
            title: "Premier objectif atteint",
            description: "Vous avez perdu vos premiers 2kg !",
            achieved: true,
            date: "2024-01-29"
          },
          {
            id: "2",
            title: "Consistance alimentaire",
            description: "Suivez votre plan 7 jours consécutifs",
            achieved: true,
            date: "2024-02-05"
          },
          {
            id: "3",
            title: "Hydratation optimale",
            description: "Buvez 2L d'eau par jour pendant une semaine",
            achieved: false
          }
        ]
      }

      setPortalData(mockData)
    } catch (error) {
      console.error("Error fetching portal data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWeightUpdate = async () => {
    if (!newWeight || !user) return

    try {
      // In real implementation, this would save to the database
      console.log("Updating weight:", { weight: parseFloat(newWeight), note: weightNote })
      
      toast({
        title: "Poids mis à jour",
        description: "Votre nouveau poids a été enregistré avec succès"
      })
      
      setNewWeight("")
      setWeightNote("")
      
      // Refresh data
      fetchClientPortalData()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>{portalData?.profile.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bonjour, {portalData?.profile.name}</h1>
                <p className="text-gray-600">Votre espace personnel NutriFlow</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-white">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="plan">Mon Plan</TabsTrigger>
            <TabsTrigger value="progress">Progrès</TabsTrigger>
            <TabsTrigger value="appointments">Rendez-vous</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Progrès du plan</p>
                      <p className="text-3xl font-bold">{portalData?.currentPlan?.progress}%</p>
                    </div>
                    <Target className="h-8 w-8 text-green-200" />
                  </div>
                  <div className="mt-4">
                    <Progress value={portalData?.currentPlan?.progress} className="bg-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Poids actuel</p>
                      <p className="text-3xl font-bold">{portalData?.weightProgress[portalData.weightProgress.length - 1]?.weight} kg</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-200" />
                  </div>
                  <p className="text-blue-100 text-sm mt-2">
                    -2kg depuis le début
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Objectifs atteints</p>
                      <p className="text-3xl font-bold">
                        {portalData?.achievements.filter(a => a.achieved).length}/{portalData?.achievements.length}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Plan Overview */}
            {portalData?.currentPlan && (
              <Card>
                <CardHeader>
                  <CardTitle>Plan Alimentaire Actuel</CardTitle>
                  <CardDescription>{portalData.currentPlan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Prochain repas</Label>
                      <p className="text-lg font-semibold text-gray-900">{portalData.currentPlan.nextMeal}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={downloadMealPlan} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger le plan
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Poser une question
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Vos Réussites</CardTitle>
                <CardDescription>Célébrez vos victoires, grandes et petites</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {portalData?.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border ${
                        achievement.achieved 
                          ? "bg-green-50 border-green-200" 
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                        achievement.achieved ? "bg-green-500 text-white" : "bg-gray-300"
                      }`}>
                        {achievement.achieved && "✓"}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        {achievement.achieved && achievement.date && (
                          <p className="text-xs text-green-600 mt-1">
                            Atteint le {new Date(achievement.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan" className="space-y-6">
            {portalData?.currentPlan && (
              <Card>
                <CardHeader>
                  <CardTitle>{portalData.currentPlan.name}</CardTitle>
                  <CardDescription>{portalData.currentPlan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <CalendarDays className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{portalData.currentPlan.duration}</p>
                      <p className="text-sm text-blue-600">jours</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{portalData.currentPlan.progress}%</p>
                      <p className="text-sm text-green-600">terminé</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">-2kg</p>
                      <p className="text-sm text-purple-600">progrès</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Plan de la semaine</h4>
                    <div className="grid gap-3">
                      {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day, index) => (
                        <div key={day} className="p-4 border rounded-lg">
                          <h5 className="font-medium mb-2">{day}</h5>
                          <div className="grid gap-2 text-sm">
                            <div><strong>Petit-déjeuner:</strong> Avoine aux fruits rouges</div>
                            <div><strong>Déjeuner:</strong> Salade de quinoa aux légumes</div>
                            <div><strong>Dîner:</strong> Saumon grillé aux légumes verts</div>
                            <div><strong>Collation:</strong> Yaourt grec aux noix</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={downloadMealPlan} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le plan complet
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            {/* Weight Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution du Poids</CardTitle>
                <CardDescription>Suivez vos progrès au fil du temps</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={portalData?.weightProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weight Update Form */}
            <Card>
              <CardHeader>
                <CardTitle>Mettre à jour mon poids</CardTitle>
                <CardDescription>Enregistrez votre poids pour suivre vos progrès</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Poids (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="ex: 72.5"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note (optionnel)</Label>
                    <Input
                      id="note"
                      placeholder="Comment vous sentez-vous ?"
                      value={weightNote}
                      onChange={(e) => setWeightNote(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleWeightUpdate} disabled={!newWeight}>
                  Enregistrer
                </Button>
              </CardContent>
            </Card>

            {/* Progress Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Résumé des Progrès</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Poids de départ</span>
                      <span className="font-semibold">75 kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Poids actuel</span>
                      <span className="font-semibold">73 kg</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Perte totale</span>
                      <span className="font-semibold">-2 kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Objectif</span>
                      <span className="font-semibold">70 kg</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>Restant à perdre</span>
                      <span className="font-semibold">3 kg</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Progrès vers l'objectif</span>
                        <span className="text-sm">40%</span>
                      </div>
                      <Progress value={40} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Suivi du plan</span>
                        <span className="text-sm">85%</span>
                      </div>
                      <Progress value={85} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Activité physique</span>
                        <span className="text-sm">70%</span>
                      </div>
                      <Progress value={70} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mes Rendez-vous</CardTitle>
                <CardDescription>Consultations passées et à venir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portalData?.appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {new Date(appointment.date).getDate()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(appointment.date).toLocaleDateString('fr-FR', { month: 'short' })}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium">{appointment.type}</h4>
                          <p className="text-sm text-gray-600">
                            {appointment.time} - {appointment.notes}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          appointment.status === "confirmed" ? "default" :
                          appointment.status === "completed" ? "secondary" : "outline"
                        }
                      >
                        {appointment.status === "confirmed" ? "Confirmé" :
                         appointment.status === "completed" ? "Terminé" : "En attente"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  Prendre rendez-vous
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages avec votre diététicien</CardTitle>
                <CardDescription>Communication directe et support personnalisé</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {portalData?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.sender === 'client'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'client' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Textarea 
                    placeholder="Écrivez votre message..."
                    className="flex-1"
                    rows={2}
                  />
                  <Button>
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
