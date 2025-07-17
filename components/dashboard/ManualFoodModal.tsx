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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Ajouter un aliment manuel
          </DialogTitle>
          <DialogDescription>
            Créez un aliment personnalisé pour le <b>{mealSlotLabels[mealSlot]}</b> du jour <b>{day}</b>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name_fr" className="text-sm">Nom de l'aliment *</Label>
              <Input
                id="name_fr"
                placeholder="Ex: Salade de quinoa maison..."
                value={formData.name_fr}
                onChange={(e) => handleInputChange("name_fr", e.target.value)}
                required
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="quantity" className="text-sm">Quantité (grammes) *</Label>
              <div className="flex items-center gap-2">
                <Scale className="h-3 w-3 text-slate-400" />
                <Input
                  id="quantity"
                  type="number"
                  placeholder="100"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  min="1"
                  max="2000"
                  required
                  className="h-8"
                />
                <span className="text-xs text-slate-500">g</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <div className="space-y-1">
              <Label htmlFor="energy_kcal" className="text-xs">Calories (kcal/100g)</Label>
              <Input
                id="energy_kcal"
                type="number"
                placeholder="250"
                value={formData.energy_kcal}
                onChange={(e) => handleInputChange("energy_kcal", e.target.value)}
                min="0"
                max="900"
                step="0.1"
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="protein_g" className="text-xs">Protéines (g/100g)</Label>
              <Input
                id="protein_g"
                type="number"
                placeholder="15"
                value={formData.protein_g}
                onChange={(e) => handleInputChange("protein_g", e.target.value)}
                min="0"
                max="100"
                step="0.1"
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="carbohydrate_g" className="text-xs">Glucides (g/100g)</Label>
              <Input
                id="carbohydrate_g"
                type="number"
                placeholder="30"
                value={formData.carbohydrate_g}
                onChange={(e) => handleInputChange("carbohydrate_g", e.target.value)}
                min="0"
                max="100"
                step="0.1"
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="fat_g" className="text-xs">Lipides (g/100g)</Label>
              <Input
                id="fat_g"
                type="number"
                placeholder="10"
                value={formData.fat_g}
                onChange={(e) => handleInputChange("fat_g", e.target.value)}
                min="0"
                max="100"
                step="0.1"
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="fiber_g" className="text-xs">Fibres (g/100g)</Label>
              <Input
                id="fiber_g"
                type="number"
                placeholder="5"
                value={formData.fiber_g}
                onChange={(e) => handleInputChange("fiber_g", e.target.value)}
                min="0"
                max="100"
                step="0.1"
                className="h-8"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes" className="text-sm">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Recette, ingrédients, préparation..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Nutritional preview */}
          {formData.quantity && parseInt(formData.quantity) > 0 && (
            <div className="bg-blue-50 p-2 rounded border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-1 text-sm">Aperçu pour {formData.quantity}g</h4>
              <div className="grid grid-cols-5 gap-1 text-xs">
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
                <div>Fibres: <span className="font-semibold">
                  {formData.fiber_g ? Math.round(parseFloat(formData.fiber_g) * parseInt(formData.quantity) / 100 * 10) / 10 : 0}g
                </span></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} size="sm">
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.name_fr.trim() || !formData.quantity || parseInt(formData.quantity) <= 0}
            size="sm"
          >
            Ajouter l'aliment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}