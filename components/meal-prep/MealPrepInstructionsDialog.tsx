"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  ChefHat, 
  Clock, 
  Plus, 
  X, 
  Move,
  AlertCircle,
  Utensils,
  Timer,
  Thermometer,
  BookOpen,
  Zap
} from "lucide-react"

interface MealPrepStep {
  id?: string
  step_number: number
  step_type: 'prep' | 'cook' | 'assemble' | 'store' | 'reheat' | 'serve'
  title: string
  description: string
  duration_minutes?: number
  temperature?: string
  equipment?: string
  tips?: string
  order_position: number
  is_optional: boolean
}

interface IngredientPrepDetail {
  id?: string
  ingredient_name: string
  quantity?: string
  unit?: string
  prep_method?: string
  prep_notes?: string
  storage_method?: string
  shelf_life_days?: number
  prep_order: number
}

interface MealPrepInstructionsDialogProps {
  isOpen: boolean
  onClose: () => void
  recipeId?: string
  mealPlanId?: string
  instructionId?: string
  onSaved: () => void
}

export default function MealPrepInstructionsDialog({
  isOpen,
  onClose,
  recipeId,
  mealPlanId,
  instructionId,
  onSaved
}: MealPrepInstructionsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prep_time_minutes: 30,
    difficulty_level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    equipment_needed: [] as string[],
    prep_category: 'meal_prep' as 'meal_prep' | 'batch_cooking' | 'advance_prep' | 'quick_prep',
    servings: 1,
    storage_instructions: '',
    nutrition_notes: '',
    is_template: false
  })
  const [prepSteps, setPrepSteps] = useState<MealPrepStep[]>([])
  const [ingredients, setIngredients] = useState<IngredientPrepDetail[]>([])
  const [newEquipment, setNewEquipment] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (instructionId) {
        fetchInstruction()
      } else {
        resetForm()
      }
    }
  }, [isOpen, instructionId])

  const fetchInstruction = async () => {
    if (!instructionId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/meal-prep/${instructionId}`)
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error)
      
      const instruction = data.instruction
      setFormData({
        title: instruction.title,
        description: instruction.description || '',
        prep_time_minutes: instruction.prep_time_minutes || 30,
        difficulty_level: instruction.difficulty_level || 'intermediate',
        equipment_needed: instruction.equipment_needed || [],
        prep_category: instruction.prep_category || 'meal_prep',
        servings: instruction.servings || 1,
        storage_instructions: instruction.storage_instructions || '',
        nutrition_notes: instruction.nutrition_notes || '',
        is_template: instruction.is_template || false
      })
      setPrepSteps(instruction.prep_steps || [])
      setIngredients(instruction.ingredient_prep_details || [])
    } catch (error) {
      console.error('Error fetching instruction:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les instructions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      prep_time_minutes: 30,
      difficulty_level: 'intermediate',
      equipment_needed: [],
      prep_category: 'meal_prep',
      servings: 1,
      storage_instructions: '',
      nutrition_notes: '',
      is_template: false
    })
    setPrepSteps([])
    setIngredients([])
  }

  const handleAutoGenerate = async () => {
    if (!recipeId) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/meal-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: recipeId,
          title: formData.title || 'Instructions générées automatiquement',
          auto_generate: true
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error)
      
      toast({
        title: "Instructions générées",
        description: "Les instructions de base ont été générées automatiquement"
      })
      
      onSaved()
      onClose()
    } catch (error) {
      console.error('Error auto-generating:', error)
      toast({
        title: "Erreur",
        description: "Impossible de générer les instructions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const requestData = {
        ...formData,
        recipe_id: recipeId,
        meal_plan_id: mealPlanId,
        prep_steps: prepSteps,
        ingredient_prep_details: ingredients
      }

      const url = instructionId ? `/api/meal-prep/${instructionId}` : '/api/meal-prep'
      const method = instructionId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: "Succès",
        description: instructionId ? "Instructions mises à jour" : "Instructions créées avec succès"
      })

      onSaved()
      onClose()
    } catch (error) {
      console.error('Error saving instruction:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addPrepStep = () => {
    const newStep: MealPrepStep = {
      step_number: prepSteps.length + 1,
      step_type: 'prep',
      title: '',
      description: '',
      order_position: prepSteps.length + 1,
      is_optional: false
    }
    setPrepSteps([...prepSteps, newStep])
  }

  const updatePrepStep = (index: number, updates: Partial<MealPrepStep>) => {
    const updatedSteps = [...prepSteps]
    updatedSteps[index] = { ...updatedSteps[index], ...updates }
    setPrepSteps(updatedSteps)
  }

  const removePrepStep = (index: number) => {
    const updatedSteps = prepSteps.filter((_, i) => i !== index)
    // Reorder step numbers and positions
    const reorderedSteps = updatedSteps.map((step, i) => ({
      ...step,
      step_number: i + 1,
      order_position: i + 1
    }))
    setPrepSteps(reorderedSteps)
  }

  const addIngredient = () => {
    const newIngredient: IngredientPrepDetail = {
      ingredient_name: '',
      prep_order: ingredients.length + 1
    }
    setIngredients([...ingredients, newIngredient])
  }

  const updateIngredient = (index: number, updates: Partial<IngredientPrepDetail>) => {
    const updatedIngredients = [...ingredients]
    updatedIngredients[index] = { ...updatedIngredients[index], ...updates }
    setIngredients(updatedIngredients)
  }

  const removeIngredient = (index: number) => {
    const updatedIngredients = ingredients.filter((_, i) => i !== index)
    // Reorder
    const reorderedIngredients = updatedIngredients.map((ingredient, i) => ({
      ...ingredient,
      prep_order: i + 1
    }))
    setIngredients(reorderedIngredients)
  }

  const addEquipment = () => {
    if (newEquipment.trim() && !formData.equipment_needed.includes(newEquipment.trim())) {
      setFormData(prev => ({
        ...prev,
        equipment_needed: [...prev.equipment_needed, newEquipment.trim()]
      }))
      setNewEquipment('')
    }
  }

  const removeEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipment_needed: prev.equipment_needed.filter(item => item !== equipment)
    }))
  }

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'prep': return <ChefHat className="h-4 w-4" />
      case 'cook': return <Thermometer className="h-4 w-4" />
      case 'assemble': return <Utensils className="h-4 w-4" />
      case 'store': return <BookOpen className="h-4 w-4" />
      case 'reheat': return <Timer className="h-4 w-4" />
      case 'serve': return <Utensils className="h-4 w-4" />
      default: return <ChefHat className="h-4 w-4" />
    }
  }

  const getStepTypeColor = (type: string) => {
    switch (type) {
      case 'prep': return 'bg-blue-100 text-blue-800'
      case 'cook': return 'bg-red-100 text-red-800'
      case 'assemble': return 'bg-green-100 text-green-800'
      case 'store': return 'bg-purple-100 text-purple-800'
      case 'reheat': return 'bg-orange-100 text-orange-800'
      case 'serve': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            {instructionId ? 'Modifier les instructions' : 'Créer des instructions de préparation'}
          </DialogTitle>
          <DialogDescription>
            Créez des instructions détaillées étape par étape pour la préparation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nom des instructions"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prep_category">Catégorie</Label>
              <Select 
                value={formData.prep_category} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, prep_category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meal_prep">Meal Prep</SelectItem>
                  <SelectItem value="batch_cooking">Batch Cooking</SelectItem>
                  <SelectItem value="advance_prep">Préparation à l'avance</SelectItem>
                  <SelectItem value="quick_prep">Préparation rapide</SelectItem>
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
              placeholder="Description générale des instructions"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prep_time">Temps de préparation (min)</Label>
              <Input
                id="prep_time"
                type="number"
                value={formData.prep_time_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, prep_time_minutes: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulté</Label>
              <Select 
                value={formData.difficulty_level} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Débutant</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="advanced">Avancé</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
          </div>

          {/* Equipment */}
          <div className="space-y-2">
            <Label>Équipement nécessaire</Label>
            <div className="flex gap-2">
              <Input
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                placeholder="Ajouter un équipement"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
              />
              <Button type="button" variant="outline" onClick={addEquipment}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.equipment_needed.map((equipment) => (
                <Badge key={equipment} variant="secondary" className="pr-1">
                  {equipment}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => removeEquipment(equipment)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Auto-generate option for recipes */}
          {recipeId && !instructionId && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4" />
                  Génération automatique
                </CardTitle>
                <CardDescription>
                  Générer des instructions de base à partir de la recette
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAutoGenerate}
                  disabled={loading}
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Générer automatiquement
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Preparation Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Étapes de préparation</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPrepStep}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une étape
              </Button>
            </div>

            <div className="space-y-3">
              {prepSteps.map((step, index) => (
                <Card key={index} className="border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStepTypeColor(step.step_type)} border-0`}>
                          {getStepTypeIcon(step.step_type)}
                          <span className="ml-1">Étape {step.step_number}</span>
                        </Badge>
                        <Select 
                          value={step.step_type} 
                          onValueChange={(value: any) => updatePrepStep(index, { step_type: value })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prep">Préparation</SelectItem>
                            <SelectItem value="cook">Cuisson</SelectItem>
                            <SelectItem value="assemble">Assemblage</SelectItem>
                            <SelectItem value="store">Stockage</SelectItem>
                            <SelectItem value="reheat">Réchauffage</SelectItem>
                            <SelectItem value="serve">Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removePrepStep(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      value={step.title}
                      onChange={(e) => updatePrepStep(index, { title: e.target.value })}
                      placeholder="Titre de l'étape"
                    />
                    <Textarea
                      value={step.description}
                      onChange={(e) => updatePrepStep(index, { description: e.target.value })}
                      placeholder="Description détaillée de l'étape"
                      rows={2}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        value={step.duration_minutes || ''}
                        onChange={(e) => updatePrepStep(index, { duration_minutes: parseInt(e.target.value) || undefined })}
                        placeholder="Durée (min)"
                      />
                      <Input
                        value={step.temperature || ''}
                        onChange={(e) => updatePrepStep(index, { temperature: e.target.value })}
                        placeholder="Température"
                      />
                      <Input
                        value={step.equipment || ''}
                        onChange={(e) => updatePrepStep(index, { equipment: e.target.value })}
                        placeholder="Équipement"
                      />
                    </div>
                    {step.tips && (
                      <Textarea
                        value={step.tips}
                        onChange={(e) => updatePrepStep(index, { tips: e.target.value })}
                        placeholder="Conseils et astuces"
                        rows={1}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Storage Instructions */}
          <div className="space-y-2">
            <Label htmlFor="storage">Instructions de conservation</Label>
            <Textarea
              id="storage"
              value={formData.storage_instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, storage_instructions: e.target.value }))}
              placeholder="Comment conserver les aliments préparés"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Sauvegarde..." : (instructionId ? "Mettre à jour" : "Créer les instructions")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}