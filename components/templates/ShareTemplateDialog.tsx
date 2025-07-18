"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Share2, Coins, Globe, Users, Lock, X } from "lucide-react"
import { RecipeTemplate, MealPlanTemplate } from "@/lib/supabase"

interface ShareTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  template: RecipeTemplate | MealPlanTemplate
  templateType: 'recipe' | 'meal_plan'
  onShared: () => void
}

export default function ShareTemplateDialog({
  isOpen,
  onClose,
  template,
  templateType,
  onShared
}: ShareTemplateDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: template.name || '',
    description: template.description || '',
    category: template.category || '',
    tags: template.tags || [],
    difficulty: (template as any).difficulty || 'medium',
    prep_time: (template as any).prep_time || 0,
    servings: (template as any).servings || 1,
    sharing_level: 'public' as 'public' | 'professional' | 'private',
    price_credits: 0
  })
  const [newTag, setNewTag] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/templates/shared', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template.id,
          template_type: templateType,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          tags: formData.tags,
          difficulty: formData.difficulty,
          prep_time: formData.prep_time,
          servings: formData.servings,
          sharing_level: formData.sharing_level,
          price_credits: formData.price_credits,
          metadata: {
            original_name: template.name,
            shared_at: new Date().toISOString()
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du partage')
      }

      toast({
        title: "Modèle partagé",
        description: "Votre modèle a été partagé avec succès sur la marketplace",
      })

      onShared()
      onClose()
    } catch (error) {
      console.error('Error sharing template:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de partager le modèle",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const getSharingLevelIcon = (level: string) => {
    switch (level) {
      case 'public': return <Globe className="h-4 w-4" />
      case 'professional': return <Users className="h-4 w-4" />
      case 'private': return <Lock className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Partager le modèle
          </DialogTitle>
          <DialogDescription>
            Partagez votre modèle "{template.name}" avec la communauté de nutritionnistes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du modèle *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nom du modèle dans la marketplace"
                required
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre modèle pour aider les autres nutritionnistes"
                rows={3}
                className="text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Petit-déjeuner</SelectItem>
                    <SelectItem value="lunch">Déjeuner</SelectItem>
                    <SelectItem value="dinner">Dîner</SelectItem>
                    <SelectItem value="snack">Collation</SelectItem>
                    <SelectItem value="vegetarian">Végétarien</SelectItem>
                    <SelectItem value="vegan">Végétalien</SelectItem>
                    <SelectItem value="gluten-free">Sans gluten</SelectItem>
                    <SelectItem value="low-carb">Faible en glucides</SelectItem>
                    <SelectItem value="weight-loss">Perte de poids</SelectItem>
                    <SelectItem value="muscle-gain">Prise de muscle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulté</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Niveau de difficulté" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Facile</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="hard">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {templateType === 'recipe' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prep_time">Temps de préparation (min)</Label>
                  <Input
                    id="prep_time"
                    type="number"
                    value={formData.prep_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, prep_time: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="servings">Portions</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                    min="1"
                    className="text-base"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ajouter un tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="text-base"
              />
              <Button type="button" variant="outline" onClick={addTag} className="w-full sm:w-auto">
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="pr-1">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Sharing Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Niveau de partage</Label>
              <Select value={formData.sharing_level} onValueChange={(value: any) => setFormData(prev => ({ ...prev, sharing_level: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Public - Visible par tous
                    </div>
                  </SelectItem>
                  <SelectItem value="professional">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Professionnel - Nutritionnistes uniquement
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Privé - Lien direct uniquement
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_credits">Prix en crédits</Label>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                <Input
                  id="price_credits"
                  type="number"
                  value={formData.price_credits}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_credits: parseInt(e.target.value) || 0 }))}
                  min="0"
                  placeholder="0 pour gratuit"
                  className="text-base"
                />
              </div>
              <p className="text-sm text-gray-600">
                Prix suggéré : {templateType === 'recipe' ? '5-15' : '20-50'} crédits
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none">
              {loading ? "Partage en cours..." : "Partager le modèle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}