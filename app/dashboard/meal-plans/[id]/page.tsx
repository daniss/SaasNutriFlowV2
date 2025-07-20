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
import { Checkbox } from "@/components/ui/checkbox"
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
import { downloadModernMealPlanPDF, type MealPlanPDFData } from "@/lib/pdf-generator-modern"
import { supabase, type MealPlan } from "@/lib/supabase"
import { DynamicMealPlanDisplay, LegacyMealPlanDisplay } from "@/components/meal-plans/DynamicMealPlanDisplay"
import { DynamicMealEditDialog } from "@/components/meal-plans/DynamicMealEditDialog"
import { MealPlanContent, isDynamicMealPlan, isLegacyMealPlan, DynamicMealPlanDay, DynamicMealPlan } from "@/lib/meal-plan-types"
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
    X,
    Zap
} from "lucide-react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { type GeneratedMealPlan } from "@/lib/gemini"
import MacronutrientBreakdown from "@/components/nutrition/MacronutrientBreakdown"
const FoodSearchModal = dynamic(() => import("@/components/dashboard/FoodSearchModal"), { ssr: false })
const ManualFoodModal = dynamic(() => import("@/components/dashboard/ManualFoodModal"), { ssr: false })

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
  breakfastHour?: string
  lunchHour?: string
  dinnerHour?: string
  snacksHour?: string
  breakfastEnabled?: boolean
  lunchEnabled?: boolean
  dinnerEnabled?: boolean
  snacksEnabled?: boolean
}

interface EditDayForm {
  day: number
  breakfast: string
  lunch: string
  dinner: string
  snacks: string
  notes: string
  breakfastHour: string
  lunchHour: string
  dinnerHour: string
  snacksHour: string
  breakfastEnabled: boolean
  lunchEnabled: boolean
  dinnerEnabled: boolean
  snacksEnabled: boolean
}

export default function MealPlanDetailPage() {
  // Food search modal state
  const [foodSearchOpen, setFoodSearchOpen] = useState(false)
  const [foodSearchSlot, setFoodSearchSlot] = useState<"breakfast"|"lunch"|"dinner"|"snacks">("breakfast")
  const [foodSearchDay, setFoodSearchDay] = useState(1)
  const [foodSearchMealId, setFoodSearchMealId] = useState<string | null>(null)
  
  // Manual food modal state
  const [manualFoodOpen, setManualFoodOpen] = useState(false)
  const [manualFoodSlot, setManualFoodSlot] = useState<"breakfast"|"lunch"|"dinner"|"snacks">("breakfast")
  const [manualFoodDay, setManualFoodDay] = useState(1)
  const [manualFoodMealId, setManualFoodMealId] = useState<string | null>(null)
  interface SelectedFood {
    id: string
    name_fr: string
    quantity: number
    portionSize: 'custom' | 'gemrcn' | 'pnns'
    energy_kcal?: number
    protein_g?: number
    carbohydrate_g?: number
    fat_g?: number
    fiber_g?: number
  }
  
  const [selectedFoods, setSelectedFoods] = useState<Record<number, { breakfast: SelectedFood[]; lunch: SelectedFood[]; dinner: SelectedFood[]; snacks: SelectedFood[] }>>({})
  
  // Dynamic meal food storage - organized by meal ID instead of legacy slots
  const [dynamicMealFoods, setDynamicMealFoods] = useState<Record<string, SelectedFood[]>>({})
  
  // Dynamic meal recipe storage - organized by meal ID
  const [dynamicMealRecipes, setDynamicMealRecipes] = useState<Record<string, any[]>>({})
  
  // Function to remove food from dynamic meal
  const removeDynamicMealFood = (mealId: string, foodIndex: number) => {
    setDynamicMealFoods(prev => ({
      ...prev,
      [mealId]: (prev[mealId] || []).filter((_, index) => index !== foodIndex)
    }))
  }

  // Function to remove recipe from dynamic meal
  const removeDynamicMealRecipe = (mealId: string, recipeIndex: number) => {
    setDynamicMealRecipes(prev => ({
      ...prev,
      [mealId]: (prev[mealId] || []).filter((_, index) => index !== recipeIndex)
    }))
  }
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [mealPlan, setMealPlan] = useState<MealPlanWithClient | null>(null)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false)
  const [isEditDayOpen, setIsEditDayOpen] = useState(false)
  const [isDynamicEditOpen, setIsDynamicEditOpen] = useState(false)
  const [currentEditDay, setCurrentEditDay] = useState<DynamicMealPlanDay | null>(null)
  const [editDayNumber, setEditDayNumber] = useState(1)
  const [editDayForm, setEditDayForm] = useState<EditDayForm>({
    day: 1,
    breakfast: "",
    lunch: "",
    dinner: "",
    snacks: "",
    notes: "",
    breakfastHour: "08:00",
    lunchHour: "12:00",
    dinnerHour: "19:00",
    snacksHour: "16:00",
    breakfastEnabled: true,
    lunchEnabled: true,
    dinnerEnabled: true,
    snacksEnabled: false
  })
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

  // Load selected foods and recipes from plan_content when meal plan loads
  useEffect(() => {
    const loadMealPlanData = async () => {
      if (mealPlan?.plan_content?.days) {
        const loadedSelectedFoods: Record<number, { breakfast: SelectedFood[]; lunch: SelectedFood[]; dinner: SelectedFood[]; snacks: SelectedFood[] }> = {}
        const loadedDynamicMealFoods: Record<string, SelectedFood[]> = {}
        const loadedDynamicMealRecipes: Record<string, any[]> = {}
        
        for (const day of mealPlan.plan_content.days) {
        // Load legacy selected foods
        if (day.selectedFoods && Object.keys(day.selectedFoods).length > 0) {
          // Check if this is dynamic meal foods (organized by meal ID) or legacy foods (organized by slot)
          const firstKey = Object.keys(day.selectedFoods)[0]
          if (firstKey && firstKey.includes('-')) {
            // Dynamic meal foods (meal IDs like "1-petit-dejeuner")
            Object.assign(loadedDynamicMealFoods, day.selectedFoods)
          } else {
            // Legacy selected foods (slots like "breakfast", "lunch", etc.)
            loadedSelectedFoods[day.day] = day.selectedFoods
          }
        }

        // Load recipes using recipe_id from meals - simple many-to-one
        for (const meal of day.meals) {
          if (meal.recipe_id) {
            try {
              const { data: fullRecipe, error: recipeError } = await supabase
                .from('recipes')
                .select(`
                  *,
                  recipe_ingredients (
                    *,
                    ingredient:ingredients (*)
                  )
                `)
                .eq('id', meal.recipe_id)
                .single()
              
              if (!recipeError && fullRecipe) {
                // Transform recipe_ingredients to ingredients for RecipeCard component
                const transformedRecipe = {
                  ...fullRecipe,
                  ingredients: fullRecipe.recipe_ingredients || []
                }
                
                // Store by meal ID for the UI
                loadedDynamicMealRecipes[meal.id] = [transformedRecipe]
              }
            } catch (error) {
              // Silently handle errors
            }
          }
        }
        }
        
        if (Object.keys(loadedSelectedFoods).length > 0) {
          setSelectedFoods(loadedSelectedFoods)
        }
        
        if (Object.keys(loadedDynamicMealFoods).length > 0) {
          setDynamicMealFoods(loadedDynamicMealFoods)
        }
        
        if (Object.keys(loadedDynamicMealRecipes).length > 0) {
          setDynamicMealRecipes(loadedDynamicMealRecipes)
        }
      }
    }

    loadMealPlanData()
  }, [mealPlan])

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

    try {
      const dayPlans = getRealMealPlanDays(mealPlan.duration_days || 7)
      
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

      // Use the modern PDF generator for a beautiful, magazine-style layout
      downloadModernMealPlanPDF(pdfData)
      
      toast({
        title: "PDF généré",
        description: "Le plan alimentaire a été exporté en PDF avec un design moderne et professionnel."
      })
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF. Veuillez réessayer.",
        variant: "destructive"
      })
    }
  }

  // Function to create recipes from selected recipes in the meal plan
  const createRecipesFromSelectedRecipes = async () => {
    if (!user?.id) return

    const createdRecipes = []
    
    for (const [mealId, recipes] of Object.entries(dynamicMealRecipes)) {
      for (const recipe of recipes) {
        try {
          // Check if recipe with this name already exists for this dietitian
          const { data: existingRecipe } = await supabase
            .from('recipes')
            .select('id')
            .eq('name', recipe.name)
            .eq('dietitian_id', user.id)
            .single()

          if (existingRecipe) {
            console.log(`Recipe "${recipe.name}" already exists, skipping`)
            continue
          }

          // Create the recipe
          const { data: newRecipe, error: recipeError } = await supabase
            .from('recipes')
            .insert({
              name: recipe.name,
              description: recipe.description || `Recette générée automatiquement`,
              dietitian_id: user.id,
              servings: recipe.servings,
              prep_time: recipe.prep_time,
              cook_time: recipe.cook_time,
              calories_per_serving: recipe.calories_per_serving,
              protein_per_serving: recipe.protein_per_serving,
              carbs_per_serving: recipe.carbs_per_serving,
              fat_per_serving: recipe.fat_per_serving,
              fiber_per_serving: recipe.fiber_per_serving,
              category: 'generated',
              instructions: `Recette créée automatiquement à partir du plan alimentaire.`
            })
            .select()
            .single()

          if (recipeError) {
            console.error(`Error creating recipe "${recipe.name}":`, recipeError)
            continue
          }

          console.log(`Created recipe: ${recipe.name}`)
          createdRecipes.push(newRecipe)

          // Create recipe ingredients
          if (recipe.ingredients && recipe.ingredients.length > 0) {
            const recipeIngredients = recipe.ingredients.map((ingredient: any) => ({
              recipe_id: newRecipe.id,
              ingredient_id: ingredient.ingredient.id,
              quantity: ingredient.quantity,
              unit: ingredient.unit
            }))

            const { error: ingredientsError } = await supabase
              .from('recipe_ingredients')
              .insert(recipeIngredients)

            if (ingredientsError) {
              console.error(`Error creating recipe ingredients for "${recipe.name}":`, ingredientsError)
            } else {
              console.log(`Created ${recipe.ingredients.length} ingredients for recipe: ${recipe.name}`)
            }
          }

        } catch (error) {
          console.error(`Error processing recipe "${recipe.name}":`, error)
        }
      }
    }

    if (createdRecipes.length > 0) {
      toast({
        title: "Recettes créées",
        description: `${createdRecipes.length} recette(s) ajoutée(s) à votre collection.`
      })
    }

    return createdRecipes
  }

  const handleSharePlan = async () => {
    if (!mealPlan || !mealPlan.clients?.email) {
      toast({
        title: "Erreur",
        description: "Email du client introuvable pour partager le plan.",
        variant: "destructive"
      })
      return
    }

    try {
      // Create recipes from selected recipes before sharing
      if (Object.keys(dynamicMealRecipes).length > 0) {
        await createRecipesFromSelectedRecipes()
      }

      // First generate and download the PDF
      const dayPlans = getRealMealPlanDays(mealPlan.duration_days || 7)
      const pdfData: MealPlanPDFData = {
        id: mealPlan.id,
        name: mealPlan.name,
        description: mealPlan.description || undefined,
        clientName: mealPlan.clients.name,
        clientEmail: mealPlan.clients.email,
        duration_days: mealPlan.duration_days || 7,
        calories_range: mealPlan.calories_range || undefined,
        status: mealPlan.status,
        created_at: mealPlan.created_at,
        dayPlans: dayPlans
      }

      // Download the PDF for the dietitian using the modern generator
      downloadModernMealPlanPDF(pdfData)

      // Send notification to client
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meal_plan_notification',
          recipient: {
            email: mealPlan.clients.email,
            name: mealPlan.clients.name,
          },
          data: {
            planName: mealPlan.name,
            clientName: mealPlan.clients.name,
            duration: mealPlan.duration_days || 7,
            calories: mealPlan.calories_range || 'Non spécifié',
            description: mealPlan.description || '',
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la notification')
      }

      toast({
        title: "Plan partagé",
        description: `Le plan alimentaire a été partagé avec ${mealPlan.clients.name} par email.`
      })
    } catch (error) {
      console.error('Error sharing meal plan:', error)
      toast({
        title: "Erreur de partage",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors du partage.",
        variant: "destructive"
      })
    }
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

  const handleEditDay = (dayNumber: number) => {
    // Check if meal plan is dynamic or legacy and route to appropriate dialog
    const planContent = mealPlan?.plan_content as MealPlanContent
    
    if (planContent && isDynamicMealPlan(planContent)) {
      // Use dynamic edit dialog for dynamic meal plans
      const existingDay = planContent.days.find(d => d.day === dayNumber)
      setCurrentEditDay(existingDay || null)
      setEditDayNumber(dayNumber)
      setIsDynamicEditOpen(true)
    } else {
      // Use legacy edit dialog for legacy meal plans
      let existingDay = null
      if (mealPlan?.plan_content?.days && Array.isArray(mealPlan.plan_content.days)) {
        existingDay = mealPlan.plan_content.days.find((d: any) => d.day === dayNumber)
      }
      
      if (existingDay) {
        // Use existing real data with normalization
        const normalizedBreakfast = normalizeMealData(existingDay.meals?.breakfast)
        const normalizedLunch = normalizeMealData(existingDay.meals?.lunch)
        const normalizedDinner = normalizeMealData(existingDay.meals?.dinner)
        const normalizedSnacks = normalizeMealData(existingDay.meals?.snacks)
        
        setEditDayForm({
          day: dayNumber,
          breakfast: normalizedBreakfast.join(', '),
          lunch: normalizedLunch.join(', '),
          dinner: normalizedDinner.join(', '),
          snacks: normalizedSnacks.join(', '),
          notes: existingDay.notes || "",
          breakfastHour: existingDay.breakfastHour || "08:00",
          lunchHour: existingDay.lunchHour || "12:00",
          dinnerHour: existingDay.dinnerHour || "19:00",
          snacksHour: existingDay.snacksHour || "16:00",
          breakfastEnabled: existingDay.breakfastEnabled !== undefined ? existingDay.breakfastEnabled : true,
          lunchEnabled: existingDay.lunchEnabled !== undefined ? existingDay.lunchEnabled : true,
          dinnerEnabled: existingDay.dinnerEnabled !== undefined ? existingDay.dinnerEnabled : true,
          snacksEnabled: existingDay.snacksEnabled !== undefined ? existingDay.snacksEnabled : false
        })
      } else {
        // Create new day with empty fields for editing
        setEditDayForm({
          day: dayNumber,
          breakfast: "",
          lunch: "",
          dinner: "",
          snacks: "",
          notes: "",
          breakfastHour: "08:00",
          lunchHour: "12:00",
          dinnerHour: "19:00",
          snacksHour: "16:00",
          breakfastEnabled: true,
          lunchEnabled: true,
          dinnerEnabled: true,
          snacksEnabled: false
        })
      }
      setIsEditDayOpen(true)
    }
  }

  const handleDeleteDay = async (dayNumber: number) => {
    if (!mealPlan || !user?.id) return
    
    // Don't allow deletion if there's only one day
    if (dayPlans.length <= 1) {
      toast({
        title: "Impossible de supprimer",
        description: "Vous devez avoir au moins un jour dans votre plan de repas.",
        variant: "destructive"
      })
      return
    }

    try {
      // Get current plan_content
      let planContent = mealPlan.plan_content || { days: [] }
      
      if (!planContent.days) {
        planContent.days = []
      }

      // Remove the day from the plan
      planContent.days = planContent.days.filter((d: any) => d.day !== dayNumber)

      // Reorder remaining days (shift all days after the deleted day)
      planContent.days = planContent.days.map((d: any) => {
        if (d.day > dayNumber) {
          return { ...d, day: d.day - 1 }
        }
        return d
      })

      // Update the meal plan in the database
      const { error } = await supabase
        .from('meal_plans')
        .update({
          plan_content: planContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', mealPlan.id)
        .eq('dietitian_id', user.id)

      if (error) throw error

      // Update local state
      setMealPlan(prev => prev ? { ...prev, plan_content: planContent } : null)
      
      // Update selected foods state - remove the deleted day and reorder
      setSelectedFoods(prev => {
        const newState = { ...prev }
        delete newState[dayNumber]
        
        // Reorder remaining days
        const reorderedState: { [key: number]: any } = {}
        Object.keys(newState).forEach(key => {
          const dayNum = parseInt(key)
          if (dayNum > dayNumber) {
            reorderedState[dayNum - 1] = newState[dayNum]
          } else {
            reorderedState[dayNum] = newState[dayNum]
          }
        })
        
        return reorderedState
      })

      toast({
        title: "Jour supprimé",
        description: `Le jour ${dayNumber} a été supprimé avec succès.`,
      })

    } catch (error) {
      console.error('Error deleting day:', error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du jour.",
        variant: "destructive"
      })
    }
  }

  const handleSaveDay = async () => {
    if (!mealPlan || !user?.id) return

    try {
      // Get current plan_content or create new structure
      let planContent = mealPlan.plan_content || { days: [] }
      
      // Ensure days array exists
      if (!planContent.days) {
        planContent.days = []
      }

      // Find or create the day
      let dayIndex = planContent.days.findIndex((d: any) => d.day === editDayForm.day)
      
      const updatedDay = {
        day: editDayForm.day,
        date: new Date(Date.now() + (editDayForm.day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        meals: {
          breakfast: editDayForm.breakfastEnabled && editDayForm.breakfast ? [editDayForm.breakfast] : [],
          lunch: editDayForm.lunchEnabled && editDayForm.lunch ? [editDayForm.lunch] : [],
          dinner: editDayForm.dinnerEnabled && editDayForm.dinner ? [editDayForm.dinner] : [],
          snacks: editDayForm.snacksEnabled && editDayForm.snacks ? [editDayForm.snacks] : []
        },
        notes: editDayForm.notes || "",
        breakfastHour: editDayForm.breakfastHour,
        lunchHour: editDayForm.lunchHour,
        dinnerHour: editDayForm.dinnerHour,
        snacksHour: editDayForm.snacksHour,
        breakfastEnabled: editDayForm.breakfastEnabled,
        lunchEnabled: editDayForm.lunchEnabled,
        dinnerEnabled: editDayForm.dinnerEnabled,
        snacksEnabled: editDayForm.snacksEnabled,
        // Add any selected foods from ANSES-CIQUAL database
        selectedFoods: selectedFoods[editDayForm.day] || {}
      }

      if (dayIndex >= 0) {
        // Update existing day
        planContent.days[dayIndex] = updatedDay
      } else {
        // Add new day
        planContent.days.push(updatedDay)
      }

      // Sort days by day number
      planContent.days.sort((a: any, b: any) => a.day - b.day)

      // Save to database
      const { data, error } = await supabase
        .from("meal_plans")
        .update({
          plan_content: planContent,
          updated_at: new Date().toISOString()
        })
        .eq("id", mealPlan.id)
        .eq("dietitian_id", user.id)
        .select(`
          *,
          clients (id, name, email)
        `)
        .single()

      if (error) {
        throw error
      }

      // Update local state
      setMealPlan(data)
      
      toast({
        title: "Jour modifié",
        description: `Les repas du jour ${editDayForm.day} ont été mis à jour et sauvegardés.`
      })
      setIsEditDayOpen(false)
    } catch (error) {
      console.error("Error updating day:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le jour. Veuillez réessayer.",
        variant: "destructive"
      })
    }
  }

  const handleSaveDynamicDay = async (dayData: DynamicMealPlanDay) => {
    if (!mealPlan || !user?.id) return

    try {
      // Get current plan_content or create new structure
      let planContent = mealPlan.plan_content || { days: [] }
      
      // Ensure days array exists
      if (!planContent.days) {
        planContent.days = []
      }

      // Check if this is a dynamic meal plan
      const isDynamic = isDynamicMealPlan(planContent as MealPlanContent)
      
      if (isDynamic) {
        // Update dynamic meal plan structure
        const dynamicContent = planContent as DynamicMealPlan
        let dayIndex = dynamicContent.days.findIndex(d => d.day === dayData.day)
        
        // Add selected foods and recipes to dayData before saving
        const dayWithFoodsAndRecipes = { 
          ...dayData, 
          selectedFoods: Object.fromEntries(
            Object.entries(dynamicMealFoods).filter(([mealId]) => 
              dayData.meals.some(meal => meal.id === mealId)
            )
          ),
          selectedRecipes: Object.fromEntries(
            Object.entries(dynamicMealRecipes).filter(([mealId]) => 
              dayData.meals.some(meal => meal.id === mealId)
            )
          )
        }
        
        if (dayIndex >= 0) {
          // Update existing day
          dynamicContent.days[dayIndex] = dayWithFoodsAndRecipes
        } else {
          // Add new day
          dynamicContent.days.push(dayWithFoodsAndRecipes)
        }
        
        // Sort days by day number
        dynamicContent.days.sort((a, b) => a.day - b.day)
      } else {
        // Convert to dynamic format if it wasn't already
        const newDynamicContent: DynamicMealPlan = {
          days: [dayData],
          generated_by: (planContent as any).generated_by || 'manual',
          template_id: (planContent as any).template_id,
          template_name: (planContent as any).template_name,
          target_macros: (planContent as any).target_macros,
          difficulty: (planContent as any).difficulty,
          notes: (planContent as any).notes,
          customizations: (planContent as any).customizations,
          created_from_template_at: (planContent as any).created_from_template_at
        }
        
        // Merge any existing days that were already in legacy format
        if (Array.isArray(planContent.days)) {
          planContent.days.forEach((existingDay: any) => {
            if (existingDay.day !== dayData.day) {
              // Convert legacy day to dynamic format if needed
              // For simplicity, we'll just keep the new day
              // In a full implementation, you'd convert existing legacy days
            }
          })
        }
        
        planContent = newDynamicContent
      }

      // Save to database
      const { data, error } = await supabase
        .from("meal_plans")
        .update({
          plan_content: planContent,
          updated_at: new Date().toISOString()
        })
        .eq("id", mealPlan.id)
        .eq("dietitian_id", user.id)
        .select(`
          *,
          clients (id, name, email)
        `)
        .single()

      if (error) {
        throw error
      }

      // Update local state
      setMealPlan(data)
      
      toast({
        title: "Jour modifié",
        description: `Les repas du jour ${dayData.day} ont été mis à jour et sauvegardés.`
      })
      setIsDynamicEditOpen(false)
      setCurrentEditDay(null)
    } catch (error) {
      console.error("Error updating dynamic day:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le jour. Veuillez réessayer.",
        variant: "destructive"
      })
    }
  }

  const handleViewClientProfile = () => {
    if (mealPlan?.client_id) {
      router.push(`/dashboard/clients/${mealPlan.client_id}`)
    }
  }

  const handleCreateTemplate = async () => {
    if (!mealPlan) return

    try {
      const { data, error } = await supabase
        .from("meal_plan_templates")
        .insert({
          dietitian_id: user?.id,
          name: `Modèle - ${mealPlan.name}`,
          description: mealPlan.description,
          template_content: mealPlan.plan_content || {},
          calories_range: mealPlan.calories_range,
          duration_days: mealPlan.duration_days,
          category: "custom"
        })
        .select()
        .single()

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer le modèle. Veuillez réessayer.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Modèle créé",
        description: "Le modèle a été créé avec succès et est maintenant disponible dans vos modèles."
      })
      router.push("/dashboard/templates")
    } catch (error) {
      console.error("Error creating template:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le modèle. Veuillez réessayer.",
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

  // Helper function to normalize meal data to array format
  const normalizeMealData = (mealData: any): string[] => {
    if (!mealData) return []
    
    if (Array.isArray(mealData)) {
      return mealData.map(item => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item.name) return item.name
        return 'Repas'
      })
    }
    
    if (typeof mealData === 'string') return [mealData]
    if (typeof mealData === 'object' && mealData.name) return [mealData.name]
    return []
  }

  // Helper function to calculate nutrition from selected foods and recipes for a specific day
  const calculateDayNutrition = (dayNumber: number) => {
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0
    
    // Calculate from legacy foods
    const dayFoods = selectedFoods[dayNumber]
    if (dayFoods) {
      Object.values(dayFoods).forEach(mealFoods => {
        mealFoods.forEach(food => {
          const factor = food.quantity / 100
          totalCalories += (food.energy_kcal || 0) * factor
          totalProtein += (food.protein_g || 0) * factor
          totalCarbs += (food.carbohydrate_g || 0) * factor
          totalFat += (food.fat_g || 0) * factor
        })
      })
    }
    
    // Calculate from dynamic meal foods
    Object.entries(dynamicMealFoods).forEach(([mealId, foods]) => {
      // Check if this meal belongs to the current day
      const dayFromId = parseInt(mealId.split('-')[0])
      if (dayFromId === dayNumber) {
        foods.forEach(food => {
          const factor = food.quantity / 100
          totalCalories += (food.energy_kcal || 0) * factor
          totalProtein += (food.protein_g || 0) * factor
          totalCarbs += (food.carbohydrate_g || 0) * factor
          totalFat += (food.fat_g || 0) * factor
        })
      }
    })
    
    // Calculate from dynamic meal recipes
    Object.entries(dynamicMealRecipes).forEach(([mealId, recipes]) => {
      // Check if this meal belongs to the current day
      const dayFromId = parseInt(mealId.split('-')[0])
      if (dayFromId === dayNumber) {
        recipes.forEach(recipe => {
          // Use recipe nutritional data per serving
          totalCalories += recipe.calories_per_serving || 0
          totalProtein += recipe.protein_per_serving || 0
          totalCarbs += recipe.carbs_per_serving || 0
          totalFat += recipe.fat_per_serving || 0
        })
      }
    })
    
    // Calculate from meals with recipe_id in the meal plan structure
    if (mealPlan?.plan_content?.days && isDynamicMealPlan(mealPlan.plan_content)) {
      const targetDay = mealPlan.plan_content.days.find(day => day.day === dayNumber)
      if (targetDay?.meals) {
        targetDay.meals.forEach(meal => {
          // Include nutrition from calories_target if available (AI-generated meals often have this)
          if (meal.calories_target) {
            totalCalories += meal.calories_target
            // Estimate macros using standard ratios for AI-generated meals
            totalProtein += Math.round(meal.calories_target * 0.20 / 4) // 20% protein
            totalCarbs += Math.round(meal.calories_target * 0.50 / 4)   // 50% carbs  
            totalFat += Math.round(meal.calories_target * 0.30 / 9)     // 30% fat
          }
        })
      }
    }
    
    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    }
  }

  const getRealMealPlanDays = (duration: number): DayPlan[] => {
    
    // First try to get data from plan_content
    if (mealPlan?.plan_content?.days && Array.isArray(mealPlan.plan_content.days)) {
      return mealPlan.plan_content.days.slice(0, duration).map((day: any, index: number) => {
        const selectedFoodsNutrition = calculateDayNutrition(day.day || index + 1)
        
        return {
          ...day,
          day: day.day || index + 1,
          meals: {
            breakfast: normalizeMealData(day.meals?.breakfast),
            lunch: normalizeMealData(day.meals?.lunch),
            dinner: normalizeMealData(day.meals?.dinner),
            snacks: normalizeMealData(day.meals?.snacks)
          },
          // Combine original nutrition with selected foods nutrition
          totalCalories: (day.totalCalories || 0) + selectedFoodsNutrition.calories,
          totalProtein: (day.totalProtein || 0) + selectedFoodsNutrition.protein,
          totalCarbs: (day.totalCarbs || 0) + selectedFoodsNutrition.carbs,
          totalFat: (day.totalFat || 0) + selectedFoodsNutrition.fat
        }
      })
    }

    // Check if plan_content has a different structure (AI generated format)
    if (mealPlan?.plan_content && mealPlan.plan_content.days) {
      const aiDays = mealPlan.plan_content.days.slice(0, duration)
      return aiDays.map((day: any, index: number) => {
        const selectedFoodsNutrition = calculateDayNutrition(day.day || index + 1)
        
        return {
          day: day.day || day.day_number || index + 1,
          date: day.date,
          meals: {
            breakfast: normalizeMealData(day.meals?.breakfast),
            lunch: normalizeMealData(day.meals?.lunch), 
            dinner: normalizeMealData(day.meals?.dinner),
            snacks: normalizeMealData(day.meals?.snacks)
          },
          notes: day.notes,
          // Combine original nutrition with selected foods nutrition
          totalCalories: (day.totalCalories || 0) + selectedFoodsNutrition.calories,
          totalProtein: (day.totalProtein || 0) + selectedFoodsNutrition.protein,
          totalCarbs: (day.totalCarbs || 0) + selectedFoodsNutrition.carbs,
          totalFat: (day.totalFat || 0) + selectedFoodsNutrition.fat
        }
      })
    }

    // Fallback: create placeholder days that will be replaced when user edits them
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
      notes: index === 0 ? "Cliquez sur 'Modifier le jour' pour personnaliser ce plan ou générez un nouveau plan avec l'IA" : undefined
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
  const dayPlans = getRealMealPlanDays(mealPlan.duration_days || 7)

  return (
    <div className="space-y-6">
      <div className="px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/meal-plans")}
              className="h-10 w-10 rounded-lg flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{mealPlan.name}</h1>
                <p className="text-sm sm:text-base text-slate-600 truncate">Pour {mealPlan.clients?.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Badge className={`${getStatusColor(mealPlan.status)} border font-medium px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm`}>
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
                <DropdownMenuItem onClick={handleSharePlan} className="rounded-md">
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

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50/80 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-500">Durée</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">{mealPlan.duration_days} jours</span>
                  </div>

                  {mealPlan.calories_range && (
                    <div className="bg-slate-50/80 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-500">Calories</span>
                      </div>
                      <span className="text-2xl font-bold text-slate-900">{mealPlan.calories_range}</span>
                    </div>
                  )}

                  <div className="bg-slate-50/80 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-500">Créé le</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">
                      {new Date(mealPlan.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div className="bg-slate-50/80 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-500">Statut</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">{getStatusText(mealPlan.status)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI-Generated Plan Nutritional Analysis */}
            {mealPlan.plan_content && typeof mealPlan.plan_content === 'object' && 'days' in mealPlan.plan_content && (mealPlan.plan_content as GeneratedMealPlan).days && (
              <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Analyse Nutritionnelle IA
                  </CardTitle>
                  <CardDescription>
                    Analyse détaillée des macronutriments et graphiques professionnels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MacronutrientBreakdown 
                    mealPlan={mealPlan.plan_content as GeneratedMealPlan} 
                    selectedFoods={selectedFoods}
                    dynamicMealFoods={dynamicMealFoods}
                  />
                </CardContent>
              </Card>
            )}

            {/* Daily Meal Plans */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5 text-slate-600" />
                      Plans repas quotidiens
                    </CardTitle>
                    <CardDescription>
                      Détail des repas pour chaque jour du plan
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs"
                    onClick={() => {
                      const nextDay = Math.max(...dayPlans.map(d => d.day), 0) + 1
                      handleEditDay(nextDay)
                    }}
                  >
                    <Target className="h-3 w-3 mr-2" />
                    Ajouter un jour
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {dayPlans.map((day) => (
                    <div key={day.day} className="border border-slate-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Jour {day.day}</h3>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-emerald-600 hover:text-emerald-700 text-xs"
                            onClick={() => handleEditDay(day.day)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Modifier le jour
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 text-xs"
                            onClick={() => handleDeleteDay(day.day)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Supprimer le jour
                          </Button>
                        </div>
                      </div>

                      {(() => {
                        // Check if we have a modern dynamic meal plan structure
                        const planContent = mealPlan.plan_content as MealPlanContent
                        
                        if (isDynamicMealPlan(planContent)) {
                          return (
                            <DynamicMealPlanDisplay 
                              planContent={planContent}
                              selectedDay={day.day}
                              onEditDay={handleEditDay}
                            />
                          )
                        } else {
                          // Fallback to legacy display for existing meal plans
                          return (
                            <LegacyMealPlanDisplay 
                              day={day}
                              onEditDay={handleEditDay}
                            />
                          )
                        }
                      })()}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:space-y-6">
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={handleViewClientProfile}
                  >
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={handleSharePlan}
                >
                  <Share2 className="mr-2 h-3 w-3" />
                  Partager avec le client
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={handleExportPDF}>
                  <Download className="mr-2 h-3 w-3" />
                  Exporter en PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={handleCreateTemplate}
                >
                  <Copy className="mr-2 h-3 w-3" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Edit Day Dialog */}
        <Dialog open={isEditDayOpen} onOpenChange={setIsEditDayOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-xl">
            <DialogHeader>
              <DialogTitle>Jour {editDayForm.day}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {(["breakfast", "lunch", "dinner", "snacks"] as const).map(slot => {
                const hourField = `${slot}Hour` as keyof EditDayForm
                const enabledField = `${slot}Enabled` as keyof EditDayForm
                return (
                  <div key={slot} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`${slot}-enabled`}
                          checked={editDayForm[enabledField] as boolean}
                          onCheckedChange={(checked) => {
                            setEditDayForm({ ...editDayForm, [enabledField]: checked })
                            // Clear selected foods when meal is unchecked
                            if (!checked) {
                              setSelectedFoods(prev => ({
                                ...prev,
                                [editDayForm.day]: {
                                  ...prev[editDayForm.day],
                                  [slot]: []
                                }
                              }))
                            }
                          }}
                        />
                        <Label htmlFor={`${slot}-enabled`} className="font-medium">
                          {slot === "breakfast" ? "Petit-déjeuner" :
                           slot === "lunch" ? "Déjeuner" :
                           slot === "dinner" ? "Dîner" : "Collation"}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <Input
                          type="time"
                          value={editDayForm[hourField] as string}
                          onChange={(e) => setEditDayForm({ ...editDayForm, [hourField]: e.target.value })}
                          className="w-24 h-10"
                          disabled={!editDayForm[enabledField]}
                        />
                      </div>
                    </div>
                    {editDayForm[enabledField] && (
                      <div className="space-y-2">
                        <Textarea
                          id={`day-${slot}`}
                          value={editDayForm[slot]}
                          onChange={e => setEditDayForm({ ...editDayForm, [slot]: e.target.value })}
                          placeholder="Repas..."
                          rows={2}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setFoodSearchSlot(slot)
                              setFoodSearchDay(editDayForm.day)
                              setFoodSearchOpen(true)
                            }}
                          >
                            + CIQUAL
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setManualFoodSlot(slot)
                              setManualFoodDay(editDayForm.day)
                              setManualFoodOpen(true)
                            }}
                          >
                            + Manuel
                          </Button>
                        </div>
                        {selectedFoods[editDayForm.day]?.[slot]?.length > 0 && (
                          <div className="mt-2">
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedFoods[editDayForm.day][slot].map((food, foodIndex) => (
                                  <div key={foodIndex} className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                                    <div className="truncate">
                                      <span className="text-emerald-800">{food.name_fr}</span>
                                      <span className="text-emerald-600 ml-2">({food.quantity}g)</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => {
                                        setSelectedFoods(prev => ({
                                          ...prev,
                                          [editDayForm.day]: {
                                            ...prev[editDayForm.day],
                                            [slot]: prev[editDayForm.day][slot].filter((_, i) => i !== foodIndex)
                                          }
                                        }))
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="space-y-2">
                <Label htmlFor="day-notes" className="font-medium">Notes</Label>
                <Textarea
                  id="day-notes"
                  value={editDayForm.notes}
                  onChange={e => setEditDayForm({ ...editDayForm, notes: e.target.value })}
                  placeholder="Notes..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDayOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveDay}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dynamic Meal Edit Dialog */}
        <DynamicMealEditDialog
          isOpen={isDynamicEditOpen}
          onClose={() => {
            setIsDynamicEditOpen(false)
            setCurrentEditDay(null)
          }}
          onSave={handleSaveDynamicDay}
          dayData={currentEditDay}
          dayNumber={editDayNumber}
          dynamicMealFoods={dynamicMealFoods}
          onRemoveFood={removeDynamicMealFood}
          dynamicMealRecipes={dynamicMealRecipes}
          onRemoveRecipe={removeDynamicMealRecipe}
          onOpenFoodSearch={(mealId, day) => {
            // Map dynamic meal types to legacy slot names for food modals
            const mealType = currentEditDay?.meals?.find(m => m.id === mealId)?.name
            
            let slot: "breakfast"|"lunch"|"dinner"|"snacks" = "breakfast"
            
            if (mealType?.includes("déjeuner") || mealType?.includes("Petit-déjeuner")) {
              slot = "breakfast"
            } else if (mealType?.includes("Déjeuner")) {
              slot = "lunch"  
            } else if (mealType?.includes("Dîner")) {
              slot = "dinner"
            } else {
              slot = "snacks"
            }
            
            setFoodSearchSlot(slot)
            setFoodSearchDay(day)
            setFoodSearchMealId(mealId)
            setFoodSearchOpen(true)
          }}
          onOpenManualFood={(mealId, day) => {
            // Map dynamic meal types to legacy slot names for food modals
            const mealType = currentEditDay?.meals?.find(m => m.id === mealId)?.name
            
            let slot: "breakfast"|"lunch"|"dinner"|"snacks" = "breakfast"
            
            if (mealType?.includes("déjeuner") || mealType?.includes("Petit-déjeuner")) {
              slot = "breakfast"
            } else if (mealType?.includes("Déjeuner")) {
              slot = "lunch"  
            } else if (mealType?.includes("Dîner")) {
              slot = "dinner"
            } else {
              slot = "snacks"
            }
            
            setManualFoodSlot(slot)
            setManualFoodDay(day)
            setManualFoodMealId(mealId)
            setManualFoodOpen(true)
          }}
        />

        {/* Food Modals - Available globally */}
        <FoodSearchModal
          open={foodSearchOpen}
          onClose={() => setFoodSearchOpen(false)}
          mealSlot={foodSearchSlot}
          day={foodSearchDay}
          onSelectFood={food => {
            if (foodSearchMealId) {
              // Add food to dynamic meal foods storage
              setDynamicMealFoods(prev => ({
                ...prev,
                [foodSearchMealId]: [...(prev[foodSearchMealId] || []), food]
              }))
              
              toast({
                title: "Aliment ajouté",
                description: `${food.name_fr} (${food.quantity}g) ajouté au repas.`
              })
            }
            setFoodSearchOpen(false)
          }}
        />
        <ManualFoodModal
          open={manualFoodOpen}
          onClose={() => setManualFoodOpen(false)}
          mealSlot={manualFoodSlot}
          day={manualFoodDay}
          onAddFood={food => {
            if (manualFoodMealId) {
              // Convert ManualFood to SelectedFood format
              const selectedFood: SelectedFood = {
                ...food,
                portionSize: 'custom' as const
              }
              
              // Add food to dynamic meal foods storage
              setDynamicMealFoods(prev => ({
                ...prev,
                [manualFoodMealId]: [...(prev[manualFoodMealId] || []), selectedFood]
              }))
              
              toast({
                title: "Aliment ajouté",
                description: `${food.name_fr} (${food.quantity}g) ajouté au repas.`
              })
            }
            setManualFoodOpen(false)
          }}
        />

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
