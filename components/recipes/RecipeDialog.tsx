"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Plus, ChefHat } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase, type Recipe, type RecipeIngredient } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuthNew"

interface RecipeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  recipe?: Recipe
}

interface Ingredient {
  name: string
  quantity: number | null
  unit: string
  notes: string
}

export default function RecipeDialog({ isOpen, onClose, onSave, recipe }: RecipeDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentTag, setCurrentTag] = useState("")
  const [currentInstruction, setCurrentInstruction] = useState("")
  
  const [formData, setFormData] = useState({
    name: recipe?.name || "",
    description: recipe?.description || "",
    category: recipe?.category || "main_course",
    prep_time: recipe?.prep_time || null,
    cook_time: recipe?.cook_time || null,
    servings: recipe?.servings || 1,
    difficulty: recipe?.difficulty || "medium",
    calories_per_serving: recipe?.calories_per_serving || null,
    protein_per_serving: recipe?.protein_per_serving || null,
    carbs_per_serving: recipe?.carbs_per_serving || null,
    fat_per_serving: recipe?.fat_per_serving || null,
    fiber_per_serving: recipe?.fiber_per_serving || null,
    image_url: recipe?.image_url || "",
    tags: recipe?.tags || [],
    instructions: recipe?.instructions || []
  })

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", quantity: null, unit: "", notes: "" }
  ])

  // Load ingredients if editing
  useState(() => {
    if (recipe) {
      loadIngredients()
    }
  })

  const loadIngredients = async () => {
    if (!recipe) return

    try {
      const { data, error } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .eq('recipe_id', recipe.id)
        .order('order_index')

      if (error) throw error

      if (data && data.length > 0) {
        setIngredients(data.map(ing => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit || "",
          notes: ing.notes || ""
        })))
      }
    } catch (error) {
      console.error('Error loading ingredients:', error)
    }
  }

  const categories = [
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

  const units = [
    "g", "kg", "ml", "l", "tasse", "cuillère à soupe", "cuillère à café", 
    "pièce", "tranche", "gousse", "pincée", "bouquet", "brin"
  ]

  const handleSubmit = async () => {
    if (!user || !formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const recipeData = {
        dietitian_id: user.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        prep_time: formData.prep_time,
        cook_time: formData.cook_time,
        servings: formData.servings,
        difficulty: formData.difficulty,
        calories_per_serving: formData.calories_per_serving,
        protein_per_serving: formData.protein_per_serving,
        carbs_per_serving: formData.carbs_per_serving,
        fat_per_serving: formData.fat_per_serving,
        fiber_per_serving: formData.fiber_per_serving,
        image_url: formData.image_url.trim() || null,
        tags: formData.tags,
        instructions: formData.instructions.filter(inst => inst.trim()),
        is_favorite: recipe?.is_favorite || false,
        usage_count: recipe?.usage_count || 0
      }

      let recipeResult
      if (recipe) {
        recipeResult = await supabase
          .from("recipes")
          .update(recipeData)
          .eq("id", recipe.id)
          .select()
          .single()
      } else {
        recipeResult = await supabase
          .from("recipes")
          .insert(recipeData)
          .select()
          .single()
      }

      if (recipeResult.error) throw recipeResult.error

      const recipeId = recipeResult.data.id

      // Delete existing ingredients if editing
      if (recipe) {
        await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', recipeId)
      }

      // Insert ingredients
      const validIngredients = ingredients
        .filter(ing => ing.name.trim())
        .map((ing, index) => ({
          recipe_id: recipeId,
          name: ing.name.trim(),
          quantity: ing.quantity,
          unit: ing.unit.trim() || null,
          notes: ing.notes.trim() || null,
          order_index: index
        }))

      if (validIngredients.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(validIngredients)

        if (ingredientsError) throw ingredientsError
      }

      onSave()
      onClose()
      toast({
        title: "Succès",
        description: `Recette ${recipe ? "modifiée" : "créée"} avec succès`,
      })
    } catch (error) {
      console.error("Error saving recipe:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la recette",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: null, unit: "", notes: "" }])
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number | null) => {
    setIngredients(ingredients.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    ))
  }

  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag]
      }))
      setCurrentTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const addInstruction = () => {
    if (currentInstruction.trim()) {
      setFormData(prev => ({
        ...prev,
        instructions: [...prev.instructions, currentInstruction.trim()]
      }))
      setCurrentInstruction("")
    }
  }

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            {recipe ? "Modifier la recette" : "Nouvelle recette"}
          </DialogTitle>
          <DialogDescription>
            {recipe ? "Modifiez les détails de votre recette." : "Créez une nouvelle recette pour votre bibliothèque."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Informations</TabsTrigger>
            <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la recette *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Salade quinoa avocat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre recette..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servings">Portions</Label>
                <Input
                  id="servings"
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prep_time">Préparation (min)</Label>
                <Input
                  id="prep_time"
                  type="number"
                  value={formData.prep_time || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, prep_time: e.target.value ? parseInt(e.target.value) : null }))}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cook_time">Cuisson (min)</Label>
                <Input
                  id="cook_time"
                  type="number"
                  value={formData.cook_time || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, cook_time: e.target.value ? parseInt(e.target.value) : null }))}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulté</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Facile</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="hard">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Ajouter un tag"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ingrédients ({ingredients.length})</h3>
              <Button variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un ingrédient
              </Button>
            </div>

            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm">Ingrédient</Label>
                    <Input
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, "name", e.target.value)}
                      placeholder="Ex: Quinoa"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Quantité</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={ingredient.quantity || ""}
                      onChange={(e) => updateIngredient(index, "quantity", e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Unité</Label>
                    <Select 
                      value={ingredient.unit} 
                      onValueChange={(value) => updateIngredient(index, "unit", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Notes</Label>
                    <Input
                      value={ingredient.notes}
                      onChange={(e) => updateIngredient(index, "notes", e.target.value)}
                      placeholder="Ex: émincé"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      disabled={ingredients.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="instructions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Instructions ({formData.instructions.length})</h3>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  value={currentInstruction}
                  onChange={(e) => setCurrentInstruction(e.target.value)}
                  placeholder="Décrivez une étape de préparation..."
                  rows={2}
                  className="flex-1"
                />
                <Button variant="outline" onClick={addInstruction} disabled={!currentInstruction.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-medium text-emerald-700">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-sm">{instruction}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInstruction(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories par portion</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.calories_per_serving || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    calories_per_serving: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  placeholder="300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">Protéines (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  value={formData.protein_per_serving || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    protein_per_serving: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                  placeholder="15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Glucides (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  value={formData.carbs_per_serving || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    carbs_per_serving: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                  placeholder="45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">Lipides (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  value={formData.fat_per_serving || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fat_per_serving: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                  placeholder="12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiber">Fibres (g)</Label>
                <Input
                  id="fiber"
                  type="number"
                  step="0.1"
                  value={formData.fiber_per_serving || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fiber_per_serving: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                  placeholder="6"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Conseils nutritionnels</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Renseignez les valeurs nutritionnelles pour un suivi précis</li>
                <li>• Utilisez des outils de calcul nutritionnel pour plus de précision</li>
                <li>• Ces données aideront à créer des plans alimentaires équilibrés</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enregistrement..." : (recipe ? "Modifier" : "Créer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}