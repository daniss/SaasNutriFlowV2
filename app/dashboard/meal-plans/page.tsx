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
import { 
  Plus, 
  Search, 
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
  Utensils,
  ChefHat
} from "lucide-react"
import { useAuthContext } from "@/components/auth/AuthProvider"
import { supabase, type MealPlan, type Client } from "@/lib/supabase"
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

interface MealPlanWithClient extends MealPlan {
  clients: { name: string } | null
}

export default function MealPlansPage() {
  const { user } = useAuthContext()
  const [mealPlans, setMealPlans] = useState<MealPlanWithClient[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
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
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      console.log("🍽️ Fetching meal plans for user:", user.id)

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

      console.log("✅ Meal plans data loaded successfully")
    } catch (error) {
      console.error("❌ Unexpected error fetching meal plans:", error)
    } finally {
      setLoading(false)
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

      console.log("➕ Adding new meal plan:", mealPlanData)

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

      console.log("✅ Meal plan added successfully:", data)
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

  const filteredMealPlans = mealPlans.filter((plan) => {
    const matchesSearch = 
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.clients?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === "all" || plan.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

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

  const getPlanTypeIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('weight') || lowerName.includes('loss')) return Target
    if (lowerName.includes('muscle') || lowerName.includes('gain')) return TrendingUp
    if (lowerName.includes('heart') || lowerName.includes('cardio')) return Heart
    if (lowerName.includes('detox') || lowerName.includes('cleanse')) return Activity
    return ChefHat
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-3">
              <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-48 animate-pulse" />
              <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-80 animate-pulse" />
            </div>
            <div className="h-11 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-40 animate-pulse" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-slate-100">
                <div className="space-y-3">
                  <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-16 animate-pulse" />
                  <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-12 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filter Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="h-11 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg flex-1 max-w-md animate-pulse" />
            <div className="h-11 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-32 animate-pulse" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-slate-100">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-32 animate-pulse" />
                      <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-24 animate-pulse" />
                    </div>
                    <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full w-16 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-full animate-pulse" />
                    <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-3/4 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader 
        title="Plans alimentaires"
        subtitle="Créez des plans nutritionnels personnalisés qui transforment le parcours santé de vos clients"
        searchPlaceholder="Rechercher plans alimentaires et clients..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-4 group"
              >
                <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                Créer un plan
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
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total plans</p>
                  <p className="text-2xl font-bold text-slate-900">{mealPlans.length}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Plans actifs</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {mealPlans.filter(plan => plan.status === 'active').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Clients servis</p>
                  <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Ce mois-ci</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {mealPlans.filter(plan => {
                      const planDate = new Date(plan.created_at)
                      const now = new Date()
                      return planDate.getMonth() === now.getMonth() && planDate.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Section */}
        <div className="flex items-center gap-4 mb-8">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
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
        </div>

        {/* Meal Plans Grid */}
        {filteredMealPlans.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm rounded-xl">
            <CardContent className="pt-16 pb-16">
              <div className="text-center">
                <div className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                  <FileText className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Aucun plan alimentaire trouvé</h3>
                <p className="text-slate-600 mb-8 max-w-sm mx-auto leading-relaxed">
                  {searchTerm || filterStatus !== 'all' 
                    ? "Essayez d'ajuster vos critères de recherche ou de filtrage." 
                    : "Créez votre premier plan alimentaire pour commencer à transformer le parcours santé de vos clients."
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Créez votre premier plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMealPlans.map((plan, index) => {
              const IconComponent = getPlanTypeIcon(plan.name)
              return (
                <Card 
                  key={plan.id} 
                  className="group bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-slate-900 truncate leading-tight">
                            {plan.name}
                          </CardTitle>
                          <div className="flex items-center mt-1 text-slate-600">
                            <Users className="mr-1.5 h-3.5 w-3.5 opacity-60" />
                            <span className="text-sm font-medium">{plan.clients?.name || "Unknown Client"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`${getStatusColor(plan.status)} border font-medium px-2.5 py-1 text-xs`}
                        >
                          {plan.status === 'active' ? 'Actif' : 
                           plan.status === 'completed' ? 'Terminé' : 
                           plan.status === 'paused' ? 'En pause' : plan.status}
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
                  
                  <CardContent className="space-y-5">
                    {plan.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{plan.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50/80 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Durée</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{plan.duration_days} jours</span>
                      </div>
                      
                      {plan.calories_range && (
                        <div className="bg-slate-50/80 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Calories</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{plan.calories_range}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Calendar className="mr-1.5 h-3.5 w-3.5 opacity-60" />
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
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
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
    </div>
  )
}
