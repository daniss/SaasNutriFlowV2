"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Star, 
  StarOff,
  ChefHat,
  Clock,
  Users,
  Utensils,
  Search,
  Filter
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSkeleton, EmptyStateWithSkeleton } from "@/components/shared/skeletons"
import { useAuth } from "@/hooks/useAuthNew"
import { supabase, type Recipe, type RecipeIngredient } from "@/lib/supabase"
import RecipeDialog from "@/components/recipes/RecipeDialog"

export default function RecipesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)

  useEffect(() => {
    if (user) {
      fetchRecipes()
    }
  }, [user])

  const fetchRecipes = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('dietitian_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setRecipes(data || [])
    } catch (error) {
      console.error('Error fetching recipes:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les recettes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('dietitian_id', user.id)
      
      if (error) throw error
      
      setRecipes(prev => prev.filter(r => r.id !== recipeId))
      toast({
        title: "Succès",
        description: "Recette supprimée avec succès"
      })
    } catch (error) {
      console.error('Error deleting recipe:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la recette",
        variant: "destructive"
      })
    }
  }

  const handleToggleFavorite = async (recipe: Recipe) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ is_favorite: !recipe.is_favorite })
        .eq('id', recipe.id)
        .eq('dietitian_id', user.id)
      
      if (error) throw error
      
      setRecipes(prev => prev.map(r => 
        r.id === recipe.id ? { ...r, is_favorite: !r.is_favorite } : r
      ))
      
      toast({
        title: "Succès",
        description: `Recette ${!recipe.is_favorite ? 'ajoutée aux' : 'retirée des'} favoris`
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast({
        title: "Erreur",
        description: "Impossible de modifier les favoris",
        variant: "destructive"
      })
    }
  }

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "breakfast", label: "Petit-déjeuner" },
    { value: "lunch", label: "Déjeuner" },
    { value: "dinner", label: "Dîner" },
    { value: "snack", label: "Collation" },
    { value: "dessert", label: "Dessert" },
    { value: "appetizer", label: "Entrée" },
    { value: "main_course", label: "Plat principal" },
    { value: "side_dish", label: "Accompagnement" },
    { value: "soup", label: "Soupe" },
    { value: "salad", label: "Salade" },
    { value: "vegetarian", label: "Végétarien" },
    { value: "vegan", label: "Vegan" },
    { value: "gluten_free", label: "Sans gluten" }
  ]

  const difficulties = [
    { value: "all", label: "Toutes les difficultés" },
    { value: "easy", label: "Facile" },
    { value: "medium", label: "Moyen" },
    { value: "hard", label: "Difficile" }
  ]

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = categoryFilter === "all" || recipe.category === categoryFilter
    const matchesDifficulty = difficultyFilter === "all" || recipe.difficulty === difficultyFilter
    
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Bibliothèque de recettes"
        subtitle={`${recipes.length} recettes dans votre bibliothèque professionnelle`}
        searchPlaceholder="Rechercher des recettes..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle recette
          </Button>
        }
      />

      <div className="px-6 space-y-6">
        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
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
          
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-44">
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

        {/* Recipe Grid */}
        {filteredRecipes.length === 0 ? (
          <EmptyStateWithSkeleton 
            icon={ChefHat}
            title={searchTerm ? "Aucune recette trouvée" : "Aucune recette"}
            description={searchTerm 
              ? "Essayez d'ajuster vos termes de recherche ou filtres." 
              : "Créez votre première recette pour commencer à construire votre bibliothèque professionnelle."
            }
            action={!searchTerm ? (
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer votre première recette
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                onEdit={(recipe: Recipe) => {
                  setEditingRecipe(recipe)
                  setIsEditDialogOpen(true)
                }}
                onDelete={(id: string) => handleDeleteRecipe(id)}
                onToggleFavorite={() => handleToggleFavorite(recipe)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Recipe Dialog */}
      <RecipeDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={() => {
          setIsAddDialogOpen(false)
          fetchRecipes()
        }}
      />

      {/* Edit Recipe Dialog */}
      {editingRecipe && (
        <RecipeDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false)
            setEditingRecipe(null)
          }}
          recipe={editingRecipe}
          onSave={() => {
            setIsEditDialogOpen(false)
            setEditingRecipe(null)
            fetchRecipes()
          }}
        />
      )}
    </div>
  )
}

// Recipe Card Component
function RecipeCard({ 
  recipe, 
  onEdit, 
  onDelete,
  onToggleFavorite
}: { 
  recipe: Recipe
  onEdit: (recipe: Recipe) => void
  onDelete: (id: string) => void
  onToggleFavorite: () => void
}) {
  const getCategoryColor = (category: string) => {
    const colors = {
      'breakfast': 'bg-orange-100 text-orange-800',
      'lunch': 'bg-blue-100 text-blue-800',
      'dinner': 'bg-purple-100 text-purple-800',
      'snack': 'bg-green-100 text-green-800',
      'dessert': 'bg-pink-100 text-pink-800',
      'vegetarian': 'bg-emerald-100 text-emerald-800',
      'vegan': 'bg-teal-100 text-teal-800',
      'gluten_free': 'bg-yellow-100 text-yellow-800',
      'main_course': 'bg-indigo-100 text-indigo-800',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800',
    }
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)

  return (
    <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm hover:shadow-soft-md transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base font-semibold text-gray-900 line-clamp-1">
                {recipe.name}
              </CardTitle>
              {recipe.is_favorite && (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              )}
            </div>
            <CardDescription className="text-sm text-gray-600 line-clamp-2">
              {recipe.description}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(recipe)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleFavorite}>
                {recipe.is_favorite ? (
                  <>
                    <StarOff className="mr-2 h-4 w-4" />
                    Retirer des favoris
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Ajouter aux favoris
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(recipe.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge className={`${getCategoryColor(recipe.category)} border-0 font-medium px-3 py-1`}>
            {recipe.category}
          </Badge>
          <Badge className={`${getDifficultyColor(recipe.difficulty)} border-0 font-medium px-3 py-1`}>
            {recipe.difficulty}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-3 w-3" />
            <span>{recipe.servings} portion{recipe.servings > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-3 w-3" />
            <span>{totalTime > 0 ? `${totalTime}min` : 'Flexible'}</span>
          </div>
        </div>

        {recipe.calories_per_serving && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{recipe.calories_per_serving} kcal</span> par portion
          </div>
        )}

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
            {recipe.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{recipe.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}