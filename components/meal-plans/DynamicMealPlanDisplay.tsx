"use client"

import { Clock } from "lucide-react"
import { MealPlanContent, isDynamicMealPlan, isLegacyMealPlan, convertLegacyToDynamic } from "@/lib/meal-plan-types"

interface DynamicMealPlanDisplayProps {
  planContent: MealPlanContent
  selectedDay?: number
  onEditDay?: (dayNumber: number) => void
}

// Professional color palette for meal types
const getMealColor = (mealName: string, index: number): string => {
  const name = mealName.toLowerCase()
  
  // Specific meal type colors
  if (name.includes('petit-déjeuner') || name.includes('breakfast')) {
    return 'bg-orange-400'
  } else if (name.includes('déjeuner') && !name.includes('petit')) {
    return 'bg-blue-400'
  } else if (name.includes('dîner') || name.includes('dinner')) {
    return 'bg-purple-400'
  } else if (name.includes('collation') || name.includes('snack')) {
    return 'bg-emerald-400'
  } else if (name.includes('pré-entraînement') || name.includes('pre-workout')) {
    return 'bg-amber-400'
  } else if (name.includes('post-entraînement') || name.includes('post-workout')) {
    return 'bg-teal-400'
  }
  
  // Fallback colors based on order
  const colors = [
    'bg-orange-400',   // 0
    'bg-blue-400',     // 1  
    'bg-purple-400',   // 2
    'bg-emerald-400',  // 3
    'bg-amber-400',    // 4
    'bg-teal-400',     // 5
    'bg-rose-400',     // 6
    'bg-indigo-400'    // 7
  ]
  
  return colors[index % colors.length]
}

export function DynamicMealPlanDisplay({ 
  planContent, 
  selectedDay = 1,
  onEditDay 
}: DynamicMealPlanDisplayProps) {
  // Convert legacy format to dynamic if needed
  const dynamicPlan = isDynamicMealPlan(planContent) 
    ? planContent 
    : isLegacyMealPlan(planContent) 
      ? convertLegacyToDynamic(planContent)
      : null

  if (!dynamicPlan || !dynamicPlan.days) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Aucun contenu de plan alimentaire disponible</p>
      </div>
    )
  }

  const day = dynamicPlan.days.find(d => d.day === selectedDay)
  
  if (!day) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Jour {selectedDay} non trouvé dans le plan</p>
      </div>
    )
  }

  // Filter enabled meals and sort by order
  const enabledMeals = day.meals
    .filter(meal => meal.enabled)
    .sort((a, b) => a.order - b.order)

  if (enabledMeals.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Aucun repas configuré pour ce jour</p>
        {onEditDay && (
          <button 
            onClick={() => onEditDay(selectedDay)}
            className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            Configurer les repas
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {enabledMeals.map((meal, index) => (
        <div key={meal.id} className="group">
          <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
            <div className={`h-2 w-2 ${getMealColor(meal.name, index)} rounded-full`}></div>
            <span>{meal.name}</span>
            <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {meal.time}
            </span>
          </h4>
          
          <div className="text-sm text-slate-600 ml-4">
            {meal.description ? (
              meal.description.split('\n').map((line, lineIndex) => (
                <div key={lineIndex} className="mb-1">
                  • {line.trim()}
                </div>
              ))
            ) : (
              <div className="text-slate-400 italic">
                Repas à définir
              </div>
            )}
          </div>
          
          {meal.calories_target && (
            <div className="text-xs text-slate-500 ml-4 mt-1">
              Objectif: {meal.calories_target} kcal
            </div>
          )}
        </div>
      ))}
      
      {/* Day notes if present */}
      {day.notes && (
        <div className="md:col-span-2 mt-4 p-3 bg-slate-50 rounded-lg">
          <h5 className="font-medium text-slate-700 mb-1">Notes du jour</h5>
          <p className="text-sm text-slate-600">{day.notes}</p>
        </div>
      )}
    </div>
  )
}

// Backward compatibility component for legacy meal plans
export function LegacyMealPlanDisplay({ 
  day,
  onEditDay 
}: { 
  day: any
  onEditDay?: (dayNumber: number) => void 
}) {
  const mealConfig = [
    { key: 'breakfast', name: 'Petit-déjeuner', color: 'bg-orange-400', hour: day.breakfastHour || '08:00', enabled: day.breakfastEnabled !== false },
    { key: 'lunch', name: 'Déjeuner', color: 'bg-blue-400', hour: day.lunchHour || '12:00', enabled: day.lunchEnabled !== false },
    { key: 'dinner', name: 'Dîner', color: 'bg-purple-400', hour: day.dinnerHour || '19:00', enabled: day.dinnerEnabled !== false },
    { key: 'snacks', name: 'Collations', color: 'bg-emerald-400', hour: day.snacksHour || '16:00', enabled: day.snacksEnabled === true }
  ]
  
  const enabledMeals = mealConfig.filter(meal => meal.enabled)
  
  if (enabledMeals.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Aucun repas configuré pour ce jour</p>
        {onEditDay && (
          <button 
            onClick={() => onEditDay(day.day)}
            className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            Configurer les repas
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {enabledMeals.map(meal => (
        <div key={meal.key}>
          <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
            <div className={`h-2 w-2 ${meal.color} rounded-full`}></div>
            <span>{meal.name}</span>
            <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {meal.hour}
            </span>
          </h4>
          <ul className="space-y-1 text-sm text-slate-600 ml-4">
            {(day.meals?.[meal.key as keyof typeof day.meals] || []).map((mealItem: any, idx: number) => (
              <li key={idx}>• {mealItem}</li>
            ))}
          </ul>
        </div>
      ))}
      
      {day.notes && (
        <div className="md:col-span-2 mt-4 p-3 bg-slate-50 rounded-lg">
          <h5 className="font-medium text-slate-700 mb-1">Notes du jour</h5>
          <p className="text-sm text-slate-600">{day.notes}</p>
        </div>
      )}
    </div>
  )
}