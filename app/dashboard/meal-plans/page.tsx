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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  FileText, 
  Calendar, 
  Users, 
  Clock,
  TrendingUp,
  Zap,
  Heart,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Activity,
  Target,
  ChefHat,
  BarChart3,
  Leaf,
  Shield,
  Stethoscope,
  Dumbbell,
  User,
  Sparkles
} from "lucide-react"
import { useAuth } from "@/hooks/useAuthNew"
import { supabase, type MealPlan, type RecipeTemplate, type MealPlanTemplate } from "@/lib/supabase"
import { 
  MEAL_PLAN_CATEGORIES, 
  CLIENT_TYPES, 
  GOAL_TYPES,
  getCategoryInfo,
  getClientTypeInfo,
  getGoalTypeInfo,
  filterTemplatesByCategory
} from "@/lib/template-categories"
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
import Link from "next/link"
import RecipeTemplateDialog from "@/components/templates/RecipeTemplateDialog"
import MealPlanTemplateDialog from "@/components/templates/MealPlanTemplateDialog"

interface MealPlanWithClient extends MealPlan {
  clients: { name: string } | null
}

interface ClientOption {
  id: string
  name: string
}

type TemplateType = 'recipe' | 'meal_plan'

export default function MealPlansPage() {
  const { user } = useAuth()
  const [mealPlans, setMealPlans] = useState<MealPlanWithClient[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterClientType, setFilterClientType] = useState<string>("all")
  const [filterGoalType, setFilterGoalType] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'meal_plans' | TemplateType>('meal_plans')
  const [recipeTemplates, setRecipeTemplates] = useState<RecipeTemplate[]>([])
  const [mealPlanTemplates, setMealPlanTemplates] = useState<MealPlanTemplate[]>([])
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<RecipeTemplate | MealPlanTemplate | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<MealPlanWithClient | null>(null)
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
      fetchTemplates()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      // Fetch meal plans with client names
      const { data: mealPlanData, error: mealPlanError } = await supabase
        .from("meal_plans")
        .select(`
          *,
          clients (name)
        `)
        .eq("dietitian_id", user.id)
        .order("created_at", { ascending: false })

      if (mealPlanError) {
        console.error("❌ Error fetching meal plans:", mealPlanError)
      } else {
        setMealPlans(mealPlanData || [])
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
    } catch (error) {
      console.error("❌ Unexpected error fetching meal plans:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    if (!user) return
    
    try {
      // Fetch recipe templates
      const { data: recipes, error: recipeError } = await supabase
        .from('recipe_templates')
        .select('*')
        .eq('dietitian_id', user.id)
        .order('created_at', { ascending: false })
      
      if (recipeError) throw recipeError
      
      // Fetch meal plan templates
      const { data: mealPlans, error: mealPlanError } = await supabase
        .from('meal_plan_templates')
        .select('*')
        .eq('dietitian_id', user.id)
        .order('created_at', { ascending: false })
      
      if (mealPlanError) throw mealPlanError
      
      setRecipeTemplates(recipes || [])
      setMealPlanTemplates(mealPlans || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleAddMealPlan = async () => {
    if (!user || !newMealPlan.name || !newMealPlan.client_id) return

    try {
      const mealPlanData = {
        dietitian_id: user.id,
        client_id: newMealPlan.client_id,
        name: newMealPlan.name,
        description: newMealPlan.description || null,
        plan_content: newMealPlan.plan_content,
        calories_range: newMealPlan.calories_range || null,
        duration_days: newMealPlan.duration_days ? Number.parseInt(newMealPlan.duration_days) : 7,
        status: "active",
      }

      const { data, error } = await supabase
        .from("meal_plans")
        .insert(mealPlanData)
        .select(`
          *,
          clients (name)
        `)
        .single()

      if (error) {
        console.error("❌ Error adding meal plan:", error)
        toast({
          title: "Erreur",
          description: "Échec de la création du plan alimentaire. Veuillez réessayer.",
          variant: "destructive"
        })
        return
      }

      setMealPlans([data, ...mealPlans])
      setIsAddDialogOpen(false)
      setNewMealPlan({
        name: "",
        description: "",
        client_id: "",
        calories_range: "",
        duration_days: "",
        plan_content: {},
      })
      toast({
        title: "Succès",
        description: "Plan alimentaire créé avec succès !"
      })
    } catch (error) {
      console.error("❌ Unexpected error adding meal plan:", error)
      toast({
        title: "Erreur",
        description: "Échec de la création du plan alimentaire. Veuillez réessayer.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (plan: MealPlanWithClient) => {
    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", plan.id)
        .eq("dietitian_id", user?.id)

      if (error) {
        toast({
          title: "Erreur",
          description: "Échec de la suppression du plan alimentaire. Veuillez réessayer.",
          variant: "destructive"
        })
        return
      }

      setMealPlans(mealPlans.filter(p => p.id !== plan.id))
      toast({
        title: "Succès",
        description: "Plan alimentaire supprimé avec succès."
      })
    } catch (error) {
      console.error("Error deleting meal plan:", error)
      toast({
        title: "Erreur",
        description: "Échec de la suppression du plan alimentaire. Veuillez réessayer.",
        variant: "destructive"
      })
    } finally {
      setDeleteDialogOpen(false)
      setPlanToDelete(null)
    }
  }

  const handleDuplicate = async (plan: MealPlanWithClient) => {
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .insert({
          dietitian_id: user?.id,
          client_id: plan.client_id,
          name: `${plan.name} (Copy)`,
          description: plan.description,
          plan_content: plan.plan_content,
          calories_range: plan.calories_range,
          duration_days: plan.duration_days,
          status: "active"
        })
        .select(`
          *,
          clients (name)
        `)
        .single()

      if (error) {
        toast({
          title: "Erreur",
          description: "Échec de la duplication du plan alimentaire. Veuillez réessayer.",
          variant: "destructive"
        })
        return
      }

      setMealPlans([data, ...mealPlans])
      toast({
        title: "Succès",
        description: "Plan alimentaire dupliqué avec succès !"
      })
    } catch (error) {
      console.error("Error duplicating meal plan:", error)
      toast({
        title: "Erreur",
        description: "Échec de la duplication du plan alimentaire. Veuillez réessayer.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteTemplate = async (templateId: string, type: TemplateType) => {
    if (!user) return
    
    try {
      const table = type === 'recipe' ? 'recipe_templates' : 'meal_plan_templates'
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', templateId)
        .eq('dietitian_id', user.id)
      
      if (error) throw error
      
      // Update local state
      if (type === 'recipe') {
        setRecipeTemplates(prev => prev.filter(t => t.id !== templateId))
      } else {
        setMealPlanTemplates(prev => prev.filter(t => t.id !== templateId))
      }
      
      toast({
        title: "Succès",
        description: "Modèle supprimé avec succès"
      })
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le modèle",
        variant: "destructive"
      })
    }
  }

  const filteredMealPlans = mealPlans.filter((plan) => {
    const matchesSearch = 
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.clients?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === "all" || plan.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const getPlanTypeIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('weight') || lowerName.includes('loss')) return Target
    if (lowerName.includes('muscle') || lowerName.includes('gain')) return TrendingUp
    if (lowerName.includes('heart') || lowerName.includes('cardio')) return Heart
    if (lowerName.includes('detox') || lowerName.includes('cleanse')) return Activity
    return ChefHat
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Plans alimentaires & Modèles"
        subtitle="Créez des plans nutritionnels personnalisés et gérez vos modèles réutilisables"
        searchPlaceholder="Rechercher plans alimentaires, modèles et clients..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          activeTab === 'meal_plans' ? (
            <div className="flex gap-2">
              <Button 
                asChild
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-4 group"
              >
                <Link href="/dashboard/meal-plans/generate">
                  <Zap className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                  Générer avec IA
                </Link>
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-4 group"
                  >
                    <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                    Plan manuel
                  </Button>
                </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] rounded-xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <DialogHeader className="space-y-4 pb-2">
                <DialogTitle className="text-2xl font-bold text-slate-900">Créer un nouveau plan alimentaire</DialogTitle>
                <DialogDescription className="text-slate-600 text-base leading-relaxed">
                  Concevez un plan nutritionnel personnalisé adapté aux objectifs et préférences de votre client.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="space-y-3">
                  <Label htmlFor="plan-name" className="text-sm font-semibold text-slate-700">Nom du plan *</Label>
                  <Input
                    id="plan-name"
                    value={newMealPlan.name}
                    onChange={(e) => setNewMealPlan({ ...newMealPlan, name: e.target.value })}
                    placeholder="ex: Plan de perte de poids méditerranéen"
                    className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="client" className="text-sm font-semibold text-slate-700">Client *</Label>
                  <Select
                    value={newMealPlan.client_id}
                    onValueChange={(value: string) => setNewMealPlan({ ...newMealPlan, client_id: value })}
                  >
                    <SelectTrigger className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-lg">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id} className="rounded-md">
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="calories" className="text-sm font-semibold text-slate-700">Fourchette calorique</Label>
                    <Input
                      id="calories"
                      value={newMealPlan.calories_range}
                      onChange={(e) => setNewMealPlan({ ...newMealPlan, calories_range: e.target.value })}
                      placeholder="1400-1600"
                      className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-lg"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="duration" className="text-sm font-semibold text-slate-700">Durée (jours)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newMealPlan.duration_days}
                      onChange={(e) => setNewMealPlan({ ...newMealPlan, duration_days: e.target.value })}
                      placeholder="14"
                      className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</Label>
                  <Textarea
                    id="description"
                    value={newMealPlan.description}
                    onChange={(e) => setNewMealPlan({ ...newMealPlan, description: e.target.value })}
                    placeholder="Décrivez l'objectif et les buts du plan alimentaire..."
                    rows={3}
                    className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 resize-none rounded-lg"
                  />
                </div>
              </div>
              <DialogFooter className="gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)} 
                  className="border-slate-200 hover:bg-slate-50 rounded-lg px-6"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddMealPlan} 
                  disabled={!newMealPlan.name || !newMealPlan.client_id}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg disabled:opacity-50 font-semibold px-6 rounded-lg"
                >
                  Créer le plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            </div>
          ) : (
            <Button 
              onClick={() => setIsTemplateDialogOpen(true)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-4 group"
            >
              <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
              Nouveau modèle
            </Button>
          )
        }
      />

      <div className="px-4 sm:px-6 space-y-6">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'meal_plans' | TemplateType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="meal_plans" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Plans alimentaires ({mealPlans.length})
            </TabsTrigger>
            <TabsTrigger value="recipe" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Recettes ({recipeTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="meal_plan" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Modèles de plans ({mealPlanTemplates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meal_plans" className="space-y-6 mt-6">
            {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Total plans</p>
                  <p className="text-2xl font-bold text-slate-900">{mealPlans.length}</p>
                </div>
                <div className="h-14 w-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-7 w-7 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Plans actifs</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {mealPlans.filter(plan => plan.status === 'active').length}
                  </p>
                </div>
                <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Clients servis</p>
                  <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
                </div>
                <div className="h-14 w-14 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="h-7 w-7 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Ce mois-ci</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {mealPlans.filter(plan => {
                      const planDate = new Date(plan.created_at)
                      const now = new Date()
                      return planDate.getMonth() === now.getMonth() && planDate.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
                <div className="h-14 w-14 bg-amber-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Generation Highlight Card */}
        <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-emerald-50 border-purple-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Génération automatique avec IA</h3>
                  <p className="text-sm text-gray-600">Créez des plans nutritionnels complets avec analyse détaillée et graphiques professionnels</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>Analyses nutritionnelles</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>Graphiques pro</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>PDF avancés</span>
                  </div>
                </div>
                <Button 
                  asChild
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Link href="/dashboard/meal-plans/generate">
                    <Zap className="mr-2 h-4 w-4" />
                    Essayer l'IA
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Section */}
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44 h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
              <Filter className="h-4 w-4 mr-2 text-slate-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all" className="rounded-md">Tous les statuts</SelectItem>
              <SelectItem value="active" className="rounded-md">Actif</SelectItem>
              <SelectItem value="completed" className="rounded-md">Terminé</SelectItem>
              <SelectItem value="paused" className="rounded-md">En pause</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" asChild>
            <Link href="/dashboard/meal-plans/schedules">
              <Calendar className="h-4 w-4 mr-2" />
              Plannings
            </Link>
          </Button>
        </div>

        {/* Meal Plans Grid */}
        {loading ? (
          <GridSkeleton items={6} />
        ) : filteredMealPlans.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm rounded-xl">
            <CardContent className="pt-20 pb-20">
              <div className="text-center">
                <div className="mx-auto h-24 w-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                  <FileText className="h-12 w-12 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Aucun plan alimentaire trouvé</h3>
                <p className="text-slate-600 mb-10 max-w-md mx-auto leading-relaxed">
                  {searchTerm || filterStatus !== 'all' 
                    ? "Essayez d'ajuster vos critères de recherche ou de filtrage." 
                    : "Créez votre premier plan alimentaire pour commencer à transformer le parcours santé de vos clients."
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-8 py-3 h-12"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Créez votre premier plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredMealPlans.map((plan) => {
              const IconComponent = getPlanTypeIcon(plan.name)
              return (
                <Card 
                  key={plan.id} 
                  className="group bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden"
                >
                  <CardHeader className="pb-4 px-6 pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-slate-900 mb-1 leading-tight">
                            {plan.name}
                          </CardTitle>
                          <div className="flex items-center text-slate-600">
                            <Users className="mr-1.5 h-4 w-4 opacity-60" />
                            <span className="text-sm font-medium">{plan.clients?.name || "Unknown Client"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                          variant={getStatusVariant(plan.status)}
                          className="font-medium px-2.5 py-1 text-xs"
                        >
                          {getStatusDisplay(plan.status)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-lg border-slate-200 shadow-lg">
                            <DropdownMenuItem asChild className="rounded-md">
                              <Link href={`/dashboard/meal-plans/${plan.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir les détails
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-md">
                              <Link href={`/dashboard/meal-plans/${plan.id}?edit=true`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier le plan
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDuplicate(plan)}
                              className="rounded-md"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem 
                              onClick={() => {
                                setPlanToDelete(plan)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-red-600 hover:bg-red-50 rounded-md"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer le plan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 px-6 pb-6">
                    {plan.description && (
                      <div className="bg-slate-50/50 rounded-lg p-3">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {plan.description}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Durée</span>
                        </div>
                        <span className="text-base font-bold text-slate-900">{plan.duration_days} jours</span>
                      </div>
                      
                      {plan.calories_range && (
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/80 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Calories</span>
                          </div>
                          <span className="text-base font-bold text-emerald-700">{plan.calories_range}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Calendar className="mr-1.5 h-4 w-4 opacity-60" />
                        Créé le {new Date(plan.created_at).toLocaleDateString('fr-FR', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-semibold h-8 px-3 -mr-2"
                      >
                        <Link href={`/dashboard/meal-plans/${plan.id}`}>
                          <Eye className="mr-1.5 h-4 w-4" />
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le plan alimentaire</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer "{planToDelete?.name}" ? Cette action ne peut pas être annulée et supprimera définitivement le plan alimentaire et toutes les données associées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPlanToDelete(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => planToDelete && handleDelete(planToDelete)} 
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer le plan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
          </TabsContent>

          <TabsContent value="recipe" className="space-y-6 mt-6">
            {recipeTemplates.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm rounded-xl">
                <CardContent className="pt-20 pb-20">
                  <div className="text-center">
                    <div className="mx-auto h-24 w-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                      <ChefHat className="h-12 w-12 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Aucun modèle de recette trouvé</h3>
                    <p className="text-slate-600 mb-10 max-w-md mx-auto leading-relaxed">
                      Créez votre premier modèle de recette pour gagner du temps lors de la création de plans alimentaires.
                    </p>
                    <Button 
                      onClick={() => setIsTemplateDialogOpen(true)}
                      size="lg"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-8 py-3 h-12"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Créer votre premier modèle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {recipeTemplates.filter(template => 
                  template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  template.category?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    type="recipe"
                    onEdit={(template: RecipeTemplate | MealPlanTemplate) => {
                      setEditingTemplate(template)
                      setIsEditTemplateDialogOpen(true)
                    }}
                    onDelete={(id: string) => handleDeleteTemplate(id, 'recipe')}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="meal_plan" className="space-y-6 mt-6">
            {/* Template Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48 h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                  <Filter className="h-4 w-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="all" className="rounded-md">Toutes les catégories</SelectItem>
                  {Object.entries(MEAL_PLAN_CATEGORIES).map(([key, value]) => (
                    <SelectItem key={key} value={key} className="rounded-md">
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterClientType} onValueChange={setFilterClientType}>
                <SelectTrigger className="w-48 h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                  <User className="h-4 w-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Type de client" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="all" className="rounded-md">Tous les types</SelectItem>
                  {Object.entries(CLIENT_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key} className="rounded-md">
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterGoalType} onValueChange={setFilterGoalType}>
                <SelectTrigger className="w-48 h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                  <Target className="h-4 w-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Type d'objectif" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="all" className="rounded-md">Tous les objectifs</SelectItem>
                  {Object.entries(GOAL_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key} className="rounded-md">
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {mealPlanTemplates.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm rounded-xl">
                <CardContent className="pt-20 pb-20">
                  <div className="text-center">
                    <div className="mx-auto h-24 w-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                      <Calendar className="h-12 w-12 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Aucun modèle de plan alimentaire trouvé</h3>
                    <p className="text-slate-600 mb-10 max-w-md mx-auto leading-relaxed">
                      Créez votre premier modèle de plan alimentaire pour standardiser vos accompagnements.
                    </p>
                    <Button 
                      onClick={() => setIsTemplateDialogOpen(true)}
                      size="lg"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-8 py-3 h-12"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Créer votre premier modèle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filterTemplatesByCategory(
                  mealPlanTemplates.filter(template => 
                    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    template.category?.toLowerCase().includes(searchTerm.toLowerCase())
                  ),
                  {
                    category: filterCategory !== 'all' ? filterCategory as any : undefined,
                    clientType: filterClientType !== 'all' ? filterClientType as any : undefined,
                    goalType: filterGoalType !== 'all' ? filterGoalType as any : undefined
                  }
                ).map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    type="meal_plan"
                    onEdit={(template: RecipeTemplate | MealPlanTemplate) => {
                      setEditingTemplate(template)
                      setIsEditTemplateDialogOpen(true)
                    }}
                    onDelete={(id: string) => handleDeleteTemplate(id, 'meal_plan')}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Template Dialogs */}
        {activeTab === 'recipe' ? (
          <RecipeTemplateDialog
            isOpen={isTemplateDialogOpen}
            onClose={() => setIsTemplateDialogOpen(false)}
            onSave={() => {
              setIsTemplateDialogOpen(false)
              fetchTemplates()
            }}
          />
        ) : activeTab === 'meal_plan' ? (
          <MealPlanTemplateDialog
            isOpen={isTemplateDialogOpen}
            onClose={() => setIsTemplateDialogOpen(false)}
            onSave={() => {
              setIsTemplateDialogOpen(false)
              fetchTemplates()
            }}
          />
        ) : null}
        
        {/* Schedule Dialog removed */}

        {/* Edit Template Dialogs */}
        {editingTemplate && (
          activeTab === 'recipe' ? (
            <RecipeTemplateDialog
              isOpen={isEditTemplateDialogOpen}
              onClose={() => {
                setIsEditTemplateDialogOpen(false)
                setEditingTemplate(null)
              }}
              template={editingTemplate as RecipeTemplate}
              onSave={() => {
                setIsEditTemplateDialogOpen(false)
                setEditingTemplate(null)
                fetchTemplates()
              }}
            />
          ) : (
            <MealPlanTemplateDialog
              isOpen={isEditTemplateDialogOpen}
              onClose={() => {
                setIsEditTemplateDialogOpen(false)
                setEditingTemplate(null)
              }}
              template={editingTemplate as MealPlanTemplate}
              onSave={() => {
                setIsEditTemplateDialogOpen(false)
                setEditingTemplate(null)
                fetchTemplates()
              }}
            />
          )
        )}
      </div>
    </div>
  )
}

// Template Card Component
function TemplateCard({ 
  template, 
  type, 
  onEdit, 
  onDelete 
}: { 
  template: RecipeTemplate | MealPlanTemplate
  type: TemplateType
  onEdit: (template: RecipeTemplate | MealPlanTemplate) => void
  onDelete: (id: string) => void
}) {
  const getCategoryColor = (category: string) => {
    const colors = {
      'weight_loss': 'bg-red-100 text-red-800',
      'muscle_gain': 'bg-green-100 text-green-800',
      'diabetes': 'bg-blue-100 text-blue-800',
      'cardiovascular': 'bg-pink-100 text-pink-800',
      'detox': 'bg-emerald-100 text-emerald-800',
      'maintenance': 'bg-gray-100 text-gray-800',
      'general': 'bg-slate-100 text-slate-800',
      // Recipe categories
      'breakfast': 'bg-orange-100 text-orange-800',
      'lunch': 'bg-blue-100 text-blue-800',
      'dinner': 'bg-purple-100 text-purple-800',
      'snack': 'bg-green-100 text-green-800',
      'dessert': 'bg-pink-100 text-pink-800',
      'main': 'bg-blue-100 text-blue-800',
      'vegetarian': 'bg-emerald-100 text-emerald-800',
      'vegan': 'bg-teal-100 text-teal-800',
      'gluten-free': 'bg-yellow-100 text-yellow-800',
      'low-carb': 'bg-red-100 text-red-800',
      'high-protein': 'bg-indigo-100 text-indigo-800',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty) return 'bg-gray-100 text-gray-800'
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800',
    }
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="border-0 shadow-sm bg-white/90 backdrop-blur-sm hover:shadow-md transition-all duration-200 group rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
              {template.name}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-lg border-slate-200 shadow-lg">
              <DropdownMenuItem onClick={() => onEdit(template)} className="rounded-md">
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-md">
                <Copy className="mr-2 h-4 w-4" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem 
                onClick={() => onDelete(template.id)}
                className="text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge className={`${getCategoryColor(template.category)} border-0 font-medium px-3 py-1`}>
            {getCategoryInfo(template.category as any)?.label || template.category}
          </Badge>
          {'client_type' in template && template.client_type && (
            <Badge className="bg-blue-100 text-blue-800 border-0 font-medium px-3 py-1">
              {getClientTypeInfo(template.client_type as any)?.label || template.client_type}
            </Badge>
          )}
          {'goal_type' in template && template.goal_type && (
            <Badge className="bg-purple-100 text-purple-800 border-0 font-medium px-3 py-1">
              {getGoalTypeInfo(template.goal_type as any)?.label || template.goal_type}
            </Badge>
          )}
          {'difficulty' in template && template.difficulty && (
            <Badge className={`${getDifficultyColor(template.difficulty)} border-0 font-medium px-3 py-1`}>
              {template.difficulty}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-3 w-3" />
            <span>{'servings' in template ? `${template.servings} portions` : 'Plan complet'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-3 w-3" />
            <span>
              {'prep_time' in template && template.prep_time ? `${template.prep_time}min` : 'Flexible'}
            </span>
          </div>
        </div>

        {'tags' in template && template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
