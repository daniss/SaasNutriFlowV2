"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Plus, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { MealSlot, DynamicMealPlanDay, generateMealId } from "@/lib/meal-plan-types"

// Professional limits consistent with templates
const MAX_MEALS_PER_DAY = 8

interface DynamicMealEditDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (dayData: DynamicMealPlanDay) => void
  dayData?: DynamicMealPlanDay | null
  dayNumber: number
}

export function DynamicMealEditDialog({
  isOpen,
  onClose,
  onSave,
  dayData,
  dayNumber
}: DynamicMealEditDialogProps) {
  const [editData, setEditData] = useState<DynamicMealPlanDay>({
    day: dayNumber,
    date: new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    meals: [],
    notes: ""
  })

  // Initialize edit data when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (dayData) {
        setEditData(dayData)
      } else {
        // Create default meal structure for new days
        const defaultMeals: MealSlot[] = [
          {
            id: generateMealId(dayNumber, 'Petit-déjeuner'),
            name: 'Petit-déjeuner',
            time: '08:00',
            description: '',
            enabled: true,
            order: 0
          },
          {
            id: generateMealId(dayNumber, 'Déjeuner'),
            name: 'Déjeuner',
            time: '12:00',
            description: '',
            enabled: true,
            order: 1
          },
          {
            id: generateMealId(dayNumber, 'Dîner'),
            name: 'Dîner',
            time: '19:00',
            description: '',
            enabled: true,
            order: 2
          }
        ]

        setEditData({
          day: dayNumber,
          date: new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          meals: defaultMeals,
          notes: ""
        })
      }
    }
  }, [isOpen, dayData, dayNumber])

  const addMeal = () => {
    if (editData.meals.length >= MAX_MEALS_PER_DAY) {
      toast({
        title: "Limite atteinte",
        description: `Maximum ${MAX_MEALS_PER_DAY} repas par jour pour maintenir une structure claire et professionnelle.`,
        variant: "default",
      })
      return
    }

    const newMeal: MealSlot = {
      id: generateMealId(dayNumber, `Repas ${editData.meals.length + 1}`),
      name: '',
      time: '12:00',
      description: '',
      enabled: true,
      order: editData.meals.length
    }

    setEditData(prev => ({
      ...prev,
      meals: [...prev.meals, newMeal].sort((a, b) => a.order - b.order)
    }))
  }

  const removeMeal = (mealIndex: number) => {
    if (editData.meals.length <= 1) {
      toast({
        title: "Action impossible",
        description: "Un jour doit contenir au moins un repas.",
        variant: "destructive",
      })
      return
    }

    setEditData(prev => ({
      ...prev,
      meals: prev.meals.filter((_, index) => index !== mealIndex)
    }))
  }

  const updateMeal = (mealIndex: number, field: keyof MealSlot, value: string | number | boolean | null) => {
    setEditData(prev => ({
      ...prev,
      meals: prev.meals.map((meal, index) => 
        index === mealIndex 
          ? { ...meal, [field]: value }
          : meal
      )
    }))
  }

  const handleSave = () => {
    // Validate required fields
    const enabledMeals = editData.meals.filter(meal => meal.enabled)
    if (enabledMeals.length === 0) {
      toast({
        title: "Validation requise",
        description: "Au moins un repas doit être activé.",
        variant: "destructive",
      })
      return
    }

    // Check for empty meal names
    const hasEmptyNames = enabledMeals.some(meal => !meal.name.trim())
    if (hasEmptyNames) {
      toast({
        title: "Validation requise",
        description: "Tous les repas activés doivent avoir un nom.",
        variant: "destructive",
      })
      return
    }

    onSave(editData)
    onClose()
  }

  const mealTypes = [
    "Petit-déjeuner", "Collation matin", "Déjeuner", "Collation après-midi", 
    "Dîner", "Collation soir", "Pré-entraînement", "Post-entraînement"
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Modifier le jour {dayNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Meals Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Repas du jour</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addMeal}
                disabled={editData.meals.length >= MAX_MEALS_PER_DAY}
                className={editData.meals.length >= MAX_MEALS_PER_DAY ? "opacity-50 cursor-not-allowed" : ""}
                title={editData.meals.length >= MAX_MEALS_PER_DAY ? `Maximum ${MAX_MEALS_PER_DAY} repas par jour atteint` : "Ajouter un repas"}
              >
                <Plus className="h-4 w-4 mr-2" />
                {editData.meals.length >= MAX_MEALS_PER_DAY 
                  ? `Limite atteinte (${editData.meals.length}/${MAX_MEALS_PER_DAY})` 
                  : `Ajouter un repas (${editData.meals.length}/${MAX_MEALS_PER_DAY})`
                }
              </Button>
            </div>

            {editData.meals.map((meal, mealIndex) => (
              <div key={meal.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Repas {mealIndex + 1}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMeal(mealIndex)}
                    disabled={editData.meals.length === 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`meal-name-${mealIndex}`}>Nom du repas *</Label>
                    <select
                      id={`meal-name-${mealIndex}`}
                      value={meal.name}
                      onChange={(e) => updateMeal(mealIndex, 'name', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Sélectionner un type de repas</option>
                      {mealTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`meal-time-${mealIndex}`}>Heure</Label>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <Input
                        id={`meal-time-${mealIndex}`}
                        type="time"
                        value={meal.time}
                        onChange={(e) => updateMeal(mealIndex, 'time', e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`meal-description-${mealIndex}`}>Description du repas</Label>
                  <Textarea
                    id={`meal-description-${mealIndex}`}
                    value={meal.description}
                    onChange={(e) => updateMeal(mealIndex, 'description', e.target.value)}
                    placeholder="Décrivez le contenu du repas..."
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`meal-calories-${mealIndex}`}>Objectif calories (optionnel)</Label>
                  <Input
                    id={`meal-calories-${mealIndex}`}
                    type="number"
                    value={meal.calories_target || ''}
                    onChange={(e) => updateMeal(mealIndex, 'calories_target', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Ex: 500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="day-notes">Notes du jour (optionnel)</Label>
            <Textarea
              id="day-notes"
              value={editData.notes}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes spéciales pour ce jour..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              Sauvegarder le jour
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}