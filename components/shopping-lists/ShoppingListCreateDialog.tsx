"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Plus, 
  ShoppingCart, 
  FileText, 
  Package,
  User
} from "lucide-react"

interface ShoppingListCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  clients: any[]
}

export function ShoppingListCreateDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  clients 
}: ShoppingListCreateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [createType, setCreateType] = useState<'manual' | 'template' | 'meal_plan'>('manual')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    templateId: '',
    mealPlanId: '',
    servings: 1,
    excludeIngredients: [] as string[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData: any = {
        name: formData.name,
        description: formData.description,
        client_id: formData.client_id || undefined,
        status: 'active',
        is_template: false
      }

      if (createType === 'template') {
        submitData.type = 'from_template'
        submitData.templateId = formData.templateId
        submitData.options = {
          clientId: formData.client_id || undefined,
          name: formData.name,
          servings: formData.servings,
          excludeIngredients: formData.excludeIngredients
        }
      } else if (createType === 'meal_plan') {
        submitData.type = 'from_meal_plan'
        submitData.mealPlanId = formData.mealPlanId
        submitData.options = {
          clientId: formData.client_id || undefined,
          name: formData.name,
          excludeIngredients: formData.excludeIngredients
        }
      }

      await onSubmit(submitData)
      handleReset()
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      client_id: '',
      templateId: '',
      mealPlanId: '',
      servings: 1,
      excludeIngredients: []
    })
    setCreateType('manual')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Créer une liste de courses
          </DialogTitle>
        </DialogHeader>

        <Tabs value={createType} onValueChange={(value) => setCreateType(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">
              <Plus className="h-4 w-4 mr-2" />
              Manuel
            </TabsTrigger>
            <TabsTrigger value="template">
              <FileText className="h-4 w-4 mr-2" />
              Depuis template
            </TabsTrigger>
            <TabsTrigger value="meal_plan">
              <Package className="h-4 w-4 mr-2" />
              Depuis plan repas
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom de la liste *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Courses semaine 1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client">Client (optionnel)</Label>
                  <Select 
                    value={formData.client_id} 
                    onValueChange={(value) => setFormData({...formData, client_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Description de la liste..."
                  rows={3}
                />
              </div>
            </div>

            {/* Type-specific options */}
            <TabsContent value="manual" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Liste manuelle</CardTitle>
                  <CardDescription>
                    Créez une liste vide que vous pourrez remplir manuellement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    Une fois créée, vous pourrez ajouter des articles un par un en organisant par catégories.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Depuis un template</CardTitle>
                  <CardDescription>
                    Générez automatiquement une liste depuis un template de plan repas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template">Template *</Label>
                      <Select 
                        value={formData.templateId} 
                        onValueChange={(value) => setFormData({...formData, templateId: value})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un template" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Templates will be loaded here */}
                          <SelectItem value="template1">Template perte de poids</SelectItem>
                          <SelectItem value="template2">Template végétarien</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="servings">Nombre de portions</Label>
                      <Input
                        id="servings"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.servings}
                        onChange={(e) => setFormData({...formData, servings: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="exclude">Ingrédients à exclure (optionnel)</Label>
                    <Input
                      id="exclude"
                      placeholder="Ex: lait, œufs, gluten (séparés par des virgules)"
                      onChange={(e) => setFormData({
                        ...formData, 
                        excludeIngredients: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meal_plan" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Depuis un plan repas</CardTitle>
                  <CardDescription>
                    Générez automatiquement une liste depuis un plan repas existant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="meal_plan">Plan repas *</Label>
                    <Select 
                      value={formData.mealPlanId} 
                      onValueChange={(value) => setFormData({...formData, mealPlanId: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un plan repas" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Meal plans will be loaded here */}
                        <SelectItem value="plan1">Plan Marie - Janvier</SelectItem>
                        <SelectItem value="plan2">Plan Jean - Février</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="exclude_mp">Ingrédients à exclure (optionnel)</Label>
                    <Input
                      id="exclude_mp"
                      placeholder="Ex: lait, œufs, gluten (séparés par des virgules)"
                      onChange={(e) => setFormData({
                        ...formData, 
                        excludeIngredients: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Submit buttons */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer la liste"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}