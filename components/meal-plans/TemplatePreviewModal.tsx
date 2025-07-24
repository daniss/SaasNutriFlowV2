"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Calendar,
  Clock,
  Target,
  ChefHat,
  BookOpen,
  Users,
  Sparkles
} from "lucide-react"
import type { MealPlanTemplate } from "@/lib/supabase"

interface TemplatePreviewModalProps {
  template: MealPlanTemplate | null
  isOpen: boolean
  onClose: () => void
  onUseTemplate: (template: MealPlanTemplate) => void
}

export default function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onUseTemplate
}: TemplatePreviewModalProps) {
  if (!template) return null

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

  // Sample meal structure preview (first 2-3 days)
  const renderMealPreview = () => {
    if (!template.meal_structure) {
      return (
        <div className="text-center py-6 text-gray-500">
          <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Structure de repas non disponible pour l'aperçu</p>
        </div>
      )
    }

    // Parse the template structure - should be array format
    const mealStructure = template.meal_structure as any
    let templateDays = []
    
    // Handle both array and object formats for backward compatibility
    if (Array.isArray(mealStructure)) {
      templateDays = mealStructure
    } else if (typeof mealStructure === 'object') {
      // Try to convert old object format to array format
      const dayKeys = Object.keys(mealStructure).filter(key => key.startsWith('day_') || key.startsWith('jour_'))
      templateDays = dayKeys.map(key => ({
        day: parseInt(key.replace(/\D/g, '')) || 1,
        meals: mealStructure[key]?.meals || []
      }))
    }

    if (templateDays.length === 0) {
      return (
        <div className="text-center py-6">
          <ChefHat className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
          <p className="text-sm font-medium text-gray-900">Plan de repas structuré</p>
          <p className="text-xs text-gray-600">
            {Array.isArray(template.meal_structure) ? template.meal_structure.length : 1} jours de repas équilibrés inclus
          </p>
        </div>
      )
    }

    // Show first 2 days maximum
    const previewDays = templateDays.slice(0, 2)

    return (
      <div className="space-y-4">
        {previewDays.map((dayData, dayIndex) => (
          <Card key={dayIndex} className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Jour {dayData.day}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dayData.meals && dayData.meals.length > 0 ? (
                dayData.meals.map((meal: any, mealIndex: number) => (
                  <div key={mealIndex} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {meal.name || 'Repas'}
                      </p>
                      <p className="text-xs text-gray-600 truncate max-w-40">
                        {meal.description || 'Description non disponible'}
                      </p>
                    </div>
                    <div className="text-right">
                      {meal.calories_target && (
                        <p className="text-xs font-medium text-orange-600">
                          {meal.calories_target} kcal
                        </p>
                      )}
                      {meal.time && (
                        <p className="text-xs text-gray-500">
                          {meal.time}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-xs">Aucun repas configuré pour ce jour</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            ... et {Math.max(0, (Array.isArray(template.meal_structure) ? template.meal_structure.length : 1) - 2)} jours supplémentaires
          </p>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                {template.name}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {template.description}
              </DialogDescription>
            </div>
            <Badge className={getDifficultyColor(template.difficulty || 'medium')}>
              {getDifficultyLabel(template.difficulty || 'medium')}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{Array.isArray(template.meal_structure) ? template.meal_structure.length : 1} jours</span>
            </div>
            {template.target_calories && (
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-orange-500" />
                <span>{template.target_calories} kcal</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-emerald-500" />
              <span>{template.usage_count} utilisations</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>{template.category}</span>
            </div>
          </div>

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Meal Structure Preview */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Aperçu des repas
            </h3>
            {renderMealPreview()}
          </div>

          {/* Time Savings Highlight */}
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-900">
                    Prêt en 2 minutes
                  </p>
                  <p className="text-xs text-emerald-700">
                    vs 30-40 minutes pour une création manuelle
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button 
            onClick={() => onUseTemplate(template)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Utiliser ce modèle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}