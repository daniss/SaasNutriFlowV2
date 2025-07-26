"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Plus, Calendar, Utensils, BookOpen, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase, type MealPlanTemplate } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuthNew"
import { RecipeSearchModal } from "@/components/meal-plans/RecipeSearchModal"
import { 
  MEAL_PLAN_CATEGORIES, 
  CLIENT_TYPES, 
  GOAL_TYPES,
  getCategoryInfo,
  getClientTypeInfo,
  getGoalTypeInfo,
  suggestCategoriesForClient
} from "@/lib/template-categories"

interface MealPlanTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (template: MealPlanTemplate) => void
  template?: MealPlanTemplate
}

interface MealSlot {
  name: string
  time: string
  calories_target: number | null
  description: string
  recipe_id?: string | null
}

interface DayStructure {
  day: number
  meals: MealSlot[]
}

// Professional limits for nutritionist workflows
const MAX_MEALS_PER_DAY = 8

export default function MealPlanTemplateDialog({ isOpen, onClose, onSave, template }: MealPlanTemplateDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentTag, setCurrentTag] = useState("")
  const [activeDay, setActiveDay] = useState(1)
  
  const [formData, setFormData] = useState({
    name: template?.name || "",
    description: template?.description || "",
    category: template?.category || "",
    client_type: template?.client_type || "general",
    goal_type: template?.goal_type || "general",
    target_calories: template?.target_calories || "",
    target_macros: (template?.target_macros && typeof template.target_macros === 'object' && !Array.isArray(template.target_macros)) 
      ? template.target_macros as { protein: number | null, carbs: number | null, fat: number | null }
      : { protein: null, carbs: null, fat: null },
    difficulty: template?.difficulty || "medium",
    tags: template?.tags || [],
    meal_structure: (Array.isArray(template?.meal_structure) ? template.meal_structure as unknown as DayStructure[] : [
      {
        day: 1,
        meals: [
          { name: "Petit-déjeuner", time: "08:00", calories_target: null, description: "" },
          { name: "Collation matin", time: "10:30", calories_target: null, description: "" },
          { name: "Déjeuner", time: "12:30", calories_target: null, description: "" },
          { name: "Collation après-midi", time: "16:00", calories_target: null, description: "" },
          { name: "Dîner", time: "19:00", calories_target: null, description: "" }
        ]
      }
    ] as DayStructure[])
  })

  // Recipe selection state
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)
  const [selectedMealIndex, setSelectedMealIndex] = useState<number | null>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)

  const categories = Object.entries(MEAL_PLAN_CATEGORIES).map(([key, value]) => ({
    value: key,
    label: value.label,
    description: value.description
  }))

  const clientTypes = Object.entries(CLIENT_TYPES).map(([key, value]) => ({
    value: key,
    label: value.label,
    description: value.description
  }))

  const goalTypes = Object.entries(GOAL_TYPES).map(([key, value]) => ({
    value: key,
    label: value.label,
    description: value.description
  }))

  const mealTypes = [
    "Petit-déjeuner", "Collation matin", "Déjeuner", "Collation après-midi", 
    "Dîner", "Collation soir", "Pré-entraînement", "Post-entraînement"
  ]

  const handleSubmit = async () => {
    if (!user || !formData.name || !formData.category) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    // Validate that all meals have a selected meal type
    const invalidMeals: string[] = []
    if (Array.isArray(formData.meal_structure)) {
      formData.meal_structure.forEach((day: DayStructure, dayIndex: number) => {
        if (Array.isArray(day.meals)) {
          day.meals.forEach((meal: MealSlot, mealIndex: number) => {
            if (!meal.name || meal.name.trim() === "") {
              invalidMeals.push(`Jour ${day.day}, Repas ${mealIndex + 1}`)
            }
          })
        }
      })
    }

    if (invalidMeals.length > 0) {
      toast({
        title: "Validation requise",
        description: `Veuillez sélectionner un type de repas pour: ${invalidMeals.join(', ')}. Tous les repas doivent avoir un type sélectionné pour pouvoir utiliser ce modèle.`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Calculate duration_days based on the number of days in meal_structure
      const calculatedDuration = Array.isArray(formData.meal_structure) ? formData.meal_structure.length : 1

      const templateData = {
        dietitian_id: user.id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        client_type: formData.client_type,
        health_condition: null, // Optional field, can be added to form later
        goal_type: formData.goal_type,
        duration_days: calculatedDuration,
        target_calories: formData.target_calories || null,
        target_macros: formData.target_macros,
        meal_structure: formData.meal_structure,
        tags: formData.tags,
        difficulty: formData.difficulty,
        rating: template?.rating || null,
        usage_count: template?.usage_count || 0,
        is_favorite: template?.is_favorite || false,
        is_public: template?.is_public || false
      }

      let result
      if (template) {
        result = await supabase
          .from("meal_plan_templates")
          .update(templateData)
          .eq("id", template.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from("meal_plan_templates")
          .insert(templateData)
          .select()
          .single()
      }

      if (result.error) throw result.error

      onSave(result.data)
      onClose()
      toast({
        title: "Succès",
        description: `Modèle de plan ${template ? "modifié" : "créé"} avec succès`,
      })
    } catch (error) {
      console.error("Error saving meal plan template:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le modèle",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addDay = () => {
    const newDay = formData.meal_structure.length + 1
    setFormData(prev => ({
      ...prev,
      meal_structure: [...prev.meal_structure, {
        day: newDay,
        meals: [
          { name: "Petit-déjeuner", time: "08:00", calories_target: null, description: "" },
          { name: "Déjeuner", time: "12:30", calories_target: null, description: "" },
          { name: "Dîner", time: "19:00", calories_target: null, description: "" }
        ]
      }]
    }))
    setActiveDay(newDay) // Switch to the newly created day
  }

  const removeDay = (dayIndex: number) => {
    const dayToRemove = formData.meal_structure[dayIndex]
    setFormData(prev => ({
      ...prev,
      meal_structure: Array.isArray(prev.meal_structure) 
        ? prev.meal_structure.filter((_: DayStructure, i: number) => i !== dayIndex)
            .map((day: DayStructure, i: number) => ({ ...day, day: i + 1 }))
        : []
    }))
    
    // Adjust activeDay if needed
    if (dayToRemove && activeDay === dayToRemove.day) {
      const newDayCount = formData.meal_structure.length - 1
      setActiveDay(Math.min(activeDay, newDayCount))
    } else if (dayToRemove && activeDay > dayToRemove.day) {
      setActiveDay(activeDay - 1)
    }
  }

  const addMeal = () => {
    const activeDayIndex = getActiveDayIndex()
    if (activeDayIndex === -1) return
    
    setFormData(prev => ({
      ...prev,
      meal_structure: Array.isArray(prev.meal_structure) 
        ? prev.meal_structure.map((day: DayStructure, i: number) => {
            if (i === activeDayIndex) {
              const currentMeals = day.meals || []
              if (currentMeals.length >= MAX_MEALS_PER_DAY) {
                // Show user-friendly message
                toast({
                  title: "Limite atteinte",
                  description: `Maximum ${MAX_MEALS_PER_DAY} repas par jour pour maintenir une structure claire et professionnelle.`,
                  variant: "default",
                })
                return day // Don't add meal if limit reached
              }
              return { ...day, meals: [...currentMeals, { name: "", time: "", calories_target: null, description: "", recipe_id: null }] }
            }
            return day
          })
        : []
    }))
  }

  const removeMeal = (mealIndex: number) => {
    const activeDayIndex = getActiveDayIndex()
    if (activeDayIndex === -1) return
    
    setFormData(prev => ({
      ...prev,
      meal_structure: Array.isArray(prev.meal_structure) 
        ? prev.meal_structure.map((day: DayStructure, i: number) =>
        i === activeDayIndex 
          ? { ...day, meals: (day.meals || []).filter((_: MealSlot, j: number) => j !== mealIndex) }
          : day
      )
        : []
    }))
  }

  const updateMeal = (mealIndex: number, field: keyof MealSlot, value: string | number | null) => {
    const activeDayIndex = getActiveDayIndex()
    if (activeDayIndex === -1) return
    
    setFormData(prev => ({
      ...prev,
      meal_structure: Array.isArray(prev.meal_structure) 
        ? prev.meal_structure.map((day: DayStructure, i: number) =>
            i === activeDayIndex 
              ? {
                  ...day,
                  meals: (day.meals || []).map((meal: MealSlot, j: number) =>
                    j === mealIndex ? { ...meal, [field]: value } : meal
                  )
                }
              : day
          )
        : []
    }))
  }

  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag]
      }))
      setCurrentTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const duplicateActiveDay = () => {
    const activeDayIndex = getActiveDayIndex()
    if (activeDayIndex === -1 || !Array.isArray(formData.meal_structure)) return
    
    const dayToCopy = formData.meal_structure[activeDayIndex]
    const newDayNumber = formData.meal_structure.length + 1
    
    setFormData(prev => ({
      ...prev,
      meal_structure: Array.isArray(prev.meal_structure) 
        ? [...prev.meal_structure, {
            ...dayToCopy,
            day: newDayNumber
          }]
        : []
    }))
    setActiveDay(newDayNumber) // Switch to the duplicated day
  }

  // Helper functions for tabbed interface
  const getActiveDayData = () => {
    if (!Array.isArray(formData.meal_structure)) return null
    return formData.meal_structure.find(day => day.day === activeDay) || null
  }

  const handleRecipeSelect = (recipe: any) => {
    if (selectedDayIndex !== null && selectedMealIndex !== null) {
      const dayIndex = selectedDayIndex
      const mealIndex = selectedMealIndex
      
      setFormData(prev => ({
        ...prev,
        meal_structure: Array.isArray(prev.meal_structure) 
          ? prev.meal_structure.map((day: DayStructure, i: number) =>
              i === dayIndex 
                ? {
                    ...day,
                    meals: (day.meals || []).map((meal: MealSlot, j: number) =>
                      j === mealIndex 
                        ? { 
                            ...meal, 
                            recipe_id: recipe.id,
                            description: recipe.name,
                            calories_target: recipe.calories_per_serving || meal.calories_target
                          } 
                        : meal
                    )
                  }
                : day
            )
          : []
      }))
      
      setIsRecipeModalOpen(false)
      setSelectedMealIndex(null)
      setSelectedDayIndex(null)
      
      toast({
        title: "Recette ajoutée",
        description: `${recipe.name} a été ajoutée au repas.`
      })
    }
  }

  const openRecipeModal = (dayIndex: number, mealIndex: number) => {
    setSelectedDayIndex(dayIndex)
    setSelectedMealIndex(mealIndex)
    setIsRecipeModalOpen(true)
  }

  const getActiveDayIndex = () => {
    if (!Array.isArray(formData.meal_structure)) return -1
    return formData.meal_structure.findIndex(day => day.day === activeDay)
  }

  const copyDayTo = (sourceDayIndex: number, targetDay: number) => {
    if (!Array.isArray(formData.meal_structure) || !formData.meal_structure[sourceDayIndex]) return
    
    const dayToCopy = formData.meal_structure[sourceDayIndex]
    const targetDayIndex = formData.meal_structure.findIndex(d => d.day === targetDay)
    
    if (targetDayIndex >= 0) {
      // Replace existing day
      setFormData(prev => ({
        ...prev,
        meal_structure: prev.meal_structure.map((day, i) => 
          i === targetDayIndex ? { ...dayToCopy, day: targetDay } : day
        )
      }))
    } else {
      // Add new day
      setFormData(prev => ({
        ...prev,
        meal_structure: [...prev.meal_structure, { ...dayToCopy, day: targetDay }]
          .sort((a, b) => a.day - b.day)
      }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[1000px] lg:max-w-[1200px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calendar className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{template ? "Modifier le modèle de plan" : "Nouveau modèle de plan"}</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            {template ? "Modifiez les détails de votre modèle de plan alimentaire." : "Créez un nouveau modèle de plan alimentaire."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 bg-muted p-1 rounded-lg h-auto">
            <TabsTrigger value="basic" className="text-xs sm:text-sm data-[state=active]:bg-background">
              <span className="hidden sm:inline">Informations</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="structure" className="text-xs sm:text-sm data-[state=active]:bg-background">
              <span className="hidden sm:inline">Structure</span>
              <span className="sm:hidden">Structure</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="text-xs sm:text-sm data-[state=active]:bg-background">
              <span className="hidden sm:inline">Nutrition</span>
              <span className="sm:hidden">Nutrition</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du modèle *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Plan perte de poids 7 jours"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{cat.label}</span>
                          <span className="text-sm text-gray-500">{cat.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_type">Type de client</Label>
                <Select value={formData.client_type} onValueChange={(value) => setFormData(prev => ({ ...prev, client_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{type.label}</span>
                          <span className="text-sm text-gray-500">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="goal_type">Type d'objectif</Label>
                <Select value={formData.goal_type} onValueChange={(value) => setFormData(prev => ({ ...prev, goal_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un objectif" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map(goal => (
                      <SelectItem key={goal.value} value={goal.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{goal.label}</span>
                          <span className="text-sm text-gray-500">{goal.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez l'objectif et les caractéristiques de ce plan..."
                rows={3}
                className="text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories cibles</Label>
                <Input
                  id="calories"
                  value={formData.target_calories}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_calories: e.target.value }))}
                  placeholder="1800-2000"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulté</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Facile</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="hard">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Ajouter un tag"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  className="text-base"
                />
                <Button variant="outline" size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="space-y-4">
            {/* Header with day count and controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold">Structure du plan ({Array.isArray(formData.meal_structure) ? formData.meal_structure.length : 0} jours)</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={duplicateActiveDay} disabled={!getActiveDayData()} className="flex-shrink-0">
                  <span className="hidden sm:inline">Dupliquer jour</span>
                  <span className="sm:hidden">Dupliquer</span>
                </Button>
                <Button variant="outline" size="sm" onClick={addDay} className="flex-shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ajouter un jour</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              </div>
            </div>

            {/* Information box about meal type requirement */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Type de repas obligatoire</p>
                <p className="text-xs text-blue-700 mt-1">
                  Chaque repas doit avoir un type sélectionné (Petit-déjeuner, Déjeuner, etc.) pour pouvoir utiliser ce modèle dans la création de plans alimentaires.
                </p>
              </div>
            </div>

            {Array.isArray(formData.meal_structure) && formData.meal_structure.length > 0 ? (
              <div className="space-y-4">
                {/* Day Navigation Tabs */}
                <div className="overflow-x-auto border-b border-gray-200 pb-3">
                  <div className="flex gap-2 min-w-max">
                    {(formData.meal_structure as DayStructure[]).map((day: DayStructure) => (
                      <button
                        key={day.day}
                        onClick={() => setActiveDay(day.day)}
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                          activeDay === day.day
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Jour {day.day}</span>
                        <Badge variant="outline" className="text-xs h-5 px-1.5">
                          {day.meals?.length || 0}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overview Bar showing meal counts per day */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                    <span className="font-medium text-gray-700">Aperçu des repas par jour :</span>
                    <div className="flex flex-wrap gap-2 sm:gap-4">
                      {(formData.meal_structure as DayStructure[]).map((day: DayStructure) => (
                        <div key={day.day} className="flex items-center gap-1 text-gray-600">
                          <span>J{day.day}:</span>
                          <Badge variant="outline" className="text-xs">
                            {day.meals?.length || 0}/{MAX_MEALS_PER_DAY}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active Day Panel */}
                {getActiveDayData() && (
                  <Card className="border-emerald-200 bg-emerald-50/50">
                    <CardHeader className="bg-emerald-100/50 rounded-t-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-600" />
                            <CardTitle className="text-lg text-emerald-800">Jour {activeDay}</CardTitle>
                          </div>
                          <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-300">
                            {(getActiveDayData() as DayStructure)?.meals?.length || 0} repas
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDay(getActiveDayIndex())}
                          disabled={formData.meal_structure.length === 1}
                          className="bg-white hover:bg-red-50 border-red-300 text-red-600 hover:border-red-400"
                        >
                          <X className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Supprimer jour</span>
                          <span className="sm:hidden">Supprimer</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 bg-white p-3 sm:p-6">
                      {/* Meals Grid - 3 columns for cleaner layout */}
                      <div className="space-y-4">
                        {((getActiveDayData() as DayStructure)?.meals || []).map((meal: MealSlot, mealIndex: number) => (
                          <div key={mealIndex} className="space-y-3 p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                            {/* Basic Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">
                                  Type de repas *
                                  {(!meal.name || meal.name.trim() === "") && (
                                    <span className="text-red-500 text-xs ml-1">(requis)</span>
                                  )}
                                </Label>
                                <Select 
                                  value={meal.name} 
                                  onValueChange={(value) => updateMeal(mealIndex, "name", value)}
                                >
                                  <SelectTrigger className={(!meal.name || meal.name.trim() === "") ? "border-red-300 focus:border-red-500" : ""}>
                                    <SelectValue placeholder="Sélectionner..." />
                                  </SelectTrigger>
                                  <SelectContent className="max-w-[300px]">
                                    {mealTypes.map(type => (
                                      <SelectItem key={type} value={type} className="text-sm">{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Heure</Label>
                                <Input
                                  type="time"
                                  value={meal.time}
                                  onChange={(e) => updateMeal(mealIndex, "time", e.target.value)}
                                  className="text-base"
                                />
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Calories cibles</Label>
                                <Input
                                  type="number"
                                  value={meal.calories_target || ""}
                                  onChange={(e) => updateMeal(mealIndex, "calories_target", e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder="500"
                                  className="text-base"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Description</Label>
                                <Input
                                  value={meal.description}
                                  onChange={(e) => updateMeal(mealIndex, "description", e.target.value)}
                                  placeholder="Description du repas"
                                  className="text-base"
                                />
                              </div>
                            </div>
                              
                            {/* Recipe Selection */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Recette</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openRecipeModal(getActiveDayIndex(), mealIndex)}
                                className="w-full justify-start"
                              >
                                {meal.recipe_id ? (
                                  <>
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    {meal.description || "Recette sélectionnée"}
                                  </>
                                ) : (
                                  <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Choisir une recette
                                  </>
                                )}
                              </Button>
                              {meal.recipe_id && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateMeal(mealIndex, "recipe_id", null)}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Retirer la recette
                                </Button>
                              )}
                            </div>

                            {/* Meal Info and Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex flex-wrap gap-2">
                                {meal.name && (
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                                    {meal.name}
                                  </Badge>
                                )}
                                {meal.calories_target && (
                                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                                    {meal.calories_target} kcal
                                  </Badge>
                                )}
                                {meal.time && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                                    {meal.time}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMeal(mealIndex)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 self-start sm:self-center flex-shrink-0"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Add Meal Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addMeal}
                          disabled={((getActiveDayData() as DayStructure)?.meals?.length || 0) >= MAX_MEALS_PER_DAY}
                          className={`w-full border-2 border-dashed transition-all duration-200 ${
                            ((getActiveDayData() as DayStructure)?.meals?.length || 0) >= MAX_MEALS_PER_DAY 
                              ? "opacity-50 cursor-not-allowed border-gray-300" 
                              : "border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700"
                          }`}
                          title={((getActiveDayData() as DayStructure)?.meals?.length || 0) >= MAX_MEALS_PER_DAY ? `Maximum ${MAX_MEALS_PER_DAY} repas par jour atteint` : "Ajouter un repas"}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {((getActiveDayData() as DayStructure)?.meals?.length || 0) >= MAX_MEALS_PER_DAY 
                            ? `Limite atteinte (${((getActiveDayData() as DayStructure)?.meals?.length || 0)}/${MAX_MEALS_PER_DAY})` 
                            : `Ajouter un repas (${((getActiveDayData() as DayStructure)?.meals?.length || 0)}/${MAX_MEALS_PER_DAY})`
                          }
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun jour configuré</h3>
                <p className="text-gray-600 mb-4">Commencez par ajouter le premier jour de votre plan alimentaire.</p>
                <Button onClick={addDay} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter le premier jour
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="protein">Protéines cibles (%)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={(formData.target_macros as any)?.protein || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    target_macros: { ...(prev.target_macros as any), protein: e.target.value ? parseInt(e.target.value) : null }
                  }))}
                  placeholder="25"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Glucides cibles (%)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={(formData.target_macros as any)?.carbs || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    target_macros: { ...(prev.target_macros as any), carbs: e.target.value ? parseInt(e.target.value) : null }
                  }))}
                  placeholder="45"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">Lipides cibles (%)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={(formData.target_macros as any)?.fat || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    target_macros: { ...(prev.target_macros as any), fat: e.target.value ? parseInt(e.target.value) : null }
                  }))}
                  placeholder="30"
                  className="text-base"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Conseils nutritionnels</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Les pourcentages de macros doivent totaliser 100%</li>
                <li>• Ajustez les calories par repas selon les besoins du client</li>
                <li>• Considérez l'activité physique dans les recommandations</li>
                <li>• Pensez à inclure des collations si nécessaire</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 sm:flex-none">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 sm:flex-none">
            {loading ? "Enregistrement..." : (template ? "Modifier" : "Créer")}
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Recipe Search Modal */}
      <RecipeSearchModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        onSelectRecipe={handleRecipeSelect}
        excludeRecipeIds={[]}
      />
    </Dialog>
  )
}
