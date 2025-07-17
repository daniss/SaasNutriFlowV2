"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChefHat, Clock, Users, Star, Plus, Search, Filter, Sparkles } from "lucide-react"
import { supabase, type Recipe } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuthNew"

interface RecipeSuggestionsProps {
  onRecipeSelect: (recipe: Recipe) => void
  selectedRecipes: Recipe[]
  mealType?: string
  searchQuery?: string
}

export default function RecipeSuggestions({ 
  onRecipeSelect, 
  selectedRecipes, 
  mealType,
  searchQuery 
}: RecipeSuggestionsProps) {
  const { user } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [localSearch, setLocalSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  useEffect(() => {
    if (user) {
      fetchRecipes()
    }
  }, [user, mealType, searchQuery])

  const fetchRecipes = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      let query = supabase
        .from('recipes')
        .select('*')
        .eq('dietitian_id', user.id)

      // Filter by meal type category if provided
      if (mealType) {
        const categoryMap = {
          'breakfast': ['breakfast'],
          'lunch': ['lunch', 'main_course', 'salad'],
          'dinner': ['dinner', 'main_course'],
          'snack': ['snack', 'dessert']
        }
        const categories = categoryMap[mealType as keyof typeof categoryMap] || []
        if (categories.length > 0) {
          query = query.in('category', categories)
        }
      }

      // Add text search if provided
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`)
      }

      const { data, error } = await query
        .order('usage_count', { ascending: false })
        .order('is_favorite', { ascending: false })
        .limit(12)

      if (error) throw error
      
      setRecipes(data || [])
    } catch (error) {
      console.error('Error fetching recipe suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = !localSearch || 
      recipe.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(localSearch.toLowerCase()) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(localSearch.toLowerCase()))
    
    const matchesCategory = categoryFilter === "all" || recipe.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const categories = [
    { value: "all", label: "Toutes" },
    { value: "breakfast", label: "Petit-déjeuner" },
    { value: "lunch", label: "Déjeuner" },
    { value: "dinner", label: "Dîner" },
    { value: "snack", label: "Collation" },
    { value: "main_course", label: "Plat principal" },
    { value: "salad", label: "Salade" }
  ]

  const isRecipeSelected = (recipeId: string) => {
    return selectedRecipes.some(r => r.id === recipeId)
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'breakfast': 'bg-orange-100 text-orange-800',
      'lunch': 'bg-blue-100 text-blue-800',
      'dinner': 'bg-purple-100 text-purple-800',
      'snack': 'bg-green-100 text-green-800',
      'main_course': 'bg-indigo-100 text-indigo-800',
      'salad': 'bg-emerald-100 text-emerald-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Suggestions de recettes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-32 rounded-lg mb-2"></div>
                <div className="bg-gray-200 h-4 rounded mb-1"></div>
                <div className="bg-gray-200 h-3 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <ChefHat className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Suggestions de recettes</CardTitle>
              <CardDescription>
                Utilisez vos recettes existantes {mealType && `pour ${mealType}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Sparkles className="h-4 w-4" />
            <span>{selectedRecipes.length} sélectionnée{selectedRecipes.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher dans vos recettes..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
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

        {/* Recipe Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-8">
            <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">
              {localSearch || categoryFilter !== "all" 
                ? "Aucune recette trouvée avec ces critères"
                : "Aucune recette disponible"
              }
            </p>
            <p className="text-sm text-gray-400">
              Créez des recettes pour les utiliser dans vos plans alimentaires
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer group ${
                  isRecipeSelected(recipe.id)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => onRecipeSelect(recipe)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 line-clamp-1 text-sm">
                        {recipe.name}
                      </h4>
                      {recipe.is_favorite && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {recipe.description}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isRecipeSelected(recipe.id)
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-gray-300 group-hover:border-emerald-400'
                  }`}>
                    {isRecipeSelected(recipe.id) && (
                      <Plus className="h-3 w-3 text-white rotate-45" />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge className={`${getCategoryColor(recipe.category)} border-0 text-xs px-2 py-0.5`}>
                    {recipe.category}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{recipe.servings}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{(recipe.prep_time || 0) + (recipe.cook_time || 0)}min</span>
                    </div>
                  </div>
                  {recipe.calories_per_serving && (
                    <div className="font-medium text-green-600">
                      {recipe.calories_per_serving} kcal
                    </div>
                  )}
                </div>

                {/* Selection overlay */}
                {isRecipeSelected(recipe.id) && (
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-lg pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        )}

        {selectedRecipes.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-900 mb-2">
              Recettes sélectionnées ({selectedRecipes.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {selectedRecipes.map((recipe) => (
                <Badge
                  key={recipe.id}
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
                  onClick={() => onRecipeSelect(recipe)}
                >
                  {recipe.name}
                  <Plus className="h-3 w-3 ml-1 rotate-45" />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}