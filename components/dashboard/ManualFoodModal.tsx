import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { PlusCircle, Scale } from "lucide-react"

interface ManualFood {
  id: string
  name_fr: string
  quantity: number
  energy_kcal?: number
  protein_g?: number
  carbohydrate_g?: number
  fat_g?: number
  fiber_g?: number
  notes?: string
}

interface ManualFoodModalProps {
  open: boolean
  onClose: () => void
  onAddFood: (food: ManualFood) => void
  mealSlot: "breakfast" | "lunch" | "dinner" | "snacks"
  day: number
}

const mealSlotLabels = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner", 
  dinner: "Dîner",
  snacks: "Collations"
}

export default function ManualFoodModal({ open, onClose, onAddFood, mealSlot, day }: ManualFoodModalProps) {
  const [formData, setFormData] = useState({
    name_fr: "",
    quantity: "100",
    energy_kcal: "",
    protein_g: "",
    carbohydrate_g: "",
    fat_g: "",
    fiber_g: "",
    notes: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = () => {
    if (!formData.name_fr.trim()) return

    const manualFood: ManualFood = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name_fr: formData.name_fr.trim(),
      quantity: parseInt(formData.quantity) || 100,
      energy_kcal: formData.energy_kcal ? parseFloat(formData.energy_kcal) : undefined,
      protein_g: formData.protein_g ? parseFloat(formData.protein_g) : undefined,
      carbohydrate_g: formData.carbohydrate_g ? parseFloat(formData.carbohydrate_g) : undefined,
      fat_g: formData.fat_g ? parseFloat(formData.fat_g) : undefined,
      fiber_g: formData.fiber_g ? parseFloat(formData.fiber_g) : undefined,
      notes: formData.notes.trim() || undefined
    }

    onAddFood(manualFood)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setFormData({
      name_fr: "",
      quantity: "100",
      energy_kcal: "",
      protein_g: "",
      carbohydrate_g: "",
      fat_g: "",
      fiber_g: "",
      notes: ""
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Ajouter un aliment manuel
          </DialogTitle>
          <DialogDescription>
            Créez un aliment personnalisé pour le <b>{mealSlotLabels[mealSlot]}</b> du jour <b>{day}</b>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name_fr">Nom de l'aliment *</Label>
            <Input
              id="name_fr"
              placeholder="Ex: Salade de quinoa maison, Smoothie vert..."
              value={formData.name_fr}
              onChange={(e) => handleInputChange("name_fr", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité (grammes) *</Label>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-slate-400" />
              <Input
                id="quantity"
                type="number"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                min="1"
                max="2000"
                required
              />
              <span className="text-sm text-slate-500">g</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="energy_kcal">Calories (kcal/100g)</Label>
              <Input
                id="energy_kcal"
                type="number"
                placeholder="250"
                value={formData.energy_kcal}
                onChange={(e) => handleInputChange("energy_kcal", e.target.value)}
                min="0"
                max="900"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein_g">Protéines (g/100g)</Label>
              <Input
                id="protein_g"
                type="number"
                placeholder="15"
                value={formData.protein_g}
                onChange={(e) => handleInputChange("protein_g", e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carbohydrate_g">Glucides (g/100g)</Label>
              <Input
                id="carbohydrate_g"
                type="number"
                placeholder="30"
                value={formData.carbohydrate_g}
                onChange={(e) => handleInputChange("carbohydrate_g", e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fat_g">Lipides (g/100g)</Label>
              <Input
                id="fat_g"
                type="number"
                placeholder="10"
                value={formData.fat_g}
                onChange={(e) => handleInputChange("fat_g", e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiber_g">Fibres (g/100g)</Label>
              <Input
                id="fiber_g"
                type="number"
                placeholder="5"
                value={formData.fiber_g}
                onChange={(e) => handleInputChange("fiber_g", e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Recette, ingrédients, préparation..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          {/* Nutritional preview */}
          {formData.quantity && parseInt(formData.quantity) > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Aperçu nutritionnel pour {formData.quantity}g</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Calories: <span className="font-semibold">
                  {formData.energy_kcal ? Math.round(parseFloat(formData.energy_kcal) * parseInt(formData.quantity) / 100) : 0} kcal
                </span></div>
                <div>Protéines: <span className="font-semibold">
                  {formData.protein_g ? Math.round(parseFloat(formData.protein_g) * parseInt(formData.quantity) / 100 * 10) / 10 : 0}g
                </span></div>
                <div>Glucides: <span className="font-semibold">
                  {formData.carbohydrate_g ? Math.round(parseFloat(formData.carbohydrate_g) * parseInt(formData.quantity) / 100 * 10) / 10 : 0}g
                </span></div>
                <div>Lipides: <span className="font-semibold">
                  {formData.fat_g ? Math.round(parseFloat(formData.fat_g) * parseInt(formData.quantity) / 100 * 10) / 10 : 0}g
                </span></div>
                <div className="col-span-2">Fibres: <span className="font-semibold">
                  {formData.fiber_g ? Math.round(parseFloat(formData.fiber_g) * parseInt(formData.quantity) / 100 * 10) / 10 : 0}g
                </span></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.name_fr.trim() || !formData.quantity || parseInt(formData.quantity) <= 0}
          >
            Ajouter l'aliment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}