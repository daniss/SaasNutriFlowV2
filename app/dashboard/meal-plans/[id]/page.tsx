"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuthNew"
import { generateMealPlanPDF, type MealPlanPDFData } from "@/lib/pdf-generator"
import { supabase, type MealPlan } from "@/lib/supabase"
import {
  Activity,
  ArrowLeft,
  Calendar,
  ChefHat,
  Clock,
  Copy,
  Download,
  Edit,
  FileText,
  Heart,
  MoreHorizontal,
  Share2,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Zap
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface MealPlanWithClient extends MealPlan {
  clients: { id: string; name: string; email: string } | null
}

interface ClientOption {
  id: string
  name: string
  email: string
}

interface DayPlan {
  day: number
  meals: {
    breakfast: string[]
    lunch: string[]
    dinner: string[]
    snacks: string[]
  }
  notes?: string
}

export default function MealPlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [mealPlan, setMealPlan] = useState<MealPlanWithClient | null>(null)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    client_id: "",
    calories_range: "",
    duration_days: "",
    status: ""
  })
  const [duplicateForm, setDuplicateForm] = useState({
    name: "",
    client_id: ""
  })

  useEffect(() => {
    if (user && params.id) {
      fetchMealPlan()
      fetchClients()
    }
  }, [user, params.id])

  const fetchMealPlan = async () => {
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .select(`
          *,
          clients (id, name, email)
        `)
        .eq("id", params.id)
        .eq("dietitian_id", user?.id)
        .single()

      if (error) {
        console.error("Error fetching meal plan:", error)
        router.push("/dashboard/meal-plans")
        return
      }

      setMealPlan(data)
      setEditForm({
        name: data.name,
        description: data.description || "",
        client_id: data.client_id,
        calories_range: data.calories_range || "",
        duration_days: data.duration_days?.toString() || "",
        status: data.status
      })
    } catch (error) {
      console.error("Unexpected error:", error)
      router.push("/dashboard/meal-plans")
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email")
        .eq("dietitian_id", user?.id)
        .eq("status", "active")
        .order("name", { ascending: true })

      if (!error) {
        setClients(data || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const handleDelete = async () => {
    if (!mealPlan) return

    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", mealPlan.id)
        .eq("dietitian_id", user?.id)

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le plan alimentaire. Veuillez réessayer.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Succès",
        description: "Plan alimentaire supprimé avec succès."
      })
      router.push("/dashboard/meal-plans")
    } catch (error) {
      console.error("Error deleting meal plan:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le plan alimentaire. Veuillez réessayer.",
        variant: "destructive"
      })
    }
  }

  const handleEdit = async () => {
    if (!mealPlan || !editForm.name || !editForm.client_id) return

    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .update({
          name: editForm.name,
          description: editForm.description || null,
          client_id: editForm.client_id,
          calories_range: editForm.calories_range || null,
          duration_days: editForm.duration_days ? parseInt(editForm.duration_days) : null,
          status: editForm.status,
          updated_at: new Date().toISOString()
        })
        .eq("id", mealPlan.id)
        .eq("dietitian_id", user?.id)
        .select(`
          *,
          clients (id, name, email)
        `)
        .single()

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le plan alimentaire. Veuillez réessayer.",
          variant: "destructive"
        })
        return
      }

      setMealPlan(data)
      setIsEditOpen(false)
      toast({
        title: "Succès",
        description: "Plan alimentaire mis à jour avec succès."
      })
    } catch (error) {
      console.error("Error updating meal plan:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le plan alimentaire. Veuillez réessayer.",
        variant: "destructive"
      })
    }
  }

  const handleExportPDF = () => {
    if (!mealPlan) return

    const dayPlans = generateSampleDays(mealPlan.duration_days || 7)
    
    const pdfData: MealPlanPDFData = {
      id: mealPlan.id,
      name: mealPlan.name,
      description: mealPlan.description || undefined,
      clientName: mealPlan.clients?.name || "Client inconnu",
      clientEmail: mealPlan.clients?.email || "",
      duration_days: mealPlan.duration_days || 7,
      calories_range: mealPlan.calories_range || undefined,
      status: mealPlan.status,
      created_at: mealPlan.created_at,
      dayPlans: dayPlans
    }

    generateMealPlanPDF(pdfData)
    
    toast({
      title: "PDF généré",
      description: "Le plan alimentaire a été exporté en PDF avec succès."
    })
  }

  const handleDuplicate = async () => {
    if (!mealPlan || !duplicateForm.name || !duplicateForm.client_id) return

    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .insert({
          dietitian_id: user?.id,
          client_id: duplicateForm.client_id,
          name: duplicateForm.name,
          description: mealPlan.description,
          plan_content: mealPlan.plan_content,
          calories_range: mealPlan.calories_range,
          duration_days: mealPlan.duration_days,
          status: "active"
        })
        .select()
        .single()

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de dupliquer le plan alimentaire. Veuillez réessayer.",
          variant: "destructive"
        })
        return
      }

      setIsDuplicateOpen(false)
      toast({
        title: "Succès",
        description: "Plan alimentaire dupliqué avec succès."
      })
      router.push(`/dashboard/meal-plans/${data.id}`)
    } catch (error) {
      console.error("Error duplicating meal plan:", error)
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer le plan alimentaire. Veuillez réessayer.",
        variant: "destructive"
      })
    }
  }

  const getPlanTypeIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('weight') || lowerName.includes('loss')) return Target
    if (lowerName.includes('muscle') || lowerName.includes('gain')) return TrendingUp
    if (lowerName.includes('heart') || lowerName.includes('cardio')) return Heart
    if (lowerName.includes('detox') || lowerName.includes('cleanse')) return Activity
    return ChefHat
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "paused":
        return "bg-amber-50 text-amber-700 border-amber-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Actif"
      case "completed":
        return "Terminé"
      case "paused":
        return "En pause"
      default:
        return status
    }
  }

  const generateSampleDays = (duration: number): DayPlan[] => {
    const sampleMeals = {
      breakfast: [
        "Yaourt grec aux baies et granola",
        "Flocons d'avoine à la banane et aux amandes",
        "Toast à l'avocat et œuf poché",
        "Smoothie bowl aux épinards et fruits",
        "Céréales complètes au lait"
      ],
      lunch: [
        "Salade de poulet grillé au quinoa",
        "Wrap méditerranéen au houmous",
        "Soupe de lentilles et pain complet",
        "Buddha bowl au tofu et légumes",
        "Sandwich dinde et avocat"
      ],
      dinner: [
        "Saumon grillé aux légumes rôtis",
        "Sauté de bœuf maigre au riz brun",
        "Pâtes végétariennes à la marinara",
        "Poulet grillé à la patate douce",
        "Tacos de poisson aux haricots noirs"
      ],
      snacks: [
        "Tranches de pomme au beurre d'amande",
        "Mélange de noix et fruits secs",
        "Yaourt grec au miel",
        "Houmous aux bâtonnets de légumes",
        "Smoothie protéiné"
      ]
    }

    return Array.from({ length: duration }, (_, index) => ({
      day: index + 1,
      meals: {
        breakfast: [sampleMeals.breakfast[index % sampleMeals.breakfast.length]],
        lunch: [sampleMeals.lunch[index % sampleMeals.lunch.length]],
        dinner: [sampleMeals.dinner[index % sampleMeals.dinner.length]],
        snacks: [sampleMeals.snacks[index % sampleMeals.snacks.length]]
      },
      notes: index === 0 ? "Commencer avec des portions plus légères et ajuster au besoin" : undefined
    }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="px-4 sm:px-6">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
              <div className="h-8 bg-slate-200 rounded w-48"></div>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-slate-200 rounded-xl"></div>
                <div className="h-96 bg-slate-200 rounded-xl"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-slate-200 rounded-xl"></div>
                <div className="h-32 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!mealPlan) {
    return (
      <div className="space-y-6">
        <div className="px-4 sm:px-6">
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Plan alimentaire introuvable</h1>
            <p className="text-slate-600 mb-6">Le plan alimentaire que vous recherchez n'existe pas ou vous n'y avez pas accès.</p>
            <Button onClick={() => router.push("/dashboard/meal-plans")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux plans alimentaires
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const IconComponent = getPlanTypeIcon(mealPlan.name)
  const dayPlans = generateSampleDays(mealPlan.duration_days || 7)

  return (
    <div className="space-y-6">
      <div className="px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/meal-plans")}
              className="h-10 w-10 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <IconComponent className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{mealPlan.name}</h1>
                <p className="text-slate-600">Pour {mealPlan.clients?.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={`${getStatusColor(mealPlan.status)} border font-medium px-3 py-1.5`}>
              {getStatusText(mealPlan.status)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-lg">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="rounded-md">
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier le plan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setDuplicateForm({
                    name: `${mealPlan.name} (Copie)`,
                    client_id: mealPlan.client_id
                  })
                  setIsDuplicateOpen(true)
                }} className="rounded-md">
                  <Copy className="mr-2 h-4 w-4" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-md">
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager le plan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="rounded-md">
                  <Download className="mr-2 h-4 w-4" />
                  Exporter en PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer le plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Plan Overview */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  Aperçu du plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {mealPlan.description && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                    <p className="text-slate-600 leading-relaxed">{mealPlan.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50/80 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-500">Durée</span>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">{mealPlan.duration_days} jours</span>
                  </div>

                  {mealPlan.calories_range && (
                    <div className="bg-slate-50/80 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-500">Calories</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900">{mealPlan.calories_range}</span>
                    </div>
                  )}

                  <div className="bg-slate-50/80 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-500">Créé le</span>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">
                      {new Date(mealPlan.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div className="bg-slate-50/80 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-500">Statut</span>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">{getStatusText(mealPlan.status)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Meal Plans */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-slate-600" />
                  Plans repas quotidiens
                </CardTitle>
                <CardDescription>
                  Détail des repas pour chaque jour du plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {dayPlans.map((day) => (
                    <div key={day.day} className="border border-slate-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Jour {day.day}</h3>
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier le jour
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                            <div className="h-2 w-2 bg-orange-400 rounded-full"></div>
                            Petit-déjeuner
                          </h4>
                          <ul className="space-y-1 text-sm text-slate-600 ml-4">
                            {day.meals.breakfast.map((meal, idx) => (
                              <li key={idx}>• {meal}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                            <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                            Déjeuner
                          </h4>
                          <ul className="space-y-1 text-sm text-slate-600 ml-4">
                            {day.meals.lunch.map((meal, idx) => (
                              <li key={idx}>• {meal}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                            <div className="h-2 w-2 bg-purple-400 rounded-full"></div>
                            Dîner
                          </h4>
                          <ul className="space-y-1 text-sm text-slate-600 ml-4">
                            {day.meals.dinner.map((meal, idx) => (
                              <li key={idx}>• {meal}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                            <div className="h-2 w-2 bg-emerald-400 rounded-full"></div>
                            Collations
                          </h4>
                          <ul className="space-y-1 text-sm text-slate-600 ml-4">
                            {day.meals.snacks.map((meal, idx) => (
                              <li key={idx}>• {meal}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {day.notes && (
                        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800">
                            <strong>Note :</strong> {day.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-slate-600" />
                  Informations client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Nom</p>
                    <p className="font-semibold text-slate-900">{mealPlan.clients?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Email</p>
                    <p className="text-sm text-slate-600">{mealPlan.clients?.email}</p>
                  </div>
                  <Separator />
                  <Button variant="outline" size="sm" className="w-full">
                    Voir le profil client
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager avec le client
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter en PDF
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Copy className="mr-2 h-4 w-4" />
                  Créer un modèle
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[540px] rounded-xl">
            <DialogHeader>
              <DialogTitle>Modifier le plan alimentaire</DialogTitle>
              <DialogDescription>
                Mettre à jour les détails et paramètres du plan alimentaire.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom du plan *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-client">Client *</Label>
                <Select value={editForm.client_id} onValueChange={(value: string) => setEditForm({ ...editForm, client_id: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
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
                  <Label htmlFor="edit-calories">Gamme de calories</Label>
                  <Input
                    id="edit-calories"
                    value={editForm.calories_range}
                    onChange={(e) => setEditForm({ ...editForm, calories_range: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Durée (jours)</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    value={editForm.duration_days}
                    onChange={(e) => setEditForm({ ...editForm, duration_days: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Statut</Label>
                <Select value={editForm.status} onValueChange={(value: string) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="paused">En pause</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleEdit}>
                Enregistrer les modifications
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Duplicate Dialog */}
        <Dialog open={isDuplicateOpen} onOpenChange={setIsDuplicateOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-xl">
            <DialogHeader>
              <DialogTitle>Dupliquer le plan alimentaire</DialogTitle>
              <DialogDescription>
                Créer une copie de ce plan alimentaire pour un autre client ou avec un nom différent.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="duplicate-name">Nom du nouveau plan *</Label>
                <Input
                  id="duplicate-name"
                  value={duplicateForm.name}
                  onChange={(e) => setDuplicateForm({ ...duplicateForm, name: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duplicate-client">Client *</Label>
                <Select value={duplicateForm.client_id} onValueChange={(value: string) => setDuplicateForm({ ...duplicateForm, client_id: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDuplicateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleDuplicate}>
                Créer la copie
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le plan alimentaire</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer "{mealPlan.name}" ? Cette action ne peut pas être annulée et supprimera définitivement le plan alimentaire et toutes les données associées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Supprimer le plan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
