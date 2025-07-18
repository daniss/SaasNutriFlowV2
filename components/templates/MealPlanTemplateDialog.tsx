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
import { X, Plus, Calendar, Utensils } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase, type MealPlanTemplate } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuthNew"
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
}

interface DayStructure {
  day: number
  meals: MealSlot[]
}

export default function MealPlanTemplateDialog({ isOpen, onClose, onSave, template }: MealPlanTemplateDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentTag, setCurrentTag] = useState("")
  
  const [formData, setFormData] = useState({
    name: template?.name || "",
    description: template?.description || "",
    category: template?.category || "",
    client_type: template?.client_type || "general",
    goal_type: template?.goal_type || "general",
    duration_days: template?.duration_days || 7,
    target_calories: template?.target_calories || "",
    target_macros: template?.target_macros || { protein: null, carbs: null, fat: null },
    difficulty: template?.difficulty || "medium",
    tags: template?.tags || [],
    meal_structure: (Array.isArray(template?.meal_structure) ? template.meal_structure : [
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
    ])
  })

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

    setLoading(true)
    try {
      const templateData = {
        dietitian_id: user.id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        client_type: formData.client_type,
        health_condition: null, // Optional field, can be added to form later
        goal_type: formData.goal_type,
        duration_days: formData.duration_days,
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
  }

  const removeDay = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      meal_structure: Array.isArray(prev.meal_structure) 
        ? prev.meal_structure.filter((_: DayStructure, i: number) => i !== dayIndex)
            .map((day: DayStructure, i: number) => ({ ...day, day: i + 1 }))
        : []
    }))
  }

  const addMeal = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      meal_structure: Array.isArray(prev.meal_structure) 
        ? prev.meal_structure.map((day: DayStructure, i: number) => 
            i === dayIndex 
              ? { ...day, meals: [...(day.meals || []), { name: "", time: "", calories_target: null, description: "" }] }
              : day
          )
        : []
    }))
  }

  const removeMeal = (dayIndex: number, mealIndex: number) => {
    setFormData(prev => ({
      ...prev,
      meal_structure: Array.isArray(prev.meal_structure) 
        ? prev.meal_structure.map((day: DayStructure, i: number) =>
        i === dayIndex 
          ? { ...day, meals: (day.meals || []).filter((_: MealSlot, j: number) => j !== mealIndex) }
          : day
      )
        : []
    }))
  }

  const updateMeal = (dayIndex: number, mealIndex: number, field: keyof MealSlot, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      meal_structure: Array.isArray(prev.meal_structure) 
        ? prev.meal_structure.map((day: DayStructure, i: number) =>
            i === dayIndex 
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

  const duplicateDay = (dayIndex: number) => {
    if (!Array.isArray(formData.meal_structure) || !formData.meal_structure[dayIndex]) {
      return
    }
    const dayToCopy = formData.meal_structure[dayIndex]
    setFormData(prev => ({
      ...prev,
      meal_structure: Array.isArray(prev.meal_structure) 
        ? [...prev.meal_structure, {
            ...dayToCopy,
            day: prev.meal_structure.length + 1
          }]
        : []
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Durée (jours)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 7 }))}
                  min="1"
                  max="30"
                  className="text-base"
                />
              </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold">Structure du plan ({Array.isArray(formData.meal_structure) ? formData.meal_structure.length : 0} jours)</h3>
              <Button variant="outline" size="sm" onClick={addDay} className="flex-shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Ajouter un jour</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            </div>

            <div className="space-y-6">
              {Array.isArray(formData.meal_structure) && formData.meal_structure.map((day: DayStructure, dayIndex: number) => (
                <Card key={dayIndex}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <CardTitle className="text-lg">Jour {day.day}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateDay(dayIndex)}
                        >
                          <span className="hidden sm:inline">Dupliquer</span>
                          <span className="sm:hidden">Dup.</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDay(dayIndex)}
                          disabled={!Array.isArray(formData.meal_structure) || formData.meal_structure.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {day.meals.map((meal: MealSlot, mealIndex: number) => (
                      <div key={mealIndex} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-sm">Repas</Label>
                          <Select 
                            value={meal.name} 
                            onValueChange={(value) => updateMeal(dayIndex, mealIndex, "name", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Type de repas" />
                            </SelectTrigger>
                            <SelectContent>
                              {mealTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Heure</Label>
                          <Input
                            type="time"
                            value={meal.time}
                            onChange={(e) => updateMeal(dayIndex, mealIndex, "time", e.target.value)}
                            className="text-base"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Calories</Label>
                          <Input
                            type="number"
                            value={meal.calories_target || ""}
                            onChange={(e) => updateMeal(dayIndex, mealIndex, "calories_target", e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="500"
                            className="text-base"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Description</Label>
                          <Input
                            value={meal.description}
                            onChange={(e) => updateMeal(dayIndex, mealIndex, "description", e.target.value)}
                            placeholder="Description du repas"
                            className="text-base"
                          />
                        </div>
                        <div className="flex items-end lg:items-center lg:justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMeal(dayIndex, mealIndex)}
                            disabled={day.meals.length === 1}
                            className="w-full lg:w-auto"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addMeal(dayIndex)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un repas
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="protein">Protéines cibles (%)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={formData.target_macros.protein || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    target_macros: { ...prev.target_macros, protein: e.target.value ? parseInt(e.target.value) : null }
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
                  value={formData.target_macros.carbs || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    target_macros: { ...prev.target_macros, carbs: e.target.value ? parseInt(e.target.value) : null }
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
                  value={formData.target_macros.fat || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    target_macros: { ...prev.target_macros, fat: e.target.value ? parseInt(e.target.value) : null }
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
    </Dialog>
  )
}
