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
  BookOpen,
  Clock,
  Users,
  Target,
  ChefHat,
  Sparkles,
  Search,
  Filter,
  Calendar
} from "lucide-react"
import { supabase, type MealPlanTemplate } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuthNew"

interface ClientOption {
  id: string
  name: string
}

interface TemplateSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preselectedClientId?: string
}

interface Customizations {
  name: string
  description: string
  target_calories: string
  duration_days: number
  notes: string
}

export default function TemplateSelectionDialog({
  isOpen,
  onClose,
  onSuccess,
  preselectedClientId
}: TemplateSelectionDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<MealPlanTemplate[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MealPlanTemplate | null>(null)
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || "")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [step, setStep] = useState<"select" | "customize">("select")
  
  const [customizations, setCustomizations] = useState<Customizations>({
    name: "",
    description: "",
    target_calories: "",
    duration_days: 7,
    notes: ""
  })

  useEffect(() => {
    if (isOpen && user) {
      fetchTemplatesAndClients()
    }
  }, [isOpen, user])

  useEffect(() => {
    if (selectedTemplate) {
      setCustomizations(prev => ({
        ...prev,
        name: selectedTemplate.name + " - Personnalisé",
        target_calories: selectedTemplate.target_calories || "",
        duration_days: selectedTemplate.duration_days || 7
      }))
    }
  }, [selectedTemplate])

  const fetchTemplatesAndClients = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('meal_plan_templates')
        .select('*')
        .eq('dietitian_id', user.id)
        .order('usage_count', { ascending: false })

      if (templatesError) throw templatesError
      setTemplates(templatesData || [])

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('dietitian_id', user.id)
        .eq('status', 'active')
        .order('name')

      if (clientsError) throw clientsError
      setClients(clientsData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: MealPlanTemplate) => {
    setSelectedTemplate(template)
    setStep("customize")
  }

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !selectedClientId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un modèle et un client",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/meal-plans/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          clientId: selectedClientId,
          customizations: {
            ...customizations,
            duration_days: Number(customizations.duration_days)
          }
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: "Succès",
        description: data.message || "Plan alimentaire créé avec succès"
      })

      onSuccess()
      onClose()
      resetForm()

    } catch (error) {
      console.error('Error creating meal plan:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le plan",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedTemplate(null)
    setSelectedClientId(preselectedClientId || "")
    setStep("select")
    setSearchTerm("")
    setCategoryFilter("all")
    setCustomizations({
      name: "",
      description: "",
      target_calories: "",
      duration_days: 7,
      notes: ""
    })
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(templates.map(t => t.category)))

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Facile'
      case 'medium': return 'Moyen'
      case 'hard': return 'Difficile'
      default: return difficulty
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {step === "select" ? "Sélectionner un modèle" : "Personnaliser le plan"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" 
              ? "Choisissez un modèle de plan alimentaire existant"
              : "Personnalisez le plan avant de le créer"
            }
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher un modèle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Selection */}
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Templates Grid */}
            <div className="grid gap-4 md:grid-cols-2 max-h-96 overflow-y-auto">
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base font-semibold mb-1">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="text-sm line-clamp-2">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Badge className={getDifficultyColor(template.difficulty)}>
                        {getDifficultyLabel(template.difficulty)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{template.duration_days} jours</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{template.usage_count} utilisations</span>
                      </div>
                    </div>
                    {template.target_calories && (
                      <div className="flex items-center gap-1 text-sm bg-orange-50 px-2 py-1 rounded">
                        <Target className="h-3 w-3 text-orange-600" />
                        <span className="text-orange-800">{template.target_calories} kcal</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === "customize" && selectedTemplate && (
          <div className="space-y-4">
            {/* Template Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Modèle sélectionné: {selectedTemplate.name}
                </CardTitle>
                <CardDescription>
                  {selectedTemplate.description}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Customization Form */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Nom du plan</Label>
                  <Input
                    id="plan-name"
                    value={customizations.name}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom personnalisé"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-calories">Calories cibles</Label>
                  <Input
                    id="target-calories"
                    value={customizations.target_calories}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, target_calories: e.target.value }))}
                    placeholder="1800-2000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Durée (jours)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={customizations.duration_days}
                  onChange={(e) => setCustomizations(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 7 }))}
                  min="1"
                  max="30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={customizations.description}
                  onChange={(e) => setCustomizations(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description personnalisée du plan..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes supplémentaires</Label>
                <Textarea
                  id="notes"
                  value={customizations.notes}
                  onChange={(e) => setCustomizations(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes ou instructions spéciales..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={step === "select" ? onClose : () => setStep("select")}>
            {step === "select" ? "Annuler" : "Retour"}
          </Button>
          {step === "select" ? (
            <Button disabled={!selectedClientId || filteredTemplates.length === 0}>
              Sélectionner un modèle
            </Button>
          ) : (
            <Button 
              onClick={handleCreateFromTemplate} 
              disabled={loading || !selectedClientId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Création..." : "Créer le plan"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}