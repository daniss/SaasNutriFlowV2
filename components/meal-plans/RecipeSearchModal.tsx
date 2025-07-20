'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Clock, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProviderNew'

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

interface RecipeSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectRecipe: (recipe: Recipe) => void
  excludeRecipeIds?: string[]
}

export function RecipeSearchModal({ 
  isOpen, 
  onClose, 
  onSelectRecipe, 
  excludeRecipeIds = [] 
}: RecipeSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user) {
      searchRecipes('')
    }
  }, [isOpen, user])

  const searchRecipes = async (query: string) => {
    if (!user) return

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Use profile_id (the current user's ID) instead of dietitian_id
      // In this application, profiles table stores the nutritionist data
      let query_builder = supabase
        .from('recipes')
        .select(`
          id,
          name,
          description,
          servings,
          prep_time,
          cook_time,
          calories_per_serving,
          protein_per_serving,
          carbs_per_serving,
          fat_per_serving,
          fiber_per_serving,
          recipe_ingredients (
            id,
            quantity,
            unit,
            ingredients (
              id,
              name,
              category
            )
          )
        `)
        .eq('dietitian_id', user.id)
        .order('name')

      if (query.trim()) {
        query_builder = query_builder.ilike('name', `%${query}%`)
      }

      const { data: recipesData, error } = await query_builder

      if (error) {
        console.error('Error searching recipes:', error)
        return
      }

      // Transform the data to match our interface
      const transformedRecipes: Recipe[] = (recipesData || []).map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description || undefined,
        servings: recipe.servings,
        prep_time: recipe.prep_time || undefined,
        cook_time: recipe.cook_time || undefined,
        calories_per_serving: recipe.calories_per_serving || undefined,
        protein_per_serving: recipe.protein_per_serving || undefined,
        carbs_per_serving: recipe.carbs_per_serving || undefined,
        fat_per_serving: recipe.fat_per_serving || undefined,
        fiber_per_serving: recipe.fiber_per_serving || undefined,
        ingredients: (recipe.recipe_ingredients || []).map((ri: any) => ({
          id: ri.id,
          ingredient: {
            id: ri.ingredients?.id || '',
            name: ri.ingredients?.name || '',
            category: ri.ingredients?.category || undefined
          },
          quantity: ri.quantity,
          unit: ri.unit
        }))
      }))

      // Filter out excluded recipes
      const filteredRecipes = transformedRecipes.filter(
        recipe => !excludeRecipeIds.includes(recipe.id)
      )

      setRecipes(filteredRecipes)
    } catch (error) {
      console.error('Error searching recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    searchRecipes(value)
  }

  const formatTime = (minutes?: number) => {
    if (!minutes) return ''
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const formatNutrition = (recipe: Recipe) => {
    const parts = []
    if (recipe.calories_per_serving) parts.push(`${Math.round(recipe.calories_per_serving)} cal`)
    if (recipe.protein_per_serving) parts.push(`${Math.round(recipe.protein_per_serving)}g prot`)
    if (recipe.carbs_per_serving) parts.push(`${Math.round(recipe.carbs_per_serving)}g gluc`)
    if (recipe.fat_per_serving) parts.push(`${Math.round(recipe.fat_per_serving)}g lip`)
    return parts.join(' • ')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajouter une recette</DialogTitle>
        </DialogHeader>

        <div className="flex-shrink-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher une recette..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Recherche en cours...
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Aucune recette trouvée' : 'Aucune recette disponible'}
            </div>
          ) : (
            recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  onSelectRecipe(recipe)
                  onClose()
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{recipe.name}</h3>
                    {recipe.description && (
                      <p className="text-gray-600 text-sm mt-1">{recipe.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
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
                </div>

                {formatNutrition(recipe) && (
                  <div className="text-sm text-gray-600 mb-3">
                    {formatNutrition(recipe)}
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-700">Ingrédients:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {recipe.ingredients.map((ingredient, index) => (
                      <div key={ingredient.id} className="text-sm text-gray-600">
                        • {ingredient.quantity} {ingredient.unit} {ingredient.ingredient.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}