"use client"

import FoodSearchModal from "@/components/dashboard/FoodSearchModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuthNew"
import { supabase, type RecipeTemplate } from "@/lib/supabase"
import { ChefHat, Plus, X } from "lucide-react"
import { useState } from "react"

interface RecipeTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (template: RecipeTemplate) => void
  template?: RecipeTemplate
}

interface Ingredient {
  name: string
  amount: string
  unit: string
}

interface Instruction {
  step: number
  text: string
}



export default function RecipeTemplateDialog({ isOpen, onClose, onSave, template }: RecipeTemplateDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentTag, setCurrentTag] = useState("")
  
  // Helper functions to safely cast JSON types
  const safeArrayCast = (value: any, defaultValue: any[] = []): any[] => {
    return Array.isArray(value) ? value : defaultValue
  }
  
  const safeObjectCast = (value: any, defaultValue: any = {}): any => {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : defaultValue
  }
  
  const [formData, setFormData] = useState({
    name: template?.name || "",
    description: template?.description || "",
    category: template?.category || "",
    dietary_type: safeArrayCast(template?.dietary_type, []),
    preparation_time: template?.preparation_time || null,
    cooking_time: template?.cooking_time || null,
    servings: template?.servings || 1,
    calories_per_serving: template?.calories_per_serving || null,
    difficulty: template?.difficulty || "medium",
    tags: safeArrayCast(template?.tags, []),
    ingredients: safeArrayCast(template?.ingredients, [{ name: "", amount: "", unit: "" }]),
    instructions: safeArrayCast(template?.instructions, [{ step: 1, text: "" }]),
    macros: safeObjectCast(template?.macros, { protein: null, carbs: null, fat: null, fiber: null }),
    source: template?.source || ""
  })

  const categories = [
    { value: "breakfast", label: "Petit-déjeuner" },
    { value: "lunch", label: "Déjeuner" },
    { value: "dinner", label: "Dîner" },
    { value: "snack", label: "Collation" },
    { value: "dessert", label: "Dessert" },
    { value: "side", label: "Accompagnement" },
    { value: "drink", label: "Boisson" }
  ]

  const dietaryTypes = [
    "Végétarien", "Végétalien", "Sans gluten", "Sans lactose", "Cétogène", 
    "Paléo", "Méditerranéen", "Faible en sodium", "Riche en protéines", "Faible en glucides"
  ]

  const units = [
    "g", "kg", "ml", "l", "tasse", "cuillère à soupe", "cuillère à café", 
    "pièce", "tranche", "pincée", "dose", "sachet", "boîte", "paquet"
  ]
    // Nutrition summary calculation
  function getNutritionSummary() {
    let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0
    let micronutrients: Record<string, number> = {}
    formData.ingredients.forEach((ing: any) => {
      calories += ing.energy_kcal ? Number(ing.energy_kcal) : 0
      protein += ing.protein_g ? Number(ing.protein_g) : 0
      carbs += ing.carbohydrate_g ? Number(ing.carbohydrate_g) : 0
      fat += ing.fat_g ? Number(ing.fat_g) : 0
      fiber += ing.fiber_g ? Number(ing.fiber_g) : 0
      // Example micronutrients
      if (ing.calcium_mg) micronutrients.calcium_mg = (micronutrients.calcium_mg || 0) + Number(ing.calcium_mg)
      if (ing.iron_mg) micronutrients.iron_mg = (micronutrients.iron_mg || 0) + Number(ing.iron_mg)
      if (ing.magnesium_mg) micronutrients.magnesium_mg = (micronutrients.magnesium_mg || 0) + Number(ing.magnesium_mg)
      if (ing.vitamin_c_mg) micronutrients.vitamin_c_mg = (micronutrients.vitamin_c_mg || 0) + Number(ing.vitamin_c_mg)
      // ...add more as needed
    })
    return { calories, protein, carbs, fat, fiber, micronutrients }
  }

  const nutrition = getNutritionSummary()
          {/* Nutrition Summary */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Résumé nutritionnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div><b>Calories:</b> {nutrition.calories} kcal</div>
                <div><b>Protéines:</b> {nutrition.protein} g</div>
                <div><b>Glucides:</b> {nutrition.carbs} g</div>
                <div><b>Lipides:</b> {nutrition.fat} g</div>
                <div><b>Fibres:</b> {nutrition.fiber} g</div>
              </div>
              <div className="mt-2">
                <b>Micronutriments clés:</b>
                <ul className="list-disc ml-6">
                  {Object.entries(nutrition.micronutrients).map(([key, value]) => (
                    <li key={key}>{key.replace(/_/g, ' ')}: {value}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
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
        dietary_type: formData.dietary_type,
        preparation_time: formData.preparation_time,
        cooking_time: formData.cooking_time,
        servings: formData.servings,
        calories_per_serving: formData.calories_per_serving,
        macros: formData.macros,
        ingredients: formData.ingredients.filter((ing: Ingredient) => ing.name && ing.amount),
        instructions: formData.instructions.filter((inst: Instruction) => inst.text),
        tags: formData.tags,
        difficulty: formData.difficulty,
        source: formData.source || null,
        rating: template?.rating || null,
        usage_count: template?.usage_count || 0,
        is_favorite: template?.is_favorite || false,
        is_public: template?.is_public || false
      }

      let result
      if (template) {
        // Update existing template
        result = await supabase
          .from("recipe_templates")
          .update(templateData)
          .eq("id", template.id)
          .select()
          .single()
      } else {
        // Create new template
        result = await supabase
          .from("recipe_templates")
          .insert(templateData)
          .select()
          .single()
      }

      if (result.error) throw result.error

      onSave(result.data)
      onClose()
      toast({
        title: "Succès",
        description: `Recette ${template ? "modifiée" : "créée"} avec succès`,
      })
    } catch (error) {
      console.error("Error saving recipe template:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la recette",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: "", amount: "", unit: "" }]
    }))
  }

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_: Ingredient, i: number) => i !== index)
    }))
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing: Ingredient, i: number) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }))
  }

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, { step: prev.instructions.length + 1, text: "" }]
    }))
  }

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_: Instruction, i: number) => i !== index)
        .map((inst: Instruction, i: number) => ({ ...inst, step: i + 1 }))
    }))
  }

  const updateInstruction = (index: number, text: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst: Instruction, i: number) => 
        i === index ? { ...inst, text } : inst
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

  const toggleDietaryType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      dietary_type: prev.dietary_type.includes(type)
        ? prev.dietary_type.filter(t => t !== type)
        : [...prev.dietary_type, type]
    }))
  }

  const handleAddFoodFromDb = (food: any) => {
    const newIngredient: Ingredient = {
      name: food.name_fr,
      amount: "",
      unit: "g" // Default unit, can be changed by user
    }
    setFormData((prev: typeof formData) => {
      const macros = {
        protein: (prev.macros?.protein || 0) + (food.protein_g || 0),
        carbs: (prev.macros?.carbs || 0) + (food.carbohydrate_g || 0),
        fat: (prev.macros?.fat || 0) + (food.fat_g || 0),
        fiber: (prev.macros?.fiber || 0) + (food.fiber_g || 0),
      }
      const calories = (prev.calories_per_serving || 0) + (food.energy_kcal || 0)
      return {
        ...prev,
        ingredients: [...prev.ingredients, newIngredient],
        macros,
        calories_per_serving: calories
      }
    })
  }

  const [foodSearchOpen, setFoodSearchOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            {template ? "Modifier la recette" : "Nouvelle recette"}
          </DialogTitle>
          <DialogDescription>
            {template ? "Modifiez les détails de votre recette." : "Créez une nouvelle recette pour votre bibliothèque."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la recette *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Salade quinoa avocat"
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
              placeholder="Décrivez votre recette..."
              rows={3}
              className="text-base"
            />
          </div>

          {/* Time and Servings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prep-time">Préparation (min)</Label>
              <Input
                id="prep-time"
                type="number"
                value={formData.preparation_time || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="15"
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cook-time">Cuisson (min)</Label>
              <Input
                id="cook-time"
                type="number"
                value={formData.cooking_time || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, cooking_time: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="30"
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servings">Portions</Label>
              <Input
                id="servings"
                type="number"
                value={formData.servings}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                placeholder="4"
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

          {/* Nutrition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories/portion</Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories_per_serving || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, calories_per_serving: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="250"
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protéines (g)</Label>
              <Input
                id="protein"
                type="number"
                value={formData.macros.protein || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  macros: { ...safeObjectCast(prev.macros), protein: e.target.value ? parseInt(e.target.value) : null }
                }))}
                placeholder="15"
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Glucides (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={formData.macros.carbs || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  macros: { ...safeObjectCast(prev.macros), carbs: e.target.value ? parseInt(e.target.value) : null }
                }))}
                placeholder="30"
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Lipides (g)</Label>
              <Input
                id="fat"
                type="number"
                value={formData.macros.fat || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  macros: { ...safeObjectCast(prev.macros), fat: e.target.value ? parseInt(e.target.value) : null }
                }))}
                placeholder="10"
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiber">Fibres (g)</Label>
              <Input
                id="fiber"
                type="number"
                value={formData.macros.fiber || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  macros: { ...safeObjectCast(prev.macros), fiber: e.target.value ? parseInt(e.target.value) : null }
                }))}
                placeholder="5"
                className="text-base"
              />
            </div>
          </div>

          {/* Dietary Types */}
          <div className="space-y-2">
            <Label>Types de régimes</Label>
            <div className="flex flex-wrap gap-2">
              {dietaryTypes.map(type => (
                <Badge
                  key={type}
                  variant={formData.dietary_type.includes(type) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleDietaryType(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ingrédients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.ingredients.map((ingredient: Ingredient, index: number) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, "name", e.target.value)}
                    placeholder="Nom de l'ingrédient"
                    className="flex-1 text-base"
                  />
                  <Input
                    value={ingredient.amount}
                    onChange={(e) => updateIngredient(index, "amount", e.target.value)}
                    placeholder="Quantité"
                    className="w-full sm:w-24 text-base"
                  />
                  <Select value={ingredient.unit} onValueChange={(value) => updateIngredient(index, "unit", value)}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Unité" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                    disabled={formData.ingredients.length === 1}
                    className="w-full sm:w-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un ingrédient manuellement
              </Button>
              <FoodSearchModal
                open={foodSearchOpen}
                onClose={() => setFoodSearchOpen(false)}
                onSelectFood={handleAddFoodFromDb}
                mealSlot="lunch"
                day={0}
              />
              <Button variant="default" size="sm" onClick={() => setFoodSearchOpen(true)}>
                Rechercher et ajouter un aliment (ANSES-CIQUAL)
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.instructions.map((instruction: Instruction, index: number) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-medium">
                    {instruction.step}
                  </div>
                  <Textarea
                    value={instruction.text}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder="Décrivez cette étape..."
                    className="flex-1 text-base"
                    rows={2}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeInstruction(index)}
                    disabled={formData.instructions.length === 1}
                    className="w-full sm:w-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addInstruction}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une étape
              </Button>
            </CardContent>
          </Card>

          {/* Tags */}
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

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source (optionnel)</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
              placeholder="Site web, livre, etc."
              className="text-base"
            />
          </div>
        </div>

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
