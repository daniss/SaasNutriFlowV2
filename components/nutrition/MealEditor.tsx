"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Plus, Minus, Edit3, Save, X, Utensils, Scale, Activity } from "lucide-react"
import FoodSearchModal from "@/components/dashboard/FoodSearchModal"

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

interface MealData {
  name: string
  description: string
  foods: SelectedFood[]
  instructions: string[]
  notes: string
}

interface MealEditorProps {
  mealType: "breakfast" | "lunch" | "dinner" | "snacks"
  mealLabel: string
  initialData?: MealData
  onSave: (mealData: MealData) => void
  onCancel: () => void
}

export default function MealEditor({ 
  mealType, 
  mealLabel, 
  initialData, 
  onSave, 
  onCancel 
}: MealEditorProps) {
  const [mealData, setMealData] = useState<MealData>(initialData || {
    name: "",
    description: "",
    foods: [],
    instructions: [""],
    notes: ""
  })
  
  const [foodSearchOpen, setFoodSearchOpen] = useState(false)
  const [editingInstruction, setEditingInstruction] = useState<number | null>(null)
  const [newInstruction, setNewInstruction] = useState("")

  const handleAddFood = (food: SelectedFood) => {
    setMealData(prev => ({
      ...prev,
      foods: [...prev.foods, food]
    }))
  }

  const handleRemoveFood = (index: number) => {
    setMealData(prev => ({
      ...prev,
      foods: prev.foods.filter((_, i) => i !== index)
    }))
  }

  const handleUpdateFoodQuantity = (index: number, quantity: number) => {
    setMealData(prev => ({
      ...prev,
      foods: prev.foods.map((food, i) => 
        i === index ? { ...food, quantity } : food
      )
    }))
  }

  const calculateNutrition = () => {
    return mealData.foods.reduce((total, food) => {
      const factor = food.quantity / 100
      return {
        calories: total.calories + (food.energy_kcal || 0) * factor,
        protein: total.protein + (food.protein_g || 0) * factor,
        carbs: total.carbs + (food.carbohydrate_g || 0) * factor,
        fat: total.fat + (food.fat_g || 0) * factor,
        fiber: total.fiber + (food.fiber_g || 0) * factor
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
  }

  const addInstruction = () => {
    setMealData(prev => ({
      ...prev,
      instructions: [...prev.instructions, ""]
    }))
  }

  const updateInstruction = (index: number, value: string) => {
    setMealData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => 
        i === index ? value : inst
      )
    }))
  }

  const removeInstruction = (index: number) => {
    setMealData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }))
  }

  const handleSave = () => {
    // Filter out empty instructions
    const cleanedData = {
      ...mealData,
      instructions: mealData.instructions.filter(inst => inst.trim().length > 0)
    }
    onSave(cleanedData)
  }

  const nutrition = calculateNutrition()

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Utensils className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">Éditer {mealLabel}</h2>
            <p className="text-sm text-slate-600 truncate">Personnalisez ce repas avec des aliments de la base ANSES-CIQUAL</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
            <X className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Annuler</span>
            <span className="sm:hidden">Annuler</span>
          </Button>
          <Button onClick={handleSave} disabled={!mealData.name.trim()} className="flex-1 sm:flex-none">
            <Save className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Enregistrer</span>
            <span className="sm:hidden">Sauver</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editing Area */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meal-name">Nom du repas *</Label>
                  <Input
                    id="meal-name"
                    placeholder="Ex: Salade de quinoa aux légumes"
                    value={mealData.name}
                    onChange={(e) => setMealData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-base" // Prevent mobile zoom
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meal-description">Description</Label>
                  <Input
                    id="meal-description"
                    placeholder="Ex: Repas léger et nutritif"
                    value={mealData.description}
                    onChange={(e) => setMealData(prev => ({ ...prev, description: e.target.value }))}
                    className="text-base" // Prevent mobile zoom
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Food Selection */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-lg">Aliments et portions</CardTitle>
                  <CardDescription className="text-sm">
                    Recherchez et ajoutez des aliments avec leurs quantités précises
                  </CardDescription>
                </div>
                <Button onClick={() => setFoodSearchOpen(true)} className="flex-shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ajouter un aliment</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mealData.foods.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Utensils className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-medium mb-1">Aucun aliment ajouté</p>
                  <p className="text-sm">Cliquez sur "Ajouter un aliment" pour commencer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mealData.foods.map((food, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{food.name_fr}</div>
                        <div className="text-sm text-slate-600 flex flex-wrap gap-2">
                          <span>{Math.round((food.energy_kcal || 0) * food.quantity / 100)} kcal</span>
                          <span>•</span>
                          <span>{Math.round((food.protein_g || 0) * food.quantity / 100 * 10) / 10}g prot.</span>
                          <span>•</span>
                          <span>{Math.round((food.carbohydrate_g || 0) * food.quantity / 100 * 10) / 10}g gluc.</span>
                          <span>•</span>
                          <span>{Math.round((food.fat_g || 0) * food.quantity / 100 * 10) / 10}g lip.</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 justify-between sm:justify-start">
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-slate-400" />
                          <Input
                            type="number"
                            value={food.quantity}
                            onChange={(e) => handleUpdateFoodQuantity(index, parseInt(e.target.value) || 0)}
                            className="w-20 text-center text-base"
                            min="1"
                          />
                          <span className="text-sm text-slate-500">g</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFood(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg">Instructions de préparation</CardTitle>
                <Button variant="outline" size="sm" onClick={addInstruction} className="flex-shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ajouter une étape</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mealData.instructions.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <p>Aucune instruction ajoutée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mealData.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1 text-xs flex-shrink-0">
                        {index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        {editingInstruction === index ? (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Textarea
                              value={newInstruction}
                              onChange={(e) => setNewInstruction(e.target.value)}
                              placeholder="Décrivez cette étape de préparation..."
                              rows={2}
                              className="flex-1 text-base"
                            />
                            <div className="flex sm:flex-col gap-1">
                              <Button
                                size="sm"
                                onClick={() => {
                                  updateInstruction(index, newInstruction)
                                  setEditingInstruction(null)
                                  setNewInstruction("")
                                }}
                                className="flex-1 sm:flex-none"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingInstruction(null)
                                  setNewInstruction("")
                                }}
                                className="flex-1 sm:flex-none"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <p className="text-slate-700 flex-1 text-sm">
                              {instruction || "Cliquez sur éditer pour ajouter une instruction"}
                            </p>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingInstruction(index)
                                  setNewInstruction(instruction)
                                }}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeInstruction(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes supplémentaires</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ajoutez des notes, substitutions possibles, conseils..."
                value={mealData.notes}
                onChange={(e) => setMealData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="text-base"
              />
            </CardContent>
          </Card>
        </div>

        {/* Nutrition Summary Sidebar */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                Valeurs nutritionnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <div className="font-semibold text-orange-900">Calories</div>
                  <div className="text-lg font-bold text-orange-700">
                    {Math.round(nutrition.calories)} kcal
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="font-semibold text-blue-900">Protéines</div>
                  <div className="text-lg font-bold text-blue-700">
                    {Math.round(nutrition.protein * 10) / 10}g
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <div className="font-semibold text-green-900">Glucides</div>
                  <div className="text-lg font-bold text-green-700">
                    {Math.round(nutrition.carbs * 10) / 10}g
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <div className="font-semibold text-purple-900">Lipides</div>
                  <div className="text-lg font-bold text-purple-700">
                    {Math.round(nutrition.fat * 10) / 10}g
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Fibres:</span>
                  <span className="font-medium">{Math.round(nutrition.fiber * 10) / 10}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Aliments:</span>
                  <span className="font-medium">{mealData.foods.length}</span>
                </div>
              </div>

              {mealData.foods.length > 0 && (
                <>
                  <Separator />
                  <div className="text-xs text-slate-500">
                    Valeurs calculées d'après la base ANSES-CIQUAL. 
                    Les valeurs peuvent varier selon la préparation et la qualité des aliments.
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <FoodSearchModal
        open={foodSearchOpen}
        onClose={() => setFoodSearchOpen(false)}
        onSelectFood={handleAddFood}
        mealSlot={mealType}
        day={1} // This could be made dynamic if needed
      />
    </div>
  )
}