"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Beef, 
  Wheat, 
  Droplet, 
  Flame, 
  TrendingUp, 
  AlertCircle,
  Info,
  Target,
  Activity,
  BarChart3
} from "lucide-react"
import { type GeneratedMealPlan, type Meal, type DayPlan } from "@/lib/gemini"
import { type DynamicMealPlan, isDynamicMealPlan } from "@/lib/meal-plan-types"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"

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

interface MacronutrientBreakdownProps {
  mealPlan: GeneratedMealPlan | DynamicMealPlan
  selectedFoods?: Record<number, { breakfast: SelectedFood[]; lunch: SelectedFood[]; dinner: SelectedFood[]; snacks: SelectedFood[] }>
  dynamicMealFoods?: Record<string, SelectedFood[]>
  dynamicMealRecipes?: Record<string, any[]>
  className?: string
}

interface MacroData {
  protein: number
  carbs: number
  fat: number
  calories: number
  fiber?: number
}

interface MacroPercentages {
  protein: number
  carbs: number
  fat: number
}

function calculateMacroPercentages(data: MacroData): MacroPercentages {
  const proteinCalories = safeNumber(data.protein) * 4
  const carbCalories = safeNumber(data.carbs) * 4
  const fatCalories = safeNumber(data.fat) * 9
  const totalCalories = proteinCalories + carbCalories + fatCalories

  // Handle division by zero
  if (totalCalories === 0) {
    return { protein: 0, carbs: 0, fat: 0 }
  }

  return {
    protein: Math.round((proteinCalories / totalCalories) * 100),
    carbs: Math.round((carbCalories / totalCalories) * 100),
    fat: Math.round((fatCalories / totalCalories) * 100)
  }
}

function getMacroColor(type: 'protein' | 'carbs' | 'fat') {
  switch (type) {
    case 'protein':
      return 'bg-blue-500'
    case 'carbs':
      return 'bg-orange-500'
    case 'fat':
      return 'bg-purple-500'
  }
}

function getMacroIcon(type: 'protein' | 'carbs' | 'fat') {
  switch (type) {
    case 'protein':
      return <Beef className="h-4 w-4" />
    case 'carbs':
      return <Wheat className="h-4 w-4" />
    case 'fat':
      return <Droplet className="h-4 w-4" />
  }
}

// Helper function to safely get numeric value
const safeNumber = (value: any): number => {
  const num = Number(value)
  return isNaN(num) || !isFinite(num) ? 0 : num
}

export default function MacronutrientBreakdown({ mealPlan, selectedFoods, dynamicMealFoods, dynamicMealRecipes, className = "" }: MacronutrientBreakdownProps) {
  // State for recipe nutrition data
  const [recipeNutrition, setRecipeNutrition] = useState<MacroData>({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
  const [recipeNutritionMap, setRecipeNutritionMap] = useState<Record<string, MacroData>>({})
  const [loadingRecipes, setLoadingRecipes] = useState(true)

  // Fetch nutrition data from linked recipes
  useEffect(() => {
    const fetchRecipeNutrition = async () => {
      if (!isDynamicMealPlan(mealPlan as any)) {
        setLoadingRecipes(false)
        return
      }

      try {
        // Collect all recipe IDs from the meal plan
        const recipeIds = new Set<string>()
        ;(mealPlan as DynamicMealPlan).days.forEach(day => {
          day.meals.forEach(meal => {
            if (meal.recipe_id) {
              recipeIds.add(meal.recipe_id)
            }
          })
        })

        if (recipeIds.size === 0) {
          setLoadingRecipes(false)
          return
        }

        // Fetch recipe nutrition data
        const { data: recipes, error } = await supabase
          .from('recipes')
          .select('id, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, fiber_per_serving, servings')
          .in('id', Array.from(recipeIds))

        if (error) {
          console.error('Error fetching recipe nutrition:', error)
          setLoadingRecipes(false)
          return
        }

        // Store individual recipe nutrition data
        const nutritionMap: Record<string, MacroData> = {}
        let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0

        recipes?.forEach(recipe => {
          nutritionMap[recipe.id] = {
            calories: safeNumber(recipe.calories_per_serving),
            protein: safeNumber(recipe.protein_per_serving),
            carbs: safeNumber(recipe.carbs_per_serving),
            fat: safeNumber(recipe.fat_per_serving),
            fiber: safeNumber(recipe.fiber_per_serving)
          }
        })

        setRecipeNutritionMap(nutritionMap)

        // Also calculate totals for the average display
        ;(mealPlan as DynamicMealPlan).days.forEach(day => {
          day.meals.forEach(meal => {
            if (meal.recipe_id && nutritionMap[meal.recipe_id]) {
              const nutrition = nutritionMap[meal.recipe_id]
              totalCalories += nutrition.calories
              totalProtein += nutrition.protein
              totalCarbs += nutrition.carbs
              totalFat += nutrition.fat
              totalFiber += nutrition.fiber || 0
            }
          })
        })

        // Calculate daily averages from total recipe nutrition
        const numDays = (mealPlan as DynamicMealPlan).days.length || 1
        setRecipeNutrition({
          calories: Math.round(totalCalories / numDays),
          protein: Math.round((totalProtein / numDays) * 10) / 10,
          carbs: Math.round((totalCarbs / numDays) * 10) / 10,
          fat: Math.round((totalFat / numDays) * 10) / 10,
          fiber: Math.round((totalFiber / numDays) * 10) / 10
        })

      } catch (error) {
        console.error('Error calculating recipe nutrition:', error)
      } finally {
        setLoadingRecipes(false)
      }
    }

    fetchRecipeNutrition()
  }, [mealPlan, dynamicMealRecipes])
  // Function to calculate nutrition from selected foods
  const calculateSelectedFoodsNutrition = () => {
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0
    
    // Calculate from legacy selected foods
    if (selectedFoods) {
      Object.values(selectedFoods).forEach(dayFoods => {
        Object.values(dayFoods).forEach(mealFoods => {
          mealFoods.forEach(food => {
            const factor = safeNumber(food.quantity) / 100
            totalCalories += safeNumber(food.energy_kcal) * factor
            totalProtein += safeNumber(food.protein_g) * factor
            totalCarbs += safeNumber(food.carbohydrate_g) * factor
            totalFat += safeNumber(food.fat_g) * factor
            totalFiber += safeNumber(food.fiber_g) * factor
          })
        })
      })
    }
    
    // Calculate from dynamic meal foods
    if (dynamicMealFoods) {
      Object.values(dynamicMealFoods).forEach(foods => {
        foods.forEach(food => {
          const factor = safeNumber(food.quantity) / 100
          totalCalories += safeNumber(food.energy_kcal) * factor
          totalProtein += safeNumber(food.protein_g) * factor
          totalCarbs += safeNumber(food.carbohydrate_g) * factor
          totalFat += safeNumber(food.fat_g) * factor
          totalFiber += safeNumber(food.fiber_g) * factor
        })
      })
    }
    
    return {
      calories: Math.round(safeNumber(totalCalories)),
      protein: Math.round(safeNumber(totalProtein) * 10) / 10,
      carbs: Math.round(safeNumber(totalCarbs) * 10) / 10,
      fat: Math.round(safeNumber(totalFat) * 10) / 10,
      fiber: Math.round(safeNumber(totalFiber) * 10) / 10
    }
  }

  // Calculate nutrition from selected foods
  const selectedFoodsNutrition = calculateSelectedFoodsNutrition()
  
  // Calculate average daily macros (including selected foods)
  const nutritionSummary = (mealPlan as GeneratedMealPlan).nutritionSummary
  const baseDailyAverages = nutritionSummary ? {
    avgCalories: safeNumber(nutritionSummary.avgCalories),
    avgProtein: safeNumber(nutritionSummary.avgProtein),
    avgCarbs: safeNumber(nutritionSummary.avgCarbs),
    avgFat: safeNumber(nutritionSummary.avgFat)
  } : {
    avgCalories: 0,
    avgProtein: 0,
    avgCarbs: 0,
    avgFat: 0
  }
  
  // Helper function to calculate nutrition for a specific day including selected foods
  const calculateDayTotalNutrition = (dayNumber: number) => {
    const dayFoods = selectedFoods?.[dayNumber]
    if (!dayFoods) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0
    
    Object.values(dayFoods).forEach(mealFoods => {
      mealFoods.forEach(food => {
        const factor = safeNumber(food.quantity) / 100
        totalCalories += safeNumber(food.energy_kcal) * factor
        totalProtein += safeNumber(food.protein_g) * factor
        totalCarbs += safeNumber(food.carbohydrate_g) * factor
        totalFat += safeNumber(food.fat_g) * factor
      })
    })
    
    return {
      calories: Math.round(safeNumber(totalCalories)),
      protein: Math.round(safeNumber(totalProtein) * 10) / 10,
      carbs: Math.round(safeNumber(totalCarbs) * 10) / 10,
      fat: Math.round(safeNumber(totalFat) * 10) / 10
    }
  }

  // Calculate daily breakdown - use the average recipe nutrition distributed across days
  const planDays = isDynamicMealPlan(mealPlan as any) ? (mealPlan as DynamicMealPlan).days : (mealPlan as GeneratedMealPlan).days
  const numDays = planDays.length || 1
  
  const dailyBreakdown = planDays.map((day: any) => {
    let dayCalories = 0, dayProtein = 0, dayCarbs = 0, dayFat = 0
    
    // Handle AI-generated meal plans with dynamic meal structure
    if (Array.isArray(day.meals)) {
      // Calculate calories from both recipe nutrition and meal targets
      day.meals.forEach((meal: any) => {
        if (meal.recipe_id && recipeNutritionMap[meal.recipe_id]) {
          // Use recipe nutrition data when available
          const nutrition = recipeNutritionMap[meal.recipe_id]
          dayCalories += nutrition.calories
          dayProtein += nutrition.protein
          dayCarbs += nutrition.carbs
          dayFat += nutrition.fat
        } else {
          // Fallback to meal's own calories for AI-generated meals without recipes
          dayCalories += meal.calories_target || meal.calories || 0
        }
      })
    } else if (day.meals && typeof day.meals === 'object') {
      // Legacy format: use existing totals if available
      dayCalories = day.totalCalories || 0
      dayProtein = day.totalProtein || 0
      dayCarbs = day.totalCarbs || 0
      dayFat = day.totalFat || 0
    }
    
    // Get nutrition from selected foods for this day
    const selectedFoodsForDay = calculateDayTotalNutrition(day.day)
    
    return {
      day: day.day,
      date: day.date || `Jour ${day.day}`,
      calories: Math.round(safeNumber(dayCalories + selectedFoodsForDay.calories)),
      protein: Math.round(safeNumber(dayProtein + selectedFoodsForDay.protein) * 10) / 10,
      carbs: Math.round(safeNumber(dayCarbs + selectedFoodsForDay.carbs) * 10) / 10,
      fat: Math.round(safeNumber(dayFat + selectedFoodsForDay.fat) * 10) / 10
    }
  })

  // Simple approach: use the calculated daily breakdown totals
  const totalDays = dailyBreakdown.length || 1
  const dailyAverages = {
    avgCalories: Math.round(dailyBreakdown.reduce((sum, day) => sum + day.calories, 0) / totalDays),
    avgProtein: Math.round((dailyBreakdown.reduce((sum, day) => sum + day.protein, 0) / totalDays) * 10) / 10,
    avgCarbs: Math.round((dailyBreakdown.reduce((sum, day) => sum + day.carbs, 0) / totalDays) * 10) / 10,
    avgFat: Math.round((dailyBreakdown.reduce((sum, day) => sum + day.fat, 0) / totalDays) * 10) / 10
  }

  const targetMacros = (mealPlan as GeneratedMealPlan).nutritionalGoals || {
    dailyCalories: dailyAverages.avgCalories || 2000, // Use actual average if no target set
    proteinPercentage: 25,
    carbPercentage: 45,
    fatPercentage: 30
  }

  // Calculate target grams based on percentages
  const targetProteinGrams = Math.round((targetMacros.dailyCalories * (targetMacros.proteinPercentage / 100)) / 4)
  const targetCarbsGrams = Math.round((targetMacros.dailyCalories * (targetMacros.carbPercentage / 100)) / 4)
  const targetFatGrams = Math.round((targetMacros.dailyCalories * (targetMacros.fatPercentage / 100)) / 9)

  // Calculate actual percentages using the total combined calories
  const actualPercentages = calculateMacroPercentages({
    protein: dailyAverages.avgProtein,
    carbs: dailyAverages.avgCarbs,
    fat: dailyAverages.avgFat,
    calories: dailyAverages.avgCalories
  })

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <BarChart3 className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Analyse Nutritionnelle</span>
              </CardTitle>
              <CardDescription className="mt-1">
                Moyennes sur {(mealPlan as DynamicMealPlan).days?.length || (mealPlan as GeneratedMealPlan).duration || 1} jours
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {selectedFoodsNutrition.calories > 0 && (
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                      <Info className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">+{selectedFoodsNutrition.calories} kcal ANSES-CIQUAL</span>
                    </Badge>
                  )}
                  {recipeNutrition.calories > 0 && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      <Target className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{loadingRecipes ? 'Calcul...' : 'Recettes incluses'}</span>
                    </Badge>
                  )}
                </div>
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm flex-shrink-0 w-fit">
              <Flame className="h-3 w-3 mr-1" />
              {dailyAverages.avgCalories} kcal/jour
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1 bg-muted p-1 rounded-lg h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm data-[state=active]:bg-background">
                <span className="hidden sm:inline">Moyennes globales</span>
                <span className="sm:hidden">Moyennes</span>
              </TabsTrigger>
              <TabsTrigger value="daily" className="text-xs sm:text-sm data-[state=active]:bg-background">
                <span className="hidden sm:inline">Analyse par jour</span>
                <span className="sm:hidden">Par jour</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Macro Distribution */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Répartition moyenne des macronutriments (sur {(mealPlan as DynamicMealPlan).days?.length || (mealPlan as GeneratedMealPlan).duration || 1} jours)
                </h4>
                
                {/* Visual representation */}
                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${actualPercentages.protein}%` }}
                  />
                  <div 
                    className="bg-orange-500 transition-all duration-500"
                    style={{ width: `${actualPercentages.carbs}%` }}
                  />
                  <div 
                    className="bg-purple-500 transition-all duration-500"
                    style={{ width: `${actualPercentages.fat}%` }}
                  />
                </div>

                {/* Detailed breakdown */}
                <div className="space-y-3">
                  {[
                    {
                      name: 'Protéines',
                      type: 'protein' as const,
                      actual: dailyAverages.avgProtein,
                      target: targetProteinGrams,
                      actualPercent: actualPercentages.protein,
                      targetPercent: targetMacros.proteinPercentage
                    },
                    {
                      name: 'Glucides',
                      type: 'carbs' as const,
                      actual: dailyAverages.avgCarbs,
                      target: targetCarbsGrams,
                      actualPercent: actualPercentages.carbs,
                      targetPercent: targetMacros.carbPercentage
                    },
                    {
                      name: 'Lipides',
                      type: 'fat' as const,
                      actual: dailyAverages.avgFat,
                      target: targetFatGrams,
                      actualPercent: actualPercentages.fat,
                      targetPercent: targetMacros.fatPercentage
                    }
                  ].map((macro) => (
                    <div key={macro.type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getMacroIcon(macro.type)}
                          <span className="font-medium">{macro.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{macro.actual}g</span>
                          <span className="text-gray-500 ml-1">/ {macro.target}g</span>
                          <span className="text-xs text-gray-500 ml-2">({macro.actualPercent}%)</span>
                        </div>
                      </div>
                      <Progress 
                        value={(macro.actual / macro.target) * 100} 
                        className="h-2"
                      />
                      {Math.abs(macro.actualPercent - macro.targetPercent) > 5 && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>
                            {macro.actualPercent > macro.targetPercent ? 'Au-dessus' : 'En-dessous'} 
                            de l'objectif ({macro.targetPercent}%)
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Caloric Distribution */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Distribution calorique
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(safeNumber(dailyAverages.avgProtein * 4))}
                    </div>
                    <div className="text-xs text-gray-500">kcal protéines</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(safeNumber(dailyAverages.avgCarbs * 4))}
                    </div>
                    <div className="text-xs text-gray-500">kcal glucides</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(safeNumber(dailyAverages.avgFat * 9))}
                    </div>
                    <div className="text-xs text-gray-500">kcal lipides</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="daily" className="space-y-4">
              <div className="space-y-3">
                {dailyBreakdown.map((day) => (
                  <div key={day.day} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-semibold">Jour {day.day}</h5>
                        <p className="text-xs text-gray-500">{day.date}</p>
                        {selectedFoods?.[day.day] && Object.values(selectedFoods[day.day]).some(mealFoods => mealFoods.length > 0) && (
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 mt-1">
                            <Info className="h-3 w-3 mr-1" />
                            +{calculateDayTotalNutrition(day.day).calories} kcal ANSES-CIQUAL
                          </Badge>
                        )}
                      </div>
                      <Badge variant={day.calories > targetMacros.dailyCalories * 1.1 ? "destructive" : 
                                    day.calories < targetMacros.dailyCalories * 0.9 ? "secondary" : "default"}>
                        {day.calories} kcal
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <Beef className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                        <div className="font-semibold">{day.protein}g</div>
                        <div className="text-xs text-gray-500">Protéines</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <Wheat className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                        <div className="font-semibold">{day.carbs}g</div>
                        <div className="text-xs text-gray-500">Glucides</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <Droplet className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                        <div className="font-semibold">{day.fat}g</div>
                        <div className="text-xs text-gray-500">Lipides</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}