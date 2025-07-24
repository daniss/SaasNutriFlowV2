'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, X, Clock, Users, Calculator } from 'lucide-react'

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

interface RecipeCardProps {
  recipe: Recipe
  onRemove: (recipeId: string) => void
  className?: string
}

export function RecipeCard({ recipe, onRemove, className = '' }: RecipeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatTime = (minutes?: number) => {
    if (!minutes) return ''
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const formatNutrition = () => {
    const parts = []
    if (recipe.calories_per_serving) parts.push(`${Math.round(recipe.calories_per_serving)} cal`)
    if (recipe.protein_per_serving) parts.push(`${Math.round(recipe.protein_per_serving)}g prot`)
    if (recipe.carbs_per_serving) parts.push(`${Math.round(recipe.carbs_per_serving)}g gluc`)
    if (recipe.fat_per_serving) parts.push(`${Math.round(recipe.fat_per_serving)}g lip`)
    return parts.join(' • ')
  }

  // Group ingredients by category
  const groupedIngredients = (recipe.ingredients || []).reduce((acc, ingredient) => {
    // Debug logging to understand the ingredient structure  
    if (!ingredient.ingredient && typeof window !== 'undefined') {
      console.warn('RecipeCard: ingredient.ingredient is undefined:', ingredient)
    }
    
    const category = ingredient.ingredient?.category || 'Autres'
    if (!acc[category]) acc[category] = []
    acc[category].push(ingredient)
    return acc
  }, {} as Record<string, typeof recipe.ingredients>)

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-medium">{recipe.name}</CardTitle>
            {recipe.description && (
              <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(recipe.id)}
            className="ml-2 text-gray-400 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {recipe.servings} portion{recipe.servings > 1 ? 's' : ''}
          </Badge>
          {(recipe.prep_time || recipe.cook_time) && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime((recipe.prep_time || 0) + (recipe.cook_time || 0))}
            </Badge>
          )}
          {formatNutrition() && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Calculator className="h-3 w-3" />
              Par portion
            </Badge>
          )}
        </div>

        {formatNutrition() && (
          <div className="text-sm text-gray-600 mt-2">
            {formatNutrition()}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <span className="text-sm font-medium text-gray-700">
                Ingrédients ({recipe.ingredients?.length || 0})
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 mt-3">
            {Object.entries(groupedIngredients).map(([category, ingredients]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-800 mb-2">
                  {category}
                </h4>
                <div className="space-y-1 ml-2">
                  {ingredients.map((ingredient) => (
                    <div 
                      key={ingredient.id} 
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-700">
                        {ingredient.ingredient?.name || 'Ingrédient inconnu'}
                      </span>
                      <span className="text-gray-500 font-medium">
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}