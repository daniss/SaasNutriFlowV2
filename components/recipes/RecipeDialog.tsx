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
import { supabase, type Recipe } from "@/lib/supabase"
import { ChefHat, Plus, X } from "lucide-react"
import { useState, useEffect } from "react"

interface RecipeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (recipe: Recipe) => void
  recipe?: Recipe
}

interface Ingredient {
  name: string
  quantity: number | null
  unit: string | null
  notes?: string
}

export default function RecipeDialog({ isOpen, onClose, onSave, recipe }: RecipeDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentTag, setCurrentTag] = useState("")
  const [foodSearchOpen, setFoodSearchOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    prep_time: null as number | null,
    cook_time: null as number | null,
    servings: 1,
    difficulty: "medium",
    calories_per_serving: null as number | null,
    protein_per_serving: null as number | null,
    carbs_per_serving: null as number | null,
    fat_per_serving: null as number | null,
    fiber_per_serving: null as number | null,
    image_url: "",
    instructions: [""],
    tags: [] as string[],
    is_favorite: false,
    usage_count: 0
  })

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", quantity: null, unit: null }
  ])

  // Reset form when dialog opens/closes or recipe changes
  useEffect(() => {
    if (isOpen) {
      if (recipe) {
        setFormData({
          name: recipe.name,
          description: recipe.description || "",
          category: recipe.category,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          calories_per_serving: recipe.calories_per_serving,
          protein_per_serving: recipe.protein_per_serving,
          carbs_per_serving: recipe.carbs_per_serving,
          fat_per_serving: recipe.fat_per_serving,
          fiber_per_serving: recipe.fiber_per_serving,
          image_url: recipe.image_url || "",
          instructions: recipe.instructions,
          tags: recipe.tags,
          is_favorite: recipe.is_favorite,
          usage_count: recipe.usage_count
        })
        // Load ingredients if editing
        loadIngredients(recipe.id)
      } else {
        // Reset to defaults for new recipe
        setFormData({
          name: "",
          description: "",
          category: "",
          prep_time: null,
          cook_time: null,
          servings: 1,
          difficulty: "medium",
          calories_per_serving: null,
          protein_per_serving: null,
          carbs_per_serving: null,
          fat_per_serving: null,
          fiber_per_serving: null,
          image_url: "",
          instructions: [""],
          tags: [],
          is_favorite: false,
          usage_count: 0
        })
        setIngredients([{ name: "", quantity: null, unit: null }])
      }
    }
  }, [isOpen, recipe])

  const loadIngredients = async (recipeId: string) => {
    try {
      const { data, error } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("order_index")

      if (error) throw error

      if (data && data.length > 0) {
        setIngredients(data.map(ing => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes || undefined
        })))
      } else {
        setIngredients([{ name: "", quantity: null, unit: null }])
      }
    } catch (error) {
      console.error("Error loading ingredients:", error)
    }
  }

  const categories = [
    { value: "breakfast", label: "Petit-déjeuner" },
    { value: "lunch", label: "Déjeuner" },
    { value: "dinner", label: "Dîner" },
    { value: "snack", label: "Collation" },
    { value: "dessert", label: "Dessert" },
    { value: "side", label: "Accompagnement" },
    { value: "drink", label: "Boisson" }
  ]

  const units = [
    "g", "kg", "ml", "l", "tasse", "cuillère à soupe", "cuillère à café", 
    "pièce", "tranche", "pincée", "dose", "sachet", "boîte", "paquet"
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
      const recipeData = {
        dietitian_id: user.id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        prep_time: formData.prep_time,
        cook_time: formData.cook_time,
        servings: formData.servings,
        difficulty: formData.difficulty,
        calories_per_serving: formData.calories_per_serving,
        protein_per_serving: formData.protein_per_serving,
        carbs_per_serving: formData.carbs_per_serving,
        fat_per_serving: formData.fat_per_serving,
        fiber_per_serving: formData.fiber_per_serving,
        image_url: formData.image_url || null,
        instructions: formData.instructions.filter(inst => inst.trim()),
        tags: formData.tags,
        is_favorite: formData.is_favorite,
        usage_count: formData.usage_count
      }

      let result
      if (recipe) {
        // Update existing recipe
        result = await supabase
          .from("recipes")
          .update(recipeData)
          .eq("id", recipe.id)
          .select()
          .single()
      } else {
        // Create new recipe
        result = await supabase
          .from("recipes")
          .insert(recipeData)
          .select()
          .single()
      }

      if (result.error) throw result.error

      // Save ingredients
      const recipeId = result.data.id
      
      // Delete existing ingredients if updating
      if (recipe) {
        await supabase
          .from("recipe_ingredients")
          .delete()
          .eq("recipe_id", recipeId)
      }

      // Insert new ingredients
      const validIngredients = ingredients.filter(ing => ing.name.trim())
      if (validIngredients.length > 0) {
        const ingredientData = validIngredients.map((ing, index) => ({
          recipe_id: recipeId,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes || null,
          order_index: index
        }))

        const { error: ingredientError } = await supabase
          .from("recipe_ingredients")
          .insert(ingredientData)

        if (ingredientError) {
          console.error("Error saving ingredients:", ingredientError)
          // Don't fail the whole operation for ingredient errors
        }
      }

      onSave(result.data)
      onClose()
      toast({
        title: "Succès",
        description: `Recette ${recipe ? "modifiée" : "créée"} avec succès`,
      })
    } catch (error) {
      console.error("Error saving recipe:", error)
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
    setIngredients(prev => [...prev, { name: "", quantity: null, unit: null }])
  }

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number | null) => {
    setIngredients(prev => prev.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    ))
  }

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, ""]
    }))
  }

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }))
  }

  const updateInstruction = (index: number, text: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => 
        i === index ? text : inst
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

  const handleAddFoodFromDb = (food: any) => {
    const newIngredient: Ingredient = {
      name: food.name_fr,
      quantity: 100, // Default 100g
      unit: "g"
    }
    
    setIngredients(prev => [...prev, newIngredient])
    
    // Update nutrition if available
    if (food.energy_kcal) {
      setFormData(prev => ({
        ...prev,
        calories_per_serving: (prev.calories_per_serving || 0) + Math.round(food.energy_kcal),
        protein_per_serving: (prev.protein_per_serving || 0) + Math.round(food.protein_g || 0),
        carbs_per_serving: (prev.carbs_per_serving || 0) + Math.round(food.carbohydrate_g || 0),
        fat_per_serving: (prev.fat_per_serving || 0) + Math.round(food.fat_g || 0),
        fiber_per_serving: (prev.fiber_per_serving || 0) + Math.round(food.fiber_g || 0)
      }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            {recipe ? "Modifier la recette" : "Nouvelle recette"}
          </DialogTitle>
          <DialogDescription>
            {recipe ? "Modifiez les détails de votre recette." : "Créez une nouvelle recette pour votre bibliothèque."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la recette *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Salade quinoa avocat"
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
            />
          </div>

          {/* Time and Servings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prep-time">Préparation (min)</Label>
              <Input
                id="prep-time"
                type="number"
                value={formData.prep_time || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, prep_time: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cook-time">Cuisson (min)</Label>
              <Input
                id="cook-time"
                type="number"
                value={formData.cook_time || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, cook_time: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="30"
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protéines (g)</Label>
              <Input
                id="protein"
                type="number"
                value={formData.protein_per_serving || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, protein_per_serving: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Glucides (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={formData.carbs_per_serving || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, carbs_per_serving: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Lipides (g)</Label>
              <Input
                id="fat"
                type="number"
                value={formData.fat_per_serving || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, fat_per_serving: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiber">Fibres (g)</Label>
              <Input
                id="fiber"
                type="number"
                value={formData.fiber_per_serving || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, fiber_per_serving: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="5"
              />
            </div>
          </div>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ingrédients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, "name", e.target.value)}
                      placeholder="Nom de l'ingrédient"
                      className="flex-1 min-w-0"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      disabled={ingredients.length === 1}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={ingredient.quantity || ""}
                      onChange={(e) => updateIngredient(index, "quantity", e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Quantité"
                      className="flex-1"
                    />
                    <Select value={ingredient.unit || ""} onValueChange={(value) => updateIngredient(index, "unit", value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={addIngredient} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter manuellement
                </Button>
                <Button variant="default" size="sm" onClick={() => setFoodSearchOpen(true)} className="flex-1">
                  Rechercher dans ANSES-CIQUAL
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-700">Étape {index + 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeInstruction(index)}
                      disabled={formData.instructions.length === 1}
                      className="ml-auto flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder="Décrivez cette étape..."
                    className="w-full"
                    rows={2}
                  />
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
                className="flex-1 min-w-0"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button variant="outline" size="sm" onClick={addTag} className="flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? "Enregistrement..." : (recipe ? "Modifier" : "Créer")}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Food Search Modal */}
      <FoodSearchModal
        open={foodSearchOpen}
        onClose={() => setFoodSearchOpen(false)}
        onSelectFood={handleAddFoodFromDb}
        mealSlot="lunch"
        day={0}
      />
    </Dialog>
  )
}