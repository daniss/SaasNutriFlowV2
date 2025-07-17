"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuthNew"
import { supabase, type Recipe } from "@/lib/supabase"
import { 
  ChefHat, 
  Clock, 
  Plus, 
  Search, 
  Star, 
  Users,
  Filter,
  TrendingUp,
  Heart,
  Edit,
  Trash2,
  Target,
  Activity
} from "lucide-react"
import { useEffect, useState } from "react"
import RecipeDialog from "@/components/recipes/RecipeDialog"

interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: Array<{
    id: string
    name: string
    quantity: number | null
    unit: string | null
  }>
}

export default function RecipesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | undefined>()

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "breakfast", label: "Petit-déjeuner" },
    { value: "lunch", label: "Déjeuner" },
    { value: "dinner", label: "Dîner" },
    { value: "snack", label: "Collation" },
    { value: "dessert", label: "Dessert" },
    { value: "side", label: "Accompagnement" },
    { value: "drink", label: "Boisson" }
  ]

  const difficulties = [
    { value: "all", label: "Toutes les difficultés" },
    { value: "easy", label: "Facile" },
    { value: "medium", label: "Moyen" },
    { value: "hard", label: "Difficile" }
  ]

  const fetchRecipes = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("recipes")
        .select(`
          *,
          recipe_ingredients (
            id,
            name,
            quantity,
            unit
          )
        `)
        .eq("dietitian_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching recipes:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les recettes",
          variant: "destructive"
        })
        return
      }

      setRecipes(data || [])
    } catch (error) {
      console.error("Error fetching recipes:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les recettes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipes()
  }, [user])

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = categoryFilter === "all" || recipe.category === categoryFilter
    const matchesDifficulty = difficultyFilter === "all" || recipe.difficulty === difficultyFilter
    
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const handleCreateRecipe = () => {
    setSelectedRecipe(undefined)
    setIsRecipeDialogOpen(true)
  }

  const handleEditRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setIsRecipeDialogOpen(true)
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette recette ?")) return

    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId)

      if (error) throw error

      setRecipes(prev => prev.filter(r => r.id !== recipeId))
      toast({
        title: "Succès",
        description: "Recette supprimée avec succès"
      })
    } catch (error) {
      console.error("Error deleting recipe:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la recette",
        variant: "destructive"
      })
    }
  }

  const handleRecipeSaved = (recipe: Recipe) => {
    fetchRecipes() // Refresh the list
    setIsRecipeDialogOpen(false)
  }

  const toggleFavorite = async (recipeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("recipes")
        .update({ is_favorite: !currentStatus })
        .eq("id", recipeId)

      if (error) throw error

      setRecipes(prev => prev.map(r => 
        r.id === recipeId ? { ...r, is_favorite: !currentStatus } : r
      ))
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "Erreur",
        description: "Impossible de modifier le favori",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Recettes</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Recettes</h1>
          <p className="text-muted-foreground">
            Gérez votre bibliothèque de recettes pour créer des plans alimentaires personnalisés
          </p>
        </div>
        <Button onClick={handleCreateRecipe} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle recette
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recettes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipes.length}</div>
            <p className="text-xs text-muted-foreground">
              +{recipes.filter(r => new Date(r.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} ce mois
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipes.filter(r => r.is_favorite).length}</div>
            <p className="text-xs text-muted-foreground">
              Recettes marquées comme favorites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(recipes.reduce((acc, r) => acc + ((r.prep_time || 0) + (r.cook_time || 0)), 0) / recipes.length || 0)} min
            </div>
            <p className="text-xs text-muted-foreground">
              Préparation + cuisson
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plus utilisée</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...recipes.map(r => r.usage_count), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Nombre d'utilisations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une recette..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map(diff => (
                  <SelectItem key={diff.value} value={diff.value}>
                    {diff.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {recipes.length === 0 ? "Aucune recette pour le moment" : "Aucune recette trouvée"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {recipes.length === 0 
                ? "Commencez par créer votre première recette pour enrichir vos plans alimentaires."
                : "Essayez de modifier vos critères de recherche."
              }
            </p>
            {recipes.length === 0 && (
              <Button onClick={handleCreateRecipe}>
                <Plus className="h-4 w-4 mr-2" />
                Créer ma première recette
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="line-clamp-2">{recipe.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {recipe.description || "Aucune description"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(recipe.id, recipe.is_favorite)}
                  >
                    <Heart 
                      className={`h-4 w-4 ${recipe.is_favorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Categories and difficulty */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {categories.find(c => c.value === recipe.category)?.label || recipe.category}
                  </Badge>
                  <Badge variant={
                    recipe.difficulty === 'easy' ? 'default' : 
                    recipe.difficulty === 'medium' ? 'secondary' : 'destructive'
                  }>
                    {difficulties.find(d => d.value === recipe.difficulty)?.label || recipe.difficulty}
                  </Badge>
                </div>

                {/* Time and servings */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {((recipe.prep_time || 0) + (recipe.cook_time || 0))} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {recipe.servings} portions
                  </div>
                  {recipe.calories_per_serving && (
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {recipe.calories_per_serving} kcal
                    </div>
                  )}
                </div>

                {/* Nutrition info */}
                {(recipe.protein_per_serving || recipe.carbs_per_serving || recipe.fat_per_serving) && (
                  <div className="flex items-center gap-4 text-sm">
                    {recipe.protein_per_serving && (
                      <span className="text-emerald-600">P: {recipe.protein_per_serving}g</span>
                    )}
                    {recipe.carbs_per_serving && (
                      <span className="text-orange-600">G: {recipe.carbs_per_serving}g</span>
                    )}
                    {recipe.fat_per_serving && (
                      <span className="text-blue-600">L: {recipe.fat_per_serving}g</span>
                    )}
                  </div>
                )}

                {/* Tags */}
                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {recipe.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{recipe.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    {recipe.usage_count} utilisations
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRecipe(recipe)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRecipe(recipe.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recipe Dialog */}
      <RecipeDialog
        isOpen={isRecipeDialogOpen}
        onClose={() => setIsRecipeDialogOpen(false)}
        onSave={handleRecipeSaved}
        recipe={selectedRecipe}
      />
    </div>
  )
}