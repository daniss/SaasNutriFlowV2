// Professional Meal Plan Types - Dynamic Structure Support
// Supports flexible meal plans while maintaining backward compatibility

export interface MealSlot {
  id: string
  name: string
  time: string
  description?: string
  calories_target?: number | null
  enabled: boolean
  order: number
  recipe_id?: string // Many-to-one relationship to recipes table
}

export interface DynamicMealPlanDay {
  day: number
  date: string
  meals: MealSlot[]
  notes?: string
  templateData?: any // Preserve original template data
  selectedFoods?: Record<string, any[]> // Foods organized by meal ID
  selectedRecipes?: Record<string, any[]> // Recipes organized by meal ID
}

export interface DynamicMealPlan {
  days: DynamicMealPlanDay[]
  generated_by: 'template' | 'ai' | 'manual'
  template_id?: string
  template_name?: string
  target_macros?: any
  difficulty?: string
  notes?: string
  customizations?: any
  created_from_template_at?: string
  // Additional properties for backward compatibility and flexibility
  target_calories?: string | number
  duration_days?: number
  meal_modifications?: any
}

// Legacy 4-meal structure for backward compatibility
export interface LegacyMealPlanDay {
  day: number
  date: string
  meals: {
    breakfast: string[]
    lunch: string[]
    dinner: string[]
    snacks: string[]
  }
  breakfastHour: string
  lunchHour: string
  dinnerHour: string
  snacksHour: string
  breakfastEnabled: boolean
  lunchEnabled: boolean
  dinnerEnabled: boolean
  snacksEnabled: boolean
  notes?: string
  templateData?: any
}

export interface LegacyMealPlan {
  days: LegacyMealPlanDay[]
  generated_by: 'template' | 'ai' | 'manual'
  template_id?: string
  template_name?: string
  target_macros?: any
  difficulty?: string
  notes?: string
  customizations?: any
  created_from_template_at?: string
}

// Union type for meal plans
export type MealPlanContent = DynamicMealPlan | LegacyMealPlan

// Utility functions
export function isDynamicMealPlan(plan: MealPlanContent): plan is DynamicMealPlan {
  if (!plan.days || plan.days.length === 0) return false
  
  const firstDay = plan.days[0] as any
  return Array.isArray(firstDay.meals) && firstDay.meals.every((meal: any) => 
    meal && typeof meal === 'object' && 'id' in meal && 'name' in meal && 'time' in meal
  )
}

export function isLegacyMealPlan(plan: MealPlanContent): plan is LegacyMealPlan {
  if (!plan.days || plan.days.length === 0) return false
  
  const firstDay = plan.days[0] as any
  return firstDay.meals && typeof firstDay.meals === 'object' && 
    'breakfast' in firstDay.meals && 'lunch' in firstDay.meals && 
    'dinner' in firstDay.meals && 'snacks' in firstDay.meals
}

// Convert legacy meal plan to dynamic format
export function convertLegacyToDynamic(legacy: LegacyMealPlan): DynamicMealPlan {
  const dynamicDays: DynamicMealPlanDay[] = legacy.days.map(day => {
    const meals: MealSlot[] = []
    let order = 0

    // Convert legacy meals to dynamic format
    if (day.breakfastEnabled && day.meals.breakfast.length > 0) {
      meals.push({
        id: `${day.day}-breakfast`,
        name: 'Petit-déjeuner',
        time: day.breakfastHour,
        description: day.meals.breakfast.join('\n'),
        enabled: true,
        order: order++
      })
    }

    if (day.lunchEnabled && day.meals.lunch.length > 0) {
      meals.push({
        id: `${day.day}-lunch`,
        name: 'Déjeuner',
        time: day.lunchHour,
        description: day.meals.lunch.join('\n'),
        enabled: true,
        order: order++
      })
    }

    if (day.dinnerEnabled && day.meals.dinner.length > 0) {
      meals.push({
        id: `${day.day}-dinner`,
        name: 'Dîner',
        time: day.dinnerHour,
        description: day.meals.dinner.join('\n'),
        enabled: true,
        order: order++
      })
    }

    if (day.snacksEnabled && day.meals.snacks.length > 0) {
      meals.push({
        id: `${day.day}-snacks`,
        name: 'Collations',
        time: day.snacksHour,
        description: day.meals.snacks.join('\n'),
        enabled: true,
        order: order++
      })
    }

    return {
      day: day.day,
      date: day.date,
      meals: meals.sort((a, b) => a.order - b.order),
      notes: day.notes,
      templateData: day.templateData
    }
  })

  return {
    days: dynamicDays,
    generated_by: legacy.generated_by,
    template_id: legacy.template_id,
    template_name: legacy.template_name,
    target_macros: legacy.target_macros,
    difficulty: legacy.difficulty,
    notes: legacy.notes,
    customizations: legacy.customizations,
    created_from_template_at: legacy.created_from_template_at
  }
}

// Convert dynamic meal plan to legacy format (for backward compatibility)
export function convertDynamicToLegacy(dynamic: DynamicMealPlan): LegacyMealPlan {
  const legacyDays: LegacyMealPlanDay[] = dynamic.days.map(day => {
    const legacyMeals = {
      breakfast: [] as string[],
      lunch: [] as string[],
      dinner: [] as string[],
      snacks: [] as string[]
    }

    let breakfastHour = '08:00'
    let lunchHour = '12:00'
    let dinnerHour = '19:00'
    let snacksHour = '16:00'

    // Map dynamic meals to legacy categories
    day.meals.forEach(meal => {
      const category = mapMealNameToLegacyCategory(meal.name)
      const description = meal.description || meal.name
      
      legacyMeals[category].push(description)
      
      // Set timing
      if (category === 'breakfast') breakfastHour = meal.time
      else if (category === 'lunch') lunchHour = meal.time
      else if (category === 'dinner') dinnerHour = meal.time
      else if (category === 'snacks') snacksHour = meal.time
    })

    return {
      day: day.day,
      date: day.date,
      meals: legacyMeals,
      breakfastHour,
      lunchHour,
      dinnerHour,
      snacksHour,
      breakfastEnabled: legacyMeals.breakfast.length > 0,
      lunchEnabled: legacyMeals.lunch.length > 0,
      dinnerEnabled: legacyMeals.dinner.length > 0,
      snacksEnabled: legacyMeals.snacks.length > 0,
      notes: day.notes,
      templateData: day.templateData
    }
  })

  return {
    days: legacyDays,
    generated_by: dynamic.generated_by,
    template_id: dynamic.template_id,
    template_name: dynamic.template_name,
    target_macros: dynamic.target_macros,
    difficulty: dynamic.difficulty,
    notes: dynamic.notes,
    customizations: dynamic.customizations,
    created_from_template_at: dynamic.created_from_template_at
  }
}

// Helper function to map meal names to legacy categories
function mapMealNameToLegacyCategory(mealName: string): 'breakfast' | 'lunch' | 'dinner' | 'snacks' {
  const name = mealName.toLowerCase()
  
  if (name.includes('petit-déjeuner') || name.includes('petit déjeuner') || name.includes('breakfast')) {
    return 'breakfast'
  } else if (name.includes('déjeuner') && !name.includes('petit')) {
    return 'lunch'
  } else if (name.includes('dîner') || name.includes('diner') || name.includes('dinner')) {
    return 'dinner'
  }
  
  // Everything else goes to snacks
  return 'snacks'
}

// Generate unique meal ID
export function generateMealId(dayNumber: number, mealName: string): string {
  const sanitized = mealName.toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ÿ]/g, 'y')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  return `${dayNumber}-${sanitized}`
}

// Get default time for meal type
function getMealTime(mealType: string): string {
  switch(mealType) {
    case 'breakfast':
      return '08:00'
    case 'lunch':
      return '12:00'
    case 'dinner':
      return '19:00'
    case 'snack':
    case 'snacks':
      return '16:00'
    default:
      return '12:00'
  }
}

// Convert AI-generated meal plan to dynamic format
export function convertAIToDynamicMealPlan(aiPlan: any): DynamicMealPlan {
  const dynamicDays: DynamicMealPlanDay[] = aiPlan.days.map((day: any) => {
    const meals: MealSlot[] = []
    let order = 0

    // Map meal types to French names
    const mealTypeMap: Record<string, string> = {
      breakfast: 'Petit-déjeuner',
      lunch: 'Déjeuner',
      dinner: 'Dîner',
      snack: 'Collation',
      snacks: 'Collation'
    }

    // Handle both formats: array of meals (transformed) or object with meal properties (raw API)
    if (Array.isArray(day.meals)) {
      // Transformed format: meals is an array with type field
      day.meals.forEach((meal: any) => {
        // Use the actual meal name instead of generic type name for AI-generated plans
        const mealName = meal.name || mealTypeMap[meal.type] || meal.type
        // Use the AI-provided meal type if available, otherwise infer from the structure
        const mealType = meal.type || mealTypeMap[meal.type] || 'Petit-déjeuner'
        const time = getMealTime(meal.type)
        
        meals.push({
          id: generateMealId(day.day, mealName),
          name: mealType, // Use the proper meal type for categorization
          time: time,
          description: formatMealDescription(meal),
          calories_target: meal.calories,
          enabled: true,
          order: order++
        })
      })
    } else if (day.meals && typeof day.meals === 'object') {
      // Raw API format: meals is an object with breakfast, lunch, dinner properties
      // Process breakfast
      if (day.meals.breakfast) {
        const meal = day.meals.breakfast
        const mealName = meal.name || 'Petit-déjeuner'
        meals.push({
          id: generateMealId(day.day, mealName),
          name: mealName,
          time: '08:00',
          description: formatMealDescription(meal),
          calories_target: meal.calories,
          enabled: true,
          order: order++
        })
      }

      // Process lunch
      if (day.meals.lunch) {
        const meal = day.meals.lunch
        const mealName = meal.name || 'Déjeuner'
        meals.push({
          id: generateMealId(day.day, mealName),
          name: mealName,
          time: '12:00',
          description: formatMealDescription(meal),
          calories_target: meal.calories,
          enabled: true,
          order: order++
        })
      }

      // Process dinner
      if (day.meals.dinner) {
        const meal = day.meals.dinner
        const mealName = meal.name || 'Dîner'
        meals.push({
          id: generateMealId(day.day, mealName),
          name: mealName,
          time: '19:00',
          description: formatMealDescription(meal),
          calories_target: meal.calories,
          enabled: true,
          order: order++
        })
      }

      // Process snacks
      if (day.meals.snacks) {
        if (Array.isArray(day.meals.snacks)) {
          day.meals.snacks.forEach((snack: any, index: number) => {
            const snackName = snack.name || (index === 0 ? 'Collation après-midi' : `Collation ${index + 1}`)
            meals.push({
              id: generateMealId(day.day, snackName),
              name: snackName,
              time: index === 0 ? '16:00' : '21:00',
              description: formatMealDescription(snack),
              calories_target: snack.calories,
              enabled: true,
              order: order++
            })
          })
        } else if (typeof day.meals.snacks === 'object') {
          // Single snack object
          const snackName = day.meals.snacks.name || 'Collation après-midi'
          meals.push({
            id: generateMealId(day.day, snackName),
            name: snackName,
            time: '16:00',
            description: formatMealDescription(day.meals.snacks),
            calories_target: day.meals.snacks.calories,
            enabled: true,
            order: order++
          })
        }
      }
    }

    return {
      day: day.day,
      date: day.date || new Date(Date.now() + (day.day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      meals: meals.sort((a, b) => a.order - b.order),
      notes: day.notes
    }
  })

  return {
    days: dynamicDays,
    generated_by: 'ai',
    target_calories: aiPlan.averageCaloriesPerDay || aiPlan.targetCalories,
    duration_days: aiPlan.duration || aiPlan.totalDays,
    difficulty: aiPlan.difficulty,
    notes: aiPlan.notes || aiPlan.description,
    target_macros: aiPlan.nutritionSummary
  }
}

// Format meal description - simplified since detailed info is now in recipes
function formatMealDescription(meal: any): string {
  // For AI-generated meals, just use the basic description
  // Detailed ingredients, macros, and instructions are now in separate recipes
  let description = meal.description || meal.name || ''
  
  // If the description is just the name, don't duplicate it
  if (description === meal.name) {
    description = `Recette disponible dans votre collection de recettes.`
  }
  
  return description
}