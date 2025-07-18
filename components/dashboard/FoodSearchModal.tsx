import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Search, Utensils, Scale, Activity } from "lucide-react"

interface Food {
  id: string
  name_fr: string
  barcode?: string
  category?: string
  energy_kcal?: number
  protein_g?: number
  fat_g?: number
  carbohydrate_g?: number
  fiber_g?: number
  sugar_g?: number
  saturated_fat_g?: number
  sodium_mg?: number
  calcium_mg?: number
  iron_mg?: number
  vitamin_c_mg?: number
  // Add portion information
  portion_gemrcn?: number
  portion_pnns?: number
}

interface SelectedFood extends Food {
  quantity: number // in grams
  portionSize: 'custom' | 'gemrcn' | 'pnns'
}

interface FoodSearchModalProps {
  open: boolean
  onClose: () => void
  onSelectFood: (food: SelectedFood) => void
  mealSlot: "breakfast" | "lunch" | "dinner" | "snacks"
  day: number
}

const foodCategories = [
  "Viandes", "Poissons", "Légumes", "Fruits", "Céréales", "Légumineuses",
  "Produits laitiers", "Matières grasses", "Boissons", "Condiments"
]

const mealSlotLabels = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner", 
  dinner: "Dîner",
  snacks: "Collations"
}

export default function FoodSearchModal({ open, onClose, onSelectFood, mealSlot, day }: FoodSearchModalProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [barcode, setBarcode] = useState("")
  const [results, setResults] = useState<Food[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [quantity, setQuantity] = useState("100")
  const [portionSize, setPortionSize] = useState<'custom' | 'gemrcn' | 'pnns'>('custom')

  // Auto-search when opening modal or when search term changes
  useEffect(() => {
    if (open && search.length >= 2) {
      handleSearch()
    }
  }, [search, open])

  const handleSearch = async () => {
    if (!search && !category && !barcode) return
    
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (search) params.append("name", search)
      if (category && category !== "all") params.append("category", category)
      if (barcode) params.append("barcode", barcode)
      params.append("limit", "50")
      
      const res = await fetch(`/api/french-foods?${params.toString()}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResults(data.foods || [])
    } catch (err: any) {
      setError(err.message || "Erreur lors de la recherche.")
    } finally {
      setLoading(false)
    }
  }

  const calculateNutrients = (food: Food, grams: number) => {
    const factor = grams / 100
    return {
      calories: Math.round((food.energy_kcal || 0) * factor),
      protein: Math.round((food.protein_g || 0) * factor * 10) / 10,
      carbs: Math.round((food.carbohydrate_g || 0) * factor * 10) / 10,
      fat: Math.round((food.fat_g || 0) * factor * 10) / 10,
      fiber: Math.round((food.fiber_g || 0) * factor * 10) / 10
    }
  }

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food)
    // Set default quantity based on portion sizes
    if (food.portion_gemrcn && food.portion_gemrcn > 0) {
      setQuantity(food.portion_gemrcn.toString())
      setPortionSize('gemrcn')
    } else if (food.portion_pnns && food.portion_pnns > 0) {
      setQuantity(food.portion_pnns.toString())
      setPortionSize('pnns')
    } else {
      setQuantity("100")
      setPortionSize('custom')
    }
  }

  const handleAddFood = () => {
    if (!selectedFood) return
    
    const selectedFoodWithPortion: SelectedFood = {
      ...selectedFood,
      quantity: parseInt(quantity),
      portionSize
    }
    
    onSelectFood(selectedFoodWithPortion)
    setSelectedFood(null)
    setSearch("")
    setResults([])
    onClose()
  }

  const handlePortionChange = (value: 'custom' | 'gemrcn' | 'pnns') => {
    setPortionSize(value)
    if (selectedFood) {
      if (value === 'gemrcn' && selectedFood.portion_gemrcn) {
        setQuantity(selectedFood.portion_gemrcn.toString())
      } else if (value === 'pnns' && selectedFood.portion_pnns) {
        setQuantity(selectedFood.portion_pnns.toString())
      } else {
        setQuantity("100")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Rechercher un aliment (ANSES-CIQUAL)
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un aliment à ajouter au <b>{mealSlotLabels[mealSlot]}</b> du jour <b>{day}</b>.
          </DialogDescription>
        </DialogHeader>

        {!selectedFood ? (
          // Search Phase
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Nom de l'aliment</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="search"
                    placeholder="Ex: pomme, saumon, riz..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    {foodCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="barcode">Code-barres (optionnel)</Label>
              <Input
                id="barcode"
                placeholder="Scannez ou saisissez le code-barres"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                className="text-base"
              />
            </div>

            <Button onClick={handleSearch} disabled={loading} className="w-full">
              {loading ? "Recherche..." : "Rechercher"}
            </Button>

            <Separator />

            <div className="space-y-2">
              {error && <div className="text-red-600 text-sm">{error}</div>}
              {search.length > 0 && search.length < 2 && (
                <div className="text-slate-500 text-sm">Tapez au moins 2 caractères pour rechercher automatiquement.</div>
              )}
              {results.length === 0 && !loading && search.length >= 2 && (
                <div className="text-slate-500 text-center py-8">
                  <Utensils className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  Aucun aliment trouvé pour "{search}"
                </div>
              )}
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {results.map(food => (
                  <div key={food.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{food.name_fr}</div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div>Catégorie: {food.category || "Non spécifiée"}</div>
                        <div className="flex gap-4 text-xs">
                          <span>🔥 {food.energy_kcal || 0} kcal/100g</span>
                          <span>🥩 {food.protein_g || 0}g protéines</span>
                          <span>🍞 {food.carbohydrate_g || 0}g glucides</span>
                          <span>🧈 {food.fat_g || 0}g lipides</span>
                        </div>
                        {(food.portion_gemrcn || food.portion_pnns) && (
                          <div className="flex gap-2">
                            {food.portion_gemrcn && (
                              <Badge variant="outline" className="text-xs">GEMRCN: {food.portion_gemrcn}g</Badge>
                            )}
                            {food.portion_pnns && (
                              <Badge variant="outline" className="text-xs">PNNS: {food.portion_pnns}g</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleFoodSelect(food)} className="w-full sm:w-auto">
                      Sélectionner
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Portion Selection Phase
          <div className="space-y-6 py-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">{selectedFood.name_fr}</h3>
              <div className="text-sm text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>Catégorie: {selectedFood.category || "Non spécifiée"}</div>
                <div>Énergie: {selectedFood.energy_kcal || 0} kcal/100g</div>
                <div>Protéines: {selectedFood.protein_g || 0}g/100g</div>
                <div>Glucides: {selectedFood.carbohydrate_g || 0}g/100g</div>
                <div>Lipides: {selectedFood.fat_g || 0}g/100g</div>
                <div>Fibres: {selectedFood.fiber_g || 0}g/100g</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type de portion</Label>
                <Select value={portionSize} onValueChange={handlePortionChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Quantité personnalisée</SelectItem>
                    {selectedFood.portion_gemrcn && (
                      <SelectItem value="gemrcn">Portion GEMRCN ({selectedFood.portion_gemrcn}g)</SelectItem>
                    )}
                    {selectedFood.portion_pnns && (
                      <SelectItem value="pnns">Portion PNNS ({selectedFood.portion_pnns}g)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité (grammes)</Label>
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-slate-400" />
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="flex-1 text-base"
                    min="1"
                    max="2000"
                  />
                  <span className="text-sm text-slate-500">g</span>
                </div>
              </div>

              {quantity && parseInt(quantity) > 0 && (
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-emerald-900">Apport nutritionnel pour {quantity}g</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {(() => {
                      const nutrients = calculateNutrients(selectedFood, parseInt(quantity))
                      return (
                        <>
                          <div>Calories: <span className="font-semibold">{nutrients.calories} kcal</span></div>
                          <div>Protéines: <span className="font-semibold">{nutrients.protein}g</span></div>
                          <div>Glucides: <span className="font-semibold">{nutrients.carbs}g</span></div>
                          <div>Lipides: <span className="font-semibold">{nutrients.fat}g</span></div>
                          <div className="col-span-2">Fibres: <span className="font-semibold">{nutrients.fiber}g</span></div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {selectedFood ? (
            <>
              <Button variant="outline" onClick={() => setSelectedFood(null)} className="flex-1 sm:flex-none">
                Retour
              </Button>
              <Button onClick={handleAddFood} disabled={!quantity || parseInt(quantity) <= 0} className="flex-1 sm:flex-none">
                Ajouter l'aliment
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
