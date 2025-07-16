"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus, 
  Trash2, 
  Check,
  Edit2,
  Save,
  X,
  ShoppingCart,
  Package2,
  Calendar,
  CheckCircle,
  Circle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { type ShoppingList, type ShoppingListItem, DEFAULT_CATEGORIES } from "@/lib/shopping-list"

interface ShoppingListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  list: ShoppingList
  onUpdate: (updates: any) => void
  onItemUpdate: () => void
}

export function ShoppingListDialog({ 
  open, 
  onOpenChange, 
  list, 
  onUpdate, 
  onItemUpdate 
}: ShoppingListDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    unit: '',
    category: 'other',
    notes: ''
  })

  useEffect(() => {
    if (open && list) {
      fetchItems()
    }
  }, [open, list])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/shopping-lists/${list.id}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.shoppingList.items || [])
      }
    } catch (error) {
      console.error('Error fetching items:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les articles",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name.trim()) return

    try {
      const response = await fetch(`/api/shopping-lists/${list.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name,
          quantity: newItem.quantity || undefined,
          unit: newItem.unit || undefined,
          category: newItem.category,
          notes: newItem.notes || undefined,
          is_purchased: false,
          order_index: items.length
        })
      })

      if (response.ok) {
        const data = await response.json()
        setItems([...items, data.item])
        setNewItem({ name: '', quantity: '', unit: '', category: 'other', notes: '' })
        onItemUpdate()
        toast({
          title: "Succès",
          description: "Article ajouté avec succès"
        })
      }
    } catch (error) {
      console.error('Error adding item:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'article",
        variant: "destructive"
      })
    }
  }

  const handleToggleItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/shopping-lists/${list.id}/items/${itemId}`, {
        method: 'PATCH'
      })

      if (response.ok) {
        const data = await response.json()
        setItems(items.map(item => 
          item.id === itemId ? data.item : item
        ))
        onItemUpdate()
      }
    } catch (error) {
      console.error('Error toggling item:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'article",
        variant: "destructive"
      })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/shopping-lists/${list.id}/items/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setItems(items.filter(item => item.id !== itemId))
        onItemUpdate()
        toast({
          title: "Succès",
          description: "Article supprimé avec succès"
        })
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article",
        variant: "destructive"
      })
    }
  }

  const getCategoryInfo = (categoryId: string) => {
    return DEFAULT_CATEGORIES.find(cat => cat.id === categoryId) || DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1]
  }

  const groupedItems = items.reduce((acc, item) => {
    const category = item.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, ShoppingListItem[]>)

  const completedItems = items.filter(item => item.is_purchased).length
  const totalItems = items.length
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {list.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Articles ({completedItems}/{totalItems})</span>
                  <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                    {completionPercentage}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {Object.entries(groupedItems).map(([categoryId, categoryItems]) => {
                      const categoryInfo = getCategoryInfo(categoryId)
                      return (
                        <div key={categoryId}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{categoryInfo.icon}</span>
                            <h3 className="font-medium text-slate-900">{categoryInfo.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {categoryItems.length}
                            </Badge>
                          </div>
                          <div className="space-y-2 ml-6">
                            {categoryItems.map((item) => (
                              <div
                                key={item.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                  item.is_purchased 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleItem(item.id)}
                                  className={`p-1 h-6 w-6 rounded-full ${
                                    item.is_purchased 
                                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                                      : 'border-2 border-slate-300 hover:border-green-500'
                                  }`}
                                >
                                  {item.is_purchased && <Check className="h-3 w-3" />}
                                </Button>
                                <div className="flex-1">
                                  <div className={`font-medium ${
                                    item.is_purchased ? 'line-through text-slate-500' : 'text-slate-900'
                                  }`}>
                                    {item.name}
                                  </div>
                                  {(item.quantity || item.unit) && (
                                    <div className="text-sm text-slate-600">
                                      {item.quantity} {item.unit}
                                    </div>
                                  )}
                                  {item.notes && (
                                    <div className="text-xs text-slate-500 mt-1">
                                      {item.notes}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          {categoryId !== Object.keys(groupedItems)[Object.keys(groupedItems).length - 1] && (
                            <Separator className="my-4" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Add Item Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ajouter un article</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div>
                    <Label htmlFor="itemName">Nom de l'article *</Label>
                    <Input
                      id="itemName"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="Ex: Pommes"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="quantity">Quantité</Label>
                      <Input
                        id="quantity"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                        placeholder="2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unité</Label>
                      <Input
                        id="unit"
                        value={newItem.unit}
                        onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                        placeholder="kg"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({...newItem, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_CATEGORIES.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Textarea
                      id="notes"
                      value={newItem.notes}
                      onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                      placeholder="Notes sur l'article..."
                      rows={2}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter l'article
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* List Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span>Créée le {new Date(list.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {list.description && (
                  <div className="text-sm text-slate-600">
                    {list.description}
                  </div>
                )}
                {(list.meal_plan_id || list.template_id) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package2 className="h-4 w-4 text-slate-500" />
                    <span>
                      {list.meal_plan_id ? 'Générée depuis un plan repas' : 'Générée depuis un template'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}