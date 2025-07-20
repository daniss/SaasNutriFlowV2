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
  id?: string // ID from the database
  name: string
  quantity: number | null
  unit: string | null
  notes?: string
  // Nutritional data from database
  calories_per_100g?: number
  calories_per_100ml?: number
  calories_per_piece?: number
  protein_per_100g?: number
  protein_per_100ml?: number
  protein_per_piece?: number
  carbs_per_100g?: number
  carbs_per_100ml?: number
  carbs_per_piece?: number
  fat_per_100g?: number
  fat_per_100ml?: number
  fat_per_piece?: number
  fiber_per_100g?: number
  fiber_per_100ml?: number
  fiber_per_piece?: number
}

export default function RecipeDialog({ isOpen, onClose, onSave, recipe }: RecipeDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentTag, setCurrentTag] = useState("")
  const [foodSearchOpen, setFoodSearchOpen] = useState(false)
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([])
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState("")
  
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

  // Load available ingredients from database
  const loadAvailableIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from("ingredients")
        .select("id, name, category, unit_type, calories_per_100g, calories_per_100ml, calories_per_piece, protein_per_100g, protein_per_100ml, protein_per_piece, carbs_per_100g, carbs_per_100ml, carbs_per_piece, fat_per_100g, fat_per_100ml, fat_per_piece, fiber_per_100g, fiber_per_100ml, fiber_per_piece")
        .order("name")

      if (error) throw error

      setAvailableIngredients(data || [])
    } catch (error) {
      console.error("Error loading ingredients:", error)
    }
  }

  // Filter ingredients based on search term
  const filteredIngredients = availableIngredients.filter(ing =>
    ing.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase())
  )

  // Calculate total nutrition from all ingredients
  const calculateNutrition = (ingredients: Ingredient[], servings: number = 1) => {
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0

    ingredients.forEach(ingredient => {
      const quantity = ingredient.quantity || 0
      
      if (quantity <= 0) return // Skip if no quantity

      let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0

      // Calculate based on unit type and available nutritional data
      if (ingredient.unit === 'g' && ingredient.calories_per_100g !== undefined) {
        const factor = quantity / 100
        calories = ingredient.calories_per_100g * factor
        protein = (ingredient.protein_per_100g || 0) * factor
        carbs = (ingredient.carbs_per_100g || 0) * factor
        fat = (ingredient.fat_per_100g || 0) * factor
        fiber = (ingredient.fiber_per_100g || 0) * factor
      } else if (ingredient.unit === 'ml' && ingredient.calories_per_100ml !== undefined) {
        const factor = quantity / 100
        calories = ingredient.calories_per_100ml * factor
        protein = (ingredient.protein_per_100ml || 0) * factor
        carbs = (ingredient.carbs_per_100ml || 0) * factor
        fat = (ingredient.fat_per_100ml || 0) * factor
        fiber = (ingredient.fiber_per_100ml || 0) * factor
      } else if (ingredient.unit === 'piece' && ingredient.calories_per_piece !== undefined) {
        calories = ingredient.calories_per_piece * quantity
        protein = (ingredient.protein_per_piece || 0) * quantity
        carbs = (ingredient.carbs_per_piece || 0) * quantity
        fat = (ingredient.fat_per_piece || 0) * quantity
        fiber = (ingredient.fiber_per_piece || 0) * quantity
      }

      totalCalories += calories
      totalProtein += protein
      totalCarbs += carbs
      totalFat += fat
      totalFiber += fiber
    })

    // Return per serving values
    const actualServings = Math.max(servings, 1)
    return {
      calories: Math.round(totalCalories / actualServings),
      protein: Math.round(totalProtein / actualServings),
      carbs: Math.round(totalCarbs / actualServings),
      fat: Math.round(totalFat / actualServings),
      fiber: Math.round(totalFiber / actualServings)
    }
  }

  // Auto-update nutrition when ingredients or servings change
  useEffect(() => {
    const nutrition = calculateNutrition(ingredients, formData.servings)
    setFormData(prev => ({
      ...prev,
      calories_per_serving: nutrition.calories,
      protein_per_serving: nutrition.protein,
      carbs_per_serving: nutrition.carbs,
      fat_per_serving: nutrition.fat,
      fiber_per_serving: nutrition.fiber
    }))
  }, [ingredients, formData.servings])

  // Load ingredients when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableIngredients()
    }
  }, [isOpen])

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
        .select(`
          *,
          ingredients (
            id, calories_per_100g, calories_per_100ml, calories_per_piece,
            protein_per_100g, protein_per_100ml, protein_per_piece,
            carbs_per_100g, carbs_per_100ml, carbs_per_piece,
            fat_per_100g, fat_per_100ml, fat_per_piece,
            fiber_per_100g, fiber_per_100ml, fiber_per_piece
          )
        `)
        .eq("recipe_id", recipeId)
        .order("order_index")

      if (error) throw error

      if (data && data.length > 0) {
        const loadedIngredients = data.map(ing => {
          const ingredient: Ingredient = {
            id: ing.ingredient_id || undefined,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes || undefined
          }

          // Add nutritional data if available from global ingredients table
          if (ing.ingredients) {
            const nutritionData = ing.ingredients
            ingredient.calories_per_100g = nutritionData.calories_per_100g
            ingredient.calories_per_100ml = nutritionData.calories_per_100ml
            ingredient.calories_per_piece = nutritionData.calories_per_piece
            ingredient.protein_per_100g = nutritionData.protein_per_100g
            ingredient.protein_per_100ml = nutritionData.protein_per_100ml
            ingredient.protein_per_piece = nutritionData.protein_per_piece
            ingredient.carbs_per_100g = nutritionData.carbs_per_100g
            ingredient.carbs_per_100ml = nutritionData.carbs_per_100ml
            ingredient.carbs_per_piece = nutritionData.carbs_per_piece
            ingredient.fat_per_100g = nutritionData.fat_per_100g
            ingredient.fat_per_100ml = nutritionData.fat_per_100ml
            ingredient.fat_per_piece = nutritionData.fat_per_piece
            ingredient.fiber_per_100g = nutritionData.fiber_per_100g
            ingredient.fiber_per_100ml = nutritionData.fiber_per_100ml
            ingredient.fiber_per_piece = nutritionData.fiber_per_piece
          }

          return ingredient
        })

        setIngredients(loadedIngredients)
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
          ingredient_id: ing.id || null, // Reference to global ingredient if from database
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
      unit: "g",
      // Add ANSES nutritional data for automatic calculation
      calories_per_100g: food.energy_kcal || 0,
      protein_per_100g: food.protein_g || 0,
      carbs_per_100g: food.carbohydrate_g || 0,
      fat_per_100g: food.fat_g || 0,
      fiber_per_100g: food.fiber_g || 0
    }
    
    setIngredients(prev => [...prev, newIngredient])
    
    // Nutrition will be automatically calculated by useEffect
  }

  const addIngredientFromDatabase = (dbIngredient: any) => {
    const newIngredient: Ingredient = {
      id: dbIngredient.id,
      name: dbIngredient.name,
      quantity: dbIngredient.unit_type === 'piece' ? 1 : 100, // Default 1 piece or 100g/ml
      unit: dbIngredient.unit_type,
      // Include nutritional data from database
      calories_per_100g: dbIngredient.calories_per_100g,
      calories_per_100ml: dbIngredient.calories_per_100ml,
      calories_per_piece: dbIngredient.calories_per_piece,
      protein_per_100g: dbIngredient.protein_per_100g,
      protein_per_100ml: dbIngredient.protein_per_100ml,
      protein_per_piece: dbIngredient.protein_per_piece,
      carbs_per_100g: dbIngredient.carbs_per_100g,
      carbs_per_100ml: dbIngredient.carbs_per_100ml,
      carbs_per_piece: dbIngredient.carbs_per_piece,
      fat_per_100g: dbIngredient.fat_per_100g,
      fat_per_100ml: dbIngredient.fat_per_100ml,
      fat_per_piece: dbIngredient.fat_per_piece,
      fiber_per_100g: dbIngredient.fiber_per_100g,
      fiber_per_100ml: dbIngredient.fiber_per_100ml,
      fiber_per_piece: dbIngredient.fiber_per_piece
    }
    
    setIngredients(prev => [...prev, newIngredient])
    setIngredientSearchTerm("") // Clear search
    
    // Nutrition will be automatically calculated by useEffect
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

          {/* Nutrition - Auto-calculated */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Valeurs nutritionnelles par portion</Label>
              <Badge variant="secondary" className="text-xs">
                Calculé automatiquement
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.calories_per_serving || 0}
                  readOnly
                  className="bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">Protéines (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={formData.protein_per_serving || 0}
                  readOnly
                  className="bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Glucides (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={formData.carbs_per_serving || 0}
                  readOnly
                  className="bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">Lipides (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={formData.fat_per_serving || 0}
                  readOnly
                  className="bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiber">Fibres (g)</Label>
                <Input
                  id="fiber"
                  type="number"
                  value={formData.fiber_per_serving || 0}
                  readOnly
                  className="bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              💡 Les valeurs nutritionnelles sont calculées automatiquement en fonction des ingrédients et de leurs quantités
            </p>
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
              
              {/* Database Ingredient Selector */}
              <div className="border-t pt-3">
                <Label className="text-sm font-medium">Ajouter depuis la base d'ingrédients</Label>
                <div className="mt-2 space-y-2">
                  <Input
                    value={ingredientSearchTerm}
                    onChange={(e) => setIngredientSearchTerm(e.target.value)}
                    placeholder="Rechercher un ingrédient..."
                    className="w-full"
                  />
                  {ingredientSearchTerm && (
                    <div className="max-h-40 overflow-y-auto border rounded-md bg-white">
                      {filteredIngredients.length > 0 ? (
                        filteredIngredients.slice(0, 10).map((ingredient) => (
                          <button
                            key={ingredient.id}
                            onClick={() => addIngredientFromDatabase(ingredient)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0 flex justify-between items-center"
                          >
                            <div>
                              <div className="font-medium">{ingredient.name}</div>
                              <div className="text-xs text-gray-500">{ingredient.category}</div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {ingredient.unit_type}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">Aucun ingrédient trouvé</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

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