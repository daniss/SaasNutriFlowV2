"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Clock, Info, ChefHat } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { MealSlot, DynamicMealPlanDay, generateMealId } from "@/lib/meal-plan-types"
import { RecipeSearchModal } from "@/components/meal-plans/RecipeSearchModal"
import { RecipeCard } from "@/components/meal-plans/RecipeCard"

// Professional limits consistent with templates
const MAX_MEALS_PER_DAY = 8

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
  onOpenFoodSearch?: (mealId: string, day: number) => void
  onOpenManualFood?: (mealId: string, day: number) => void
  dynamicMealFoods?: Record<string, SelectedFood[]>
  onRemoveFood?: (mealId: string, foodIndex: number) => void
  dynamicMealRecipes?: Record<string, Recipe[]>
  onRemoveRecipe?: (mealId: string, recipeIndex: number) => void
}

export function DynamicMealEditDialog({
  isOpen,
  onClose,
  onSave,
  dayData,
  dayNumber,
  onOpenFoodSearch,
  onOpenManualFood,
  dynamicMealFoods = {},
  onRemoveFood,
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

  // Sync localMealRecipes with dynamicMealRecipes prop updates
  useEffect(() => {
    if (dynamicMealRecipes) {
      console.log('Syncing localMealRecipes with prop update:', dynamicMealRecipes)
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
      setLocalMealRecipes(prev => ({
        ...prev,
        [recipeSearchMealId]: [...(prev[recipeSearchMealId] || []), recipe]
      }))
      
      toast({
        title: "Recette ajoutée",
        description: `${recipe.name} ajoutée au repas.`
      })
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
                    <div className="space-y-2">
                      <Label htmlFor={`meal-calories-${mealIndex}`}>Calories (opt.)</Label>
                      <Input
                        id={`meal-calories-${mealIndex}`}
                        type="number"
                        value={meal.calories_target || ''}
                        onChange={(e) => updateMeal(mealIndex, 'calories_target', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Ex: 500"
                      />
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
                  
                  {/* Food Selection Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (onOpenFoodSearch) {
                          onOpenFoodSearch(meal.id, dayNumber)
                        }
                      }}
                    >
                      + CIQUAL
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (onOpenManualFood) {
                          onOpenManualFood(meal.id, dayNumber)
                        }
                      }}
                    >
                      + Manuel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRecipeSearch(meal.id)}
                      className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    >
                      <ChefHat className="h-3 w-3 mr-1" />
                      Recette
                    </Button>
                  </div>

                  {/* Selected Foods List */}
                  {dynamicMealFoods[meal.id] && dynamicMealFoods[meal.id].length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-medium text-gray-700">Aliments sélectionnés:</div>
                      <div className="space-y-1">
                        {dynamicMealFoods[meal.id].map((food, foodIndex) => (
                          <div key={foodIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{food.name_fr}</div>
                              <div className="text-xs text-gray-600">
                                {food.quantity}g • {Math.round((food.energy_kcal || 0) * food.quantity / 100)} kcal
                              </div>
                            </div>
                            {onRemoveFood && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onRemoveFood(meal.id, foodIndex)}
                                className="ml-2 h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="day-notes">Notes du jour (optionnel)</Label>
            <Textarea
              id="day-notes"
              value={editData.notes}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes spéciales pour ce jour..."
              rows={2}
              className="resize-none"
            />
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
    </Dialog>
  )
}