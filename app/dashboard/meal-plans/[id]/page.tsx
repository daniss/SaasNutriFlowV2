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
import { downloadMealPlanPDF, type MealPlanPDFData } from "@/lib/pdf-generator"
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
    X,
    Zap
} from "lucide-react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { type GeneratedMealPlan } from "@/lib/gemini"
import MacronutrientBreakdown from "@/components/nutrition/MacronutrientBreakdown"
const FoodSearchModal = dynamic(() => import("@/components/dashboard/FoodSearchModal"), { ssr: false })

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

  // Load selected foods from plan_content when meal plan loads
  useEffect(() => {
    if (mealPlan?.plan_content?.days) {
      const loadedSelectedFoods: Record<number, { breakfast: SelectedFood[]; lunch: SelectedFood[]; dinner: SelectedFood[]; snacks: SelectedFood[] }> = {}
      
      mealPlan.plan_content.days.forEach((day: any) => {
        if (day.selectedFoods && Object.keys(day.selectedFoods).length > 0) {
          loadedSelectedFoods[day.day] = day.selectedFoods
        }
      })
      
      if (Object.keys(loadedSelectedFoods).length > 0) {
        setSelectedFoods(loadedSelectedFoods)
      }
    }
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

      // Use downloadMealPlanPDF to actually trigger the download
      downloadMealPlanPDF(pdfData)
      
      toast({
        title: "PDF généré",
        description: "Le plan alimentaire a été exporté en PDF avec succès."
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

      // Download the PDF for the dietitian
      downloadMealPlanPDF(pdfData)

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
    // Try to get existing data from plan_content first
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

  // Helper function to calculate nutrition from selected foods for a specific day
  const calculateDayNutrition = (dayNumber: number) => {
    const dayFoods = selectedFoods[dayNumber]
    if (!dayFoods) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0
    
    Object.values(dayFoods).forEach(mealFoods => {
      mealFoods.forEach(food => {
        const factor = food.quantity / 100
        totalCalories += (food.energy_kcal || 0) * factor
        totalProtein += (food.protein_g || 0) * factor
        totalCarbs += (food.carbohydrate_g || 0) * factor
        totalFat += (food.fat_g || 0) * factor
      })
    })
    
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
                    className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    onClick={() => {
                      const nextDay = Math.max(...dayPlans.map(d => d.day), 0) + 1
                      handleEditDay(nextDay)
                    }}
                  >
                    <Target className="h-4 w-4 mr-2" />
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-emerald-600 hover:text-emerald-700"
                          onClick={() => handleEditDay(day.day)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier le jour
                        </Button>
                      </div>

                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                            <div className="h-2 w-2 bg-orange-400 rounded-full"></div>
                            Petit-déjeuner
                          </h4>
                          <ul className="space-y-1 text-sm text-slate-600 ml-4">
                            {(day.meals?.breakfast || []).map((meal: any, idx: number) => (
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
                            {(day.meals?.lunch || []).map((meal: any, idx: number) => (
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
                            {(day.meals?.dinner || []).map((meal: any, idx: number) => (
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
                            {(day.meals?.snacks || []).map((meal: any, idx: number) => (
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
                    className="w-full"
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
                  className="w-full justify-start"
                  onClick={handleSharePlan}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager avec le client
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter en PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleCreateTemplate}
                >
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
        <DialogContent className="sm:max-w-[800px] rounded-xl">
            <DialogHeader>
              <DialogTitle>Modifier le jour {editDayForm.day}</DialogTitle>
              <DialogDescription>
                Personnaliser les repas et collations pour ce jour spécifique.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              {(["breakfast", "lunch", "dinner", "snacks"] as const).map(slot => {
                const hourField = `${slot}Hour` as keyof EditDayForm
                const enabledField = `${slot}Enabled` as keyof EditDayForm
                return (
                  <div key={slot} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${slot}-enabled`}
                          checked={editDayForm[enabledField] as boolean}
                          onCheckedChange={(checked) => 
                            setEditDayForm({ ...editDayForm, [enabledField]: checked })
                          }
                        />
                        <Label htmlFor={`${slot}-enabled`} className="text-sm font-medium">
                          {slot === "breakfast" ? "Petit-déjeuner" :
                           slot === "lunch" ? "Déjeuner" :
                           slot === "dinner" ? "Dîner" : "Collations"}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <Input
                          type="time"
                          value={editDayForm[hourField] as string}
                          onChange={(e) => setEditDayForm({ ...editDayForm, [hourField]: e.target.value })}
                          className="w-20 h-7 text-xs"
                          disabled={!editDayForm[enabledField]}
                        />
                      </div>
                    </div>
                    {editDayForm[enabledField] && (
                      <div className="space-y-1">
                        <Textarea
                          id={`day-${slot}`}
                          value={editDayForm[slot]}
                          onChange={e => setEditDayForm({ ...editDayForm, [slot]: e.target.value })}
                          placeholder={
                            slot === "breakfast" ? "Ex: Yaourt grec aux baies et granola" :
                            slot === "lunch" ? "Ex: Salade de poulet grillé au quinoa" :
                            slot === "dinner" ? "Ex: Saumon grillé aux légumes rôtis" : "Ex: Tranches de pomme au beurre d'amande"
                          }
                          rows={1}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1 text-xs h-7"
                          onClick={() => {
                            setFoodSearchSlot(slot)
                            setFoodSearchDay(editDayForm.day)
                            setFoodSearchOpen(true)
                          }}
                        >
                          + Ajouter aliment
                        </Button>
                        <div className="mt-1">
                          {selectedFoods[editDayForm.day]?.[slot]?.length > 0 && (
                            <div className="space-y-0.5">
                              <div className="text-xs text-slate-600 font-medium mb-1">Aliments ajoutés:</div>
                              <div className="space-y-0.5 max-h-16 overflow-y-auto">
                                {selectedFoods[editDayForm.day][slot].map((food, foodIndex) => (
                                  <div key={foodIndex} className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                                    <div className="text-xs">
                                      <span className="font-medium text-emerald-800">{food.name_fr}</span>
                                      <span className="text-emerald-600 ml-1">({food.quantity}g)</span>
                                      <span className="text-emerald-600 ml-1">• {Math.round((food.energy_kcal || 0) * food.quantity / 100)} kcal</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="space-y-1">
                <Label htmlFor="day-notes">Notes (optionnel)</Label>
                <Textarea
                  id="day-notes"
                  value={editDayForm.notes}
                  onChange={e => setEditDayForm({ ...editDayForm, notes: e.target.value })}
                  placeholder="Conseils ou instructions spécifiques pour ce jour"
                  rows={2}
                />
              </div>
            </div>
            <FoodSearchModal
              open={foodSearchOpen}
              onClose={() => setFoodSearchOpen(false)}
              mealSlot={foodSearchSlot}
              day={foodSearchDay}
              onSelectFood={food => {
                setSelectedFoods(prev => ({
                  ...prev,
                  [foodSearchDay]: {
                    ...prev[foodSearchDay],
                    [foodSearchSlot]: [
                      ...(prev[foodSearchDay]?.[foodSearchSlot] || []),
                      food
                    ]
                  }
                }))
                setFoodSearchOpen(false)
              }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDayOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveDay}>
                Enregistrer les modifications
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
