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
    duration_days: template?.duration_days || 7,
    target_calories: template?.target_calories || "",
    target_macros: template?.target_macros || { protein: null, carbs: null, fat: null },
    difficulty: template?.difficulty || "medium",
    tags: template?.tags || [],
    meal_structure: template?.meal_structure || [
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
    ]
  })

  const categories = [
    { value: "weight_loss", label: "Perte de poids" },
    { value: "muscle_gain", label: "Prise de masse" },
    { value: "maintenance", label: "Maintien" },
    { value: "medical", label: "Médical" },
    { value: "sports", label: "Sport" },
    { value: "wellness", label: "Bien-être" }
  ]

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
      meal_structure: prev.meal_structure.filter((_: DayStructure, i: number) => i !== dayIndex)
        .map((day: DayStructure, i: number) => ({ ...day, day: i + 1 }))
    }))
  }

  const addMeal = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      meal_structure: prev.meal_structure.map((day: DayStructure, i: number) => 
        i === dayIndex 
          ? { ...day, meals: [...day.meals, { name: "", time: "", calories_target: null, description: "" }] }
          : day
      )
    }))
  }

  const removeMeal = (dayIndex: number, mealIndex: number) => {
    setFormData(prev => ({
      ...prev,      meal_structure: prev.meal_structure.map((day: DayStructure, i: number) =>
        i === dayIndex 
          ? { ...day, meals: day.meals.filter((_: MealSlot, j: number) => j !== mealIndex) }
          : day
      )
    }))
  }

  const updateMeal = (dayIndex: number, mealIndex: number, field: keyof MealSlot, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,      meal_structure: prev.meal_structure.map((day: DayStructure, i: number) =>
        i === dayIndex 
          ? {
              ...day,
              meals: day.meals.map((meal: MealSlot, j: number) =>
                j === mealIndex ? { ...meal, [field]: value } : meal
              )
            }
          : day
      )
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
    const dayToCopy = formData.meal_structure[dayIndex]
    setFormData(prev => ({
      ...prev,
      meal_structure: [...prev.meal_structure, {
        ...dayToCopy,
        day: prev.meal_structure.length + 1
      }]
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {template ? "Modifier le modèle de plan" : "Nouveau modèle de plan"}
          </DialogTitle>
          <DialogDescription>
            {template ? "Modifiez les détails de votre modèle de plan alimentaire." : "Créez un nouveau modèle de plan alimentaire."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informations</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du modèle *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Plan perte de poids 7 jours"
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
                        {cat.label}
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
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Durée (jours)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 7 }))}
                  min="1"
                  max="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories">Calories cibles</Label>
                <Input
                  id="calories"
                  value={formData.target_calories}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_calories: e.target.value }))}
                  placeholder="1800-2000"
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
                />
                <Button variant="outline" size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Structure du plan ({formData.meal_structure.length} jours)</h3>
              <Button variant="outline" size="sm" onClick={addDay}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un jour
              </Button>
            </div>

            <div className="space-y-6">
              {formData.meal_structure.map((day: DayStructure, dayIndex: number) => (
                <Card key={dayIndex}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Jour {day.day}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateDay(dayIndex)}
                        >
                          Dupliquer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDay(dayIndex)}
                          disabled={formData.meal_structure.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {day.meals.map((meal: MealSlot, mealIndex: number) => (
                      <div key={mealIndex} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg">
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
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Calories</Label>
                          <Input
                            type="number"
                            value={meal.calories_target || ""}
                            onChange={(e) => updateMeal(dayIndex, mealIndex, "calories_target", e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="500"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Description</Label>
                          <Input
                            value={meal.description}
                            onChange={(e) => updateMeal(dayIndex, mealIndex, "description", e.target.value)}
                            placeholder="Description du repas"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMeal(dayIndex, mealIndex)}
                            disabled={day.meals.length === 1}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enregistrement..." : (template ? "Modifier" : "Créer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
