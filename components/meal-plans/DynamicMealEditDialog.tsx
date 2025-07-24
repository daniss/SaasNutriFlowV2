"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Clock, Info, ChefHat, Search } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { MealSlot, DynamicMealPlanDay, generateMealId } from "@/lib/meal-plan-types"
import { RecipeSearchModal } from "@/components/meal-plans/RecipeSearchModal"
import { RecipeCard } from "@/components/meal-plans/RecipeCard"
import RecipeDialog from "@/components/recipes/RecipeDialog"
import { supabase } from "@/lib/supabase"

// Professional limits consistent with templates
const MAX_MEALS_PER_DAY = 8


interface Recipe {
  id: string
  name: string
  description?: string
  servings: number
  prep_time?: number
  cook_time?: number
  calories_per_serving?: number
  protein_per_serving?: number
  carbs_per_serving?: number
  fat_per_serving?: number
  fiber_per_serving?: number
  ingredients: Array<{
    id: string
    ingredient: {
      id: string
      name: string
      category?: string
    }
    quantity: number
    unit: string
  }>
}

interface DynamicMealEditDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (dayData: DynamicMealPlanDay) => void
  dayData?: DynamicMealPlanDay | null
  dayNumber: number
  dynamicMealRecipes?: Record<string, Recipe[]>
  onRemoveRecipe?: (mealId: string, recipeIndex: number) => void
}

export function DynamicMealEditDialog({
  isOpen,
  onClose,
  onSave,
  dayData,
  dayNumber,
  dynamicMealRecipes = {},
  onRemoveRecipe
}: DynamicMealEditDialogProps) {
  
  const [editData, setEditData] = useState<DynamicMealPlanDay>({
    day: dayNumber,
    date: new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    meals: [],
    notes: ""
  })

  // Recipe search modal state
  const [recipeSearchOpen, setRecipeSearchOpen] = useState(false)
  const [recipeSearchMealId, setRecipeSearchMealId] = useState<string | null>(null)
  const [localMealRecipes, setLocalMealRecipes] = useState<Record<string, Recipe[]>>(dynamicMealRecipes || {})
  
  // Recipe creation dialog state
  const [recipeCreateOpen, setRecipeCreateOpen] = useState(false)
  const [recipeCreateMealId, setRecipeCreateMealId] = useState<string | null>(null)

  // Sync localMealRecipes with dynamicMealRecipes prop updates
  useEffect(() => {
    if (dynamicMealRecipes) {
      setLocalMealRecipes(dynamicMealRecipes)
    }
  }, [dynamicMealRecipes])

  // Initialize edit data when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (dayData) {
        setEditData(dayData)
      } else {
        // Create default meal structure for new days
        const defaultMeals: MealSlot[] = [
          {
            id: generateMealId(dayNumber, 'Petit-déjeuner'),
            name: 'Petit-déjeuner',
            time: '08:00',
            description: '',
            enabled: true,
            order: 0
          },
          {
            id: generateMealId(dayNumber, 'Déjeuner'),
            name: 'Déjeuner',
            time: '12:00',
            description: '',
            enabled: true,
            order: 1
          },
          {
            id: generateMealId(dayNumber, 'Dîner'),
            name: 'Dîner',
            time: '19:00',
            description: '',
            enabled: true,
            order: 2
          }
        ]

        setEditData({
          day: dayNumber,
          date: new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          meals: defaultMeals,
          notes: ""
        })
      }
    }
  }, [isOpen, dayData, dayNumber])

  const addMeal = () => {
    if (editData.meals.length >= MAX_MEALS_PER_DAY) {
      toast({
        title: "Limite atteinte",
        description: `Maximum ${MAX_MEALS_PER_DAY} repas par jour pour maintenir une structure claire et professionnelle.`,
        variant: "default",
      })
      return
    }

    const newMeal: MealSlot = {
      id: generateMealId(dayNumber, `Repas ${editData.meals.length + 1}`),
      name: '',
      time: '12:00',
      description: '',
      enabled: true,
      order: editData.meals.length
    }

    setEditData(prev => ({
      ...prev,
      meals: [...prev.meals, newMeal].sort((a, b) => a.order - b.order)
    }))
  }

  const removeMeal = (mealIndex: number) => {
    if (editData.meals.length <= 1) {
      toast({
        title: "Action impossible",
        description: "Un jour doit contenir au moins un repas.",
        variant: "destructive",
      })
      return
    }

    setEditData(prev => ({
      ...prev,
      meals: prev.meals.filter((_, index) => index !== mealIndex)
    }))
  }

  const updateMeal = (mealIndex: number, field: keyof MealSlot, value: string | number | boolean | null) => {
    setEditData(prev => ({
      ...prev,
      meals: prev.meals.map((meal, index) => 
        index === mealIndex 
          ? { ...meal, [field]: value }
          : meal
      )
    }))
  }

  // Recipe handling functions
  const handleRecipeSelect = (recipe: Recipe) => {
    if (recipeSearchMealId) {
      // Add recipe to local meal recipes for display
      setLocalMealRecipes(prev => ({
        ...prev,
        [recipeSearchMealId]: [...(prev[recipeSearchMealId] || []), recipe]
      }))
      
      // Update the meal slot's recipe_id to enable nutritional calculations
      setEditData(prev => ({
        ...prev,
        meals: prev.meals.map(meal => 
          meal.id === recipeSearchMealId 
            ? { ...meal, recipe_id: recipe.id }
            : meal
        )
      }))
      
      toast({
        title: "Recette ajoutée",
        description: `${recipe.name} ajoutée au repas.`
      })
    }
  }

  const handleRecipeCreate = async (recipe: any) => {
    if (recipeCreateMealId) {
      try {
        // Fetch the recipe with its ingredients from the database
        const { data: recipeWithIngredients, error } = await supabase
          .from('recipes')
          .select(`
            *,
            recipe_ingredients (
              id,
              name,
              quantity,
              unit,
              ingredient_id,
              notes,
              ingredients (
                id,
                name,
                category
              )
            )
          `)
          .eq('id', recipe.id)
          .single()

        if (error) throw error

        // Transform recipe to match our Recipe interface
        const recipeToAdd: Recipe = {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          servings: recipe.servings,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          calories_per_serving: recipe.calories_per_serving,
          protein_per_serving: recipe.protein_per_serving,
          carbs_per_serving: recipe.carbs_per_serving,
          fat_per_serving: recipe.fat_per_serving,
          fiber_per_serving: recipe.fiber_per_serving,
          ingredients: (recipeWithIngredients?.recipe_ingredients || []).map((ing: any) => ({
            id: ing.id,
            ingredient: {
              id: ing.ingredients?.id || ing.ingredient_id || ing.id,
              name: ing.ingredients?.name || ing.name,
              category: ing.ingredients?.category
            },
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes
          }))
        }

        setLocalMealRecipes(prev => ({
          ...prev,
          [recipeCreateMealId]: [...(prev[recipeCreateMealId] || []), recipeToAdd]
        }))
      } catch (error) {
        console.error('Error fetching recipe ingredients:', error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les ingrédients de la recette",
          variant: "destructive"
        })
      }
      
      // Update the meal slot's recipe_id to enable nutritional calculations
      setEditData(prev => ({
        ...prev,
        meals: prev.meals.map(meal => 
          meal.id === recipeCreateMealId 
            ? { ...meal, recipe_id: recipe.id }
            : meal
        )
      }))
      
      toast({
        title: "Recette créée et ajoutée",
        description: `${recipe.name} créée et ajoutée au repas.`
      })

      // Close the create dialog
      setRecipeCreateOpen(false)
      setRecipeCreateMealId(null)
    }
  }

  const handleRemoveRecipe = (mealId: string, recipeIndex: number) => {
    setLocalMealRecipes(prev => ({
      ...prev,
      [mealId]: (prev[mealId] || []).filter((_, index) => index !== recipeIndex)
    }))
  }

  const openRecipeSearch = (mealId: string) => {
    setRecipeSearchMealId(mealId)
    setRecipeSearchOpen(true)
  }

  const openRecipeCreate = (mealId: string) => {
    setRecipeCreateMealId(mealId)
    setRecipeCreateOpen(true)
  }

  const handleSave = () => {
    // Validate required fields
    const enabledMeals = editData.meals.filter(meal => meal.enabled)
    if (enabledMeals.length === 0) {
      toast({
        title: "Validation requise",
        description: "Au moins un repas doit être activé.",
        variant: "destructive",
      })
      return
    }

    // Check for empty meal names
    const hasEmptyNames = enabledMeals.some(meal => !meal.name.trim())
    if (hasEmptyNames) {
      toast({
        title: "Validation requise",
        description: "Tous les repas activés doivent avoir un nom.",
        variant: "destructive",
      })
      return
    }

    // Check for duplicate meal types
    const duplicateMealTypes = enabledMeals
      .reduce((acc, meal, index) => {
        const existing = acc.find(item => item.name === meal.name)
        if (existing) {
          return acc.map(item => 
            item.name === meal.name 
              ? { ...item, indices: [...item.indices, index + 1] }
              : item
          )
        }
        return [...acc, { name: meal.name, indices: [index + 1] }]
      }, [] as { name: string; indices: number[] }[])
      .filter(item => item.indices.length > 1)

    if (duplicateMealTypes.length > 0) {
      const duplicatesList = duplicateMealTypes
        .map(item => `"${item.name}" (repas ${item.indices.join(', ')})`)
        .join(', ')
      
      toast({
        title: "Types de repas en double",
        description: `Chaque type de repas ne peut être utilisé qu'une fois par jour. Doublons détectés: ${duplicatesList}`,
        variant: "destructive",
      })
      return
    }

    onSave(editData)
    onClose()
  }

  const mealTypes = [
    "Petit-déjeuner", "Collation matin", "Déjeuner", "Collation après-midi", 
    "Dîner", "Collation soir", "Pré-entraînement", "Post-entraînement"
  ]

  // Helper function to get available meal types (excluding already used ones)
  const getAvailableMealTypes = (currentMealIndex: number) => {
    const usedTypes = editData.meals
      .filter((_, index) => index !== currentMealIndex && _.enabled)
      .map(meal => meal.name)
      .filter(name => name.trim())
    
    return mealTypes.filter(type => !usedTypes.includes(type))
  }

  // Helper function to check if a meal type is already used
  const isMealTypeUsed = (mealType: string, currentMealIndex: number) => {
    return editData.meals.some((meal, index) => 
      index !== currentMealIndex && meal.enabled && meal.name === mealType
    )
  }

  // Helper function to get duplicate warning class
  const getDuplicateWarningClass = (mealType: string, currentMealIndex: number) => {
    if (mealType && isMealTypeUsed(mealType, currentMealIndex)) {
      return "border-amber-500 bg-amber-50"
    }
    return ""
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Modifier le jour {dayNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Information Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Types de repas uniques</p>
              <p className="text-xs text-blue-700 mt-1">
                Chaque type de repas ne peut être utilisé qu'une fois par jour. Maximum {MAX_MEALS_PER_DAY} repas par jour pour maintenir une structure professionnelle claire.
              </p>
            </div>
          </div>

          {/* Meals Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Repas du jour</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addMeal}
                disabled={editData.meals.length >= MAX_MEALS_PER_DAY}
                className={`border-2 border-dashed transition-all duration-200 ${
                  editData.meals.length >= MAX_MEALS_PER_DAY 
                    ? "opacity-50 cursor-not-allowed border-gray-300" 
                    : "border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700"
                }`}
                title={editData.meals.length >= MAX_MEALS_PER_DAY ? `Maximum ${MAX_MEALS_PER_DAY} repas par jour atteint` : "Ajouter un repas"}
              >
                <Plus className="h-4 w-4 mr-2" />
                {editData.meals.length >= MAX_MEALS_PER_DAY 
                  ? `Limite atteinte (${editData.meals.length}/${MAX_MEALS_PER_DAY})` 
                  : `Ajouter un repas (${editData.meals.length}/${MAX_MEALS_PER_DAY})`
                }
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {editData.meals.map((meal, mealIndex) => (
                <div key={meal.id} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Repas {mealIndex + 1}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMeal(mealIndex)}
                    disabled={editData.meals.length === 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`meal-name-${mealIndex}`}>
                      Nom du repas *
                      {isMealTypeUsed(meal.name, mealIndex) && (
                        <span className="text-amber-600 text-xs ml-2">(Type déjà utilisé)</span>
                      )}
                    </Label>
                    <Select 
                      value={meal.name} 
                      onValueChange={(value) => updateMeal(mealIndex, 'name', value)}
                    >
                      <SelectTrigger className={`w-full ${getDuplicateWarningClass(meal.name, mealIndex)}`}>
                        <SelectValue placeholder="Sélectionner un type de repas" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableMealTypes(mealIndex).map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                        {/* Show used types with warning */}
                        {mealTypes.filter(type => 
                          editData.meals.some((m, i) => i !== mealIndex && m.name === type && m.enabled)
                        ).map(type => (
                          <SelectItem key={`used-${type}`} value={type} disabled className="text-amber-600">
                            {type} (déjà utilisé)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`meal-time-${mealIndex}`}>Heure</Label>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <Input
                          id={`meal-time-${mealIndex}`}
                          type="time"
                          value={meal.time}
                          onChange={(e) => updateMeal(mealIndex, 'time', e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`meal-description-${mealIndex}`}>Description du repas</Label>
                  <Textarea
                    id={`meal-description-${mealIndex}`}
                    value={meal.description}
                    onChange={(e) => updateMeal(mealIndex, 'description', e.target.value)}
                    placeholder="Décrivez le contenu du repas..."
                    rows={2}
                    className="resize-none"
                  />
                  
                  {/* Recipe Buttons */}
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRecipeSearch(meal.id)}
                      className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    >
                      <Search className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Choisir</span>
                      <span className="sm:hidden text-xs">Choisir</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRecipeCreate(meal.id)}
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Créer</span>
                      <span className="sm:hidden text-xs">Créer</span>
                    </Button>
                  </div>


                  {/* Selected Recipes List */}
                  {localMealRecipes[meal.id] && localMealRecipes[meal.id].length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-medium text-gray-700">Recettes sélectionnées:</div>
                      <div className="space-y-2">
                        {localMealRecipes[meal.id].map((recipe, recipeIndex) => (
                          <RecipeCard
                            key={recipeIndex}
                            recipe={recipe}
                            onRemove={() => handleRemoveRecipe(meal.id, recipeIndex)}
                            className="text-xs"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </div>
              ))}
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              Sauvegarder le jour
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Recipe Search Modal */}
      <RecipeSearchModal
        isOpen={recipeSearchOpen}
        onClose={() => {
          setRecipeSearchOpen(false)
          setRecipeSearchMealId(null)
        }}
        onSelectRecipe={handleRecipeSelect}
        excludeRecipeIds={localMealRecipes[recipeSearchMealId || '']?.map(r => r.id) || []}
      />

      {/* Recipe Creation Dialog */}
      <RecipeDialog
        isOpen={recipeCreateOpen}
        onClose={() => {
          setRecipeCreateOpen(false)
          setRecipeCreateMealId(null)
        }}
        onSave={handleRecipeCreate}
      />
    </Dialog>
  )
}