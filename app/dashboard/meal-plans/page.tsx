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
  BookOpen
} from "lucide-react"
import { useAuth } from "@/hooks/useAuthNew"
import { supabase, type MealPlan } from "@/lib/supabase"
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

interface ClientOption {
  id: string
  name: string
}

export default function MealPlansPage() {
  const { user } = useAuth()
  const [mealPlans, setMealPlans] = useState<MealPlanWithClient[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
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
      setLoading(true)

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
        throw mealPlanError
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
      const { data, error } = await supabase
        .from("meal_plans")
        .insert({
          ...newMealPlan,
          dietitian_id: user.id,
          duration_days: parseInt(newMealPlan.duration_days) || null,
          status: "draft",
          plan_content: {
            meals: [],
            notes: newMealPlan.description || ""
          }
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
        subtitle={`${filteredMealPlans.length} plans disponibles pour vos clients`}
        searchPlaceholder="Rechercher des plans..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <div className="flex items-center gap-3">
            <Button 
              asChild
              variant="outline"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Link href="/dashboard/templates">
                <BookOpen className="mr-2 h-4 w-4" />
                Utiliser un modèle
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
            >
              <Link href="/dashboard/meal-plans/generate">
                <Sparkles className="mr-2 h-4 w-4" />
                Génération IA
              </Link>
            </Button>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau plan
            </Button>
          </div>
        }
      />

      <div className="px-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
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
            <div className="flex justify-center gap-3">
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un plan
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/meal-plans/generate">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Génération IA
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMealPlans.map((plan) => (
              <Card key={plan.id} className="border-0 shadow-soft bg-white/80 backdrop-blur-sm hover:shadow-soft-md transition-all duration-200 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 line-clamp-2">
                        {plan.description || "Aucune description"}
                      </CardDescription>
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
                            Voir
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
                
                <CardContent className="space-y-3">
                  {/* Client */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-3 w-3" />
                    <span>{plan.clients?.name || "Client non assigné"}</span>
                  </div>

                  {/* Status and Duration */}
                  <div className="flex items-center justify-between">
                    <Badge className={`${getStatusVariant(plan.status || 'draft')} border-0 font-medium px-3 py-1`}>
                      {getStatusDisplay(plan.status || 'draft')}
                    </Badge>
                    {plan.duration_days && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>{plan.duration_days} jours</span>
                      </div>
                    )}
                  </div>

                  {/* Calories range */}
                  {plan.calories_range && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Activity className="h-3 w-3" />
                      <span>{plan.calories_range} kcal</span>
                    </div>
                  )}

                  {/* Created date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Créé le {new Date(plan.created_at || '').toLocaleDateString('fr-FR')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Meal Plan Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Créer un nouveau plan alimentaire</DialogTitle>
            <DialogDescription>
              Créez un plan alimentaire personnalisé pour votre client
            </DialogDescription>
          </DialogHeader>
          
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

            <div className="grid grid-cols-2 gap-4">
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
                rows={3}
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
    </div>
  )
}