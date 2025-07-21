"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getStatusDisplay, getStatusVariant } from "@/lib/status"
import { DashboardSkeleton, GridSkeleton } from "@/components/shared/skeletons"
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
import { 
  Plus, 
  FileText, 
  Calendar, 
  Users, 
  Clock,
  TrendingUp,
  Zap,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Activity,
  Target,
  ChefHat,
  BarChart3,
  User,
  Sparkles,
  BookOpen,
  Heart,
  Filter
} from "lucide-react"
import { useAuth } from "@/hooks/useAuthNew"
import { supabase, type MealPlan } from "@/lib/supabase"
import { DynamicMealPlan, DynamicMealPlanDay, MealSlot, generateMealId } from "@/lib/meal-plan-types"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
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
import { toast } from "@/hooks/use-toast"
import { DashboardHeader } from "@/components/dashboard-header"
import TemplateSelectionDialog from "@/components/meal-plans/TemplateSelectionDialog"
import Link from "next/link"

interface MealPlanWithClient extends MealPlan {
  clients: { name: string } | null
  meal_plan_templates: { name: string } | null
}

interface ClientOption {
  id: string
  name: string
}

interface StatsData {
  totalPlans: number
  activePlans: number
  clientsServed: number
  plansThisMonth: number
}

export default function MealPlansPage() {
  const { user } = useAuth()
  const [mealPlans, setMealPlans] = useState<MealPlanWithClient[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<MealPlanWithClient | null>(null)
  const [stats, setStats] = useState<StatsData>({
    totalPlans: 0,
    activePlans: 0,
    clientsServed: 0,
    plansThisMonth: 0
  })
  const [newMealPlan, setNewMealPlan] = useState({
    name: "",
    description: "",
    client_id: "",
    calories_range: "",
    duration_days: "",
    plan_content: {},
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch meal plans with client names and template info
      const { data: mealPlanData, error: mealPlanError } = await supabase
        .from("meal_plans")
        .select(`
          *,
          clients (name),
          meal_plan_templates (name)
        `)
        .eq("dietitian_id", user.id)
        .order("created_at", { ascending: false })

      if (mealPlanError) {
        console.error("❌ Error fetching meal plans:", mealPlanError)
        throw mealPlanError
      } else {
        setMealPlans(mealPlanData || [])
        
        // Calculate stats
        const totalPlans = mealPlanData?.length || 0
        const activePlans = mealPlanData?.filter(plan => plan.status === 'active').length || 0
        const uniqueClients = new Set(mealPlanData?.map(plan => plan.client_id)).size
        const thisMonth = new Date()
        thisMonth.setDate(1)
        const plansThisMonth = mealPlanData?.filter(plan => 
          new Date(plan.created_at || '') >= thisMonth
        ).length || 0

        setStats({
          totalPlans,
          activePlans,
          clientsServed: uniqueClients,
          plansThisMonth
        })
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
        throw clientError
      } else {
        setClients(clientData || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMealPlan = async () => {
    if (!user || !newMealPlan.name || !newMealPlan.client_id) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    try {
      // Create dynamic meal plan structure with default 3 meals
      const defaultMeals: MealSlot[] = [
        {
          id: generateMealId(1, 'Petit-déjeuner'),
          name: 'Petit-déjeuner',
          time: '08:00',
          description: '',
          enabled: true,
          order: 0
        },
        {
          id: generateMealId(1, 'Déjeuner'),
          name: 'Déjeuner',
          time: '12:00',
          description: '',
          enabled: true,
          order: 1
        },
        {
          id: generateMealId(1, 'Dîner'),
          name: 'Dîner',
          time: '19:00',
          description: '',
          enabled: true,
          order: 2
        }
      ]

      const defaultDay: DynamicMealPlanDay = {
        day: 1,
        date: new Date().toISOString().split('T')[0],
        meals: defaultMeals,
        notes: ""
      }

      const dynamicPlanContent: DynamicMealPlan = {
        days: [defaultDay],
        generated_by: 'manual',
        notes: newMealPlan.description || ""
      }

      const { data, error } = await supabase
        .from("meal_plans")
        .insert({
          ...newMealPlan,
          dietitian_id: user.id,
          duration_days: parseInt(newMealPlan.duration_days) || null,
          status: "draft",
          plan_content: dynamicPlanContent
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Succès",
        description: "Plan alimentaire créé avec succès"
      })

      setIsAddDialogOpen(false)
      setNewMealPlan({
        name: "",
        description: "",
        client_id: "",
        calories_range: "",
        duration_days: "",
        plan_content: {},
      })
      
      fetchData()
    } catch (error) {
      console.error("Error creating meal plan:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le plan alimentaire",
        variant: "destructive"
      })
    }
  }

  const handleDeleteMealPlan = async () => {
    if (!planToDelete) return

    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", planToDelete.id)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Plan alimentaire supprimé avec succès"
      })

      setDeleteDialogOpen(false)
      setPlanToDelete(null)
      fetchData()
    } catch (error) {
      console.error("Error deleting meal plan:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le plan alimentaire",
        variant: "destructive"
      })
    }
  }

  const getPlanTypeIcon = (plan: MealPlanWithClient) => {
    const goal = plan.description?.toLowerCase() || plan.name?.toLowerCase() || ""
    if (goal.includes("perte") || goal.includes("minceur")) return Target
    if (goal.includes("muscle") || goal.includes("prise")) return TrendingUp
    if (goal.includes("cardio") || goal.includes("endurance")) return Heart
    if (goal.includes("sport") || goal.includes("performance")) return Activity
    return ChefHat
  }

  // Filter meal plans
  const filteredMealPlans = mealPlans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || plan.status === filterStatus

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Plans alimentaires"
        subtitle={`Gérez les plans alimentaires de vos ${stats.clientsServed} clients`}
        searchPlaceholder="Rechercher des plans..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <Button 
              onClick={() => setIsTemplateDialogOpen(true)}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5"
            >
              <BookOpen className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Utiliser un modèle</span>
              <span className="sm:hidden">Modèle</span>
            </Button>
            <Button 
              asChild
              variant="outline"
              size="sm"
              className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5"
            >
              <Link href="/dashboard/meal-plans/generate">
                <Sparkles className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Générer avec IA</span>
                <span className="sm:hidden">IA</span>
              </Link>
            </Button>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5"
            >
              <Plus className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Nouveau plan</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </div>
        }
      />

      <div className="px-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-soft bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Total Plans</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.totalPlans}</div>
              <p className="text-xs text-blue-700">Plans créés au total</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft bg-gradient-to-br from-emerald-50 to-emerald-100/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900">Plans Actifs</CardTitle>
              <Activity className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">{stats.activePlans}</div>
              <p className="text-xs text-emerald-700">En cours d'exécution</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Clients</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.clientsServed}</div>
              <p className="text-xs text-purple-700">Clients avec plans</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft bg-gradient-to-br from-orange-50 to-orange-100/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">Ce Mois</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.plansThisMonth}</div>
              <p className="text-xs text-orange-700">Nouveaux plans</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Generation Highlight */}
        <Card className="border-0 shadow-soft bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold mb-2">Génération IA de Plans Alimentaires</CardTitle>
                <CardDescription className="text-emerald-50 text-base">
                  Créez des plans personnalisés en quelques secondes avec l'intelligence artificielle
                </CardDescription>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Zap className="h-3 w-3 mr-1" />
                Génération rapide
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Target className="h-3 w-3 mr-1" />
                Objectifs personnalisés
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <BarChart3 className="h-3 w-3 mr-1" />
                Analyse nutritionnelle
              </Badge>
            </div>
            <Button 
              asChild
              size="lg" 
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold shadow-lg"
            >
              <Link href="/dashboard/meal-plans/generate">
                <Sparkles className="mr-2 h-5 w-5" />
                Essayer maintenant
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Meal Plans Grid */}
        {filteredMealPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun plan alimentaire
            </h3>
            <p className="text-gray-600 mb-4">
              Commencez par créer votre premier plan alimentaire pour vos clients
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm"
              >
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Créer un </span>plan
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs sm:text-sm">
                <Link href="/dashboard/meal-plans/generate">
                  <Sparkles className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Génération </span>IA
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredMealPlans.map((plan) => {
              const PlanIcon = getPlanTypeIcon(plan)
              return (
                <Card key={plan.id} className="border-0 shadow-soft bg-white/80 backdrop-blur-sm hover:shadow-soft-lg transition-all duration-200 group hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                          <PlanIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                            {plan.name}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 line-clamp-2">
                            {plan.description || "Aucune description"}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/meal-plans/${plan.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir le détail
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setPlanToDelete(plan)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Client */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <User className="h-3 w-3 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{plan.clients?.name || "Client non assigné"}</span>
                    </div>

                    {/* Status and metrics */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`${getStatusVariant(plan.status || 'draft')} border-0 font-medium px-3 py-1`}>
                          {getStatusDisplay(plan.status || 'draft')}
                        </Badge>
                        {plan.duration_days && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                            <Calendar className="h-3 w-3" />
                            <span>{plan.duration_days} jours</span>
                          </div>
                        )}
                      </div>

                      {/* Calories range */}
                      {plan.calories_range && (
                        <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-orange-100 to-red-100 px-3 py-2 rounded-lg">
                          <Activity className="h-3 w-3 text-orange-600" />
                          <span className="font-medium text-orange-800">{plan.calories_range} kcal/jour</span>
                        </div>
                      )}
                    </div>

                    {/* Template info */}
                    {plan.meal_plan_templates && (
                      <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg">
                        <BookOpen className="h-3 w-3 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          Modèle: {plan.meal_plan_templates.name}
                        </span>
                        {plan.generation_method === 'template' && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Direct</Badge>
                        )}
                        {plan.generation_method === 'ai' && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">IA</Badge>
                        )}
                      </div>
                    )}

                    {/* Created date */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t border-gray-100">
                      <Clock className="h-3 w-3" />
                      <span>Créé le {new Date(plan.created_at || '').toLocaleDateString('fr-FR')}</span>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button 
                        asChild
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm hover:shadow-md transition-all"
                      >
                        <Link href={`/dashboard/meal-plans/${plan.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir le plan
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Meal Plan Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl mx-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau plan alimentaire</DialogTitle>
            <DialogDescription>
              Créez un plan alimentaire personnalisé pour votre client
            </DialogDescription>
          </DialogHeader>

          {/* Template Suggestion Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Gagnez du temps avec un modèle</p>
                <p className="text-xs text-blue-700">Plans structurés prêts en 2 minutes au lieu de 30 minutes</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddDialogOpen(false)
                setIsTemplateDialogOpen(true)
              }}
              className="text-blue-600 border-blue-300 hover:bg-blue-100 text-xs"
            >
              Parcourir les modèles
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Nom du plan *</Label>
              <Input
                id="plan-name"
                value={newMealPlan.name}
                onChange={(e) => setNewMealPlan(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Plan minceur personnalisé"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={newMealPlan.client_id} onValueChange={(value) => setNewMealPlan(prev => ({ ...prev, client_id: value }))}>
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
                <Label htmlFor="calories">Calories par jour</Label>
                <Input
                  id="calories"
                  value={newMealPlan.calories_range}
                  onChange={(e) => setNewMealPlan(prev => ({ ...prev, calories_range: e.target.value }))}
                  placeholder="Ex: 1800-2000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Durée (jours)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newMealPlan.duration_days}
                  onChange={(e) => setNewMealPlan(prev => ({ ...prev, duration_days: e.target.value }))}
                  placeholder="Ex: 7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newMealPlan.description}
                onChange={(e) => setNewMealPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du plan alimentaire..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateMealPlan} className="bg-emerald-600 hover:bg-emerald-700">
              Créer le plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le plan alimentaire</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le plan "{planToDelete?.name}" ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMealPlan}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Selection Dialog */}
      <TemplateSelectionDialog
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        onSuccess={() => {
          fetchData() // Refresh meal plans list
        }}
      />
    </div>
  )
}