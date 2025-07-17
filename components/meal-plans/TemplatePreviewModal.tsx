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

    // Try to extract sample meals from the structure
    const mealStructure = template.meal_structure as any
    const sampleDays = ['day_1', 'day_2', 'jour_1', 'jour_2', 'lundi', 'mardi']
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'petit_dejeuner', 'dejeuner', 'diner']
    
    let previewContent = []
    
    // Try to find sample meals
    for (const day of sampleDays) {
      if (mealStructure[day]) {
        const dayMeals = []
        for (const meal of mealTypes) {
          if (mealStructure[day][meal]) {
            const mealData = mealStructure[day][meal]
            dayMeals.push({
              type: meal,
              name: mealData.name || mealData.recipe || 'Repas personnalisé',
              calories: mealData.calories || mealData.kcal,
              time: mealData.prep_time || mealData.preparation_time
            })
          }
        }
        if (dayMeals.length > 0) {
          previewContent.push({ day, meals: dayMeals })
        }
        if (previewContent.length >= 2) break // Show max 2 days
      }
    }

    if (previewContent.length === 0) {
      return (
        <div className="text-center py-6">
          <ChefHat className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
          <p className="text-sm font-medium text-gray-900">Plan de repas structuré</p>
          <p className="text-xs text-gray-600">
            {template.duration_days} jours de repas équilibrés inclus
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {previewContent.map((dayData, dayIndex) => (
          <Card key={dayIndex} className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Jour {dayIndex + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dayData.meals.map((meal, mealIndex) => (
                <div key={mealIndex} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {meal.type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-600 truncate max-w-40">
                      {meal.name}
                    </p>
                  </div>
                  <div className="text-right">
                    {meal.calories && (
                      <p className="text-xs font-medium text-orange-600">
                        {meal.calories} kcal
                      </p>
                    )}
                    {meal.time && (
                      <p className="text-xs text-gray-500">
                        {meal.time}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            ... et {template.duration_days - 2} jours supplémentaires
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
            <Badge className={getDifficultyColor(template.difficulty)}>
              {getDifficultyLabel(template.difficulty)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{template.duration_days} jours</span>
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