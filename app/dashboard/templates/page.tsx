"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  MoreHorizontal, 
  Copy, 
  Edit, 
  Trash2, 
  Star, 
  Calendar, 
  Utensils, 
  ChefHat,
  Clock,
  Users,
  BarChart3,
  Share2,
  ShoppingBag,
  BookOpen,
  Zap,
  Play
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSkeleton, EmptyStateWithSkeleton } from "@/components/shared/skeletons"
import { useAuth } from "@/hooks/useAuthNew"
import { supabase, type RecipeTemplate, type MealPlanTemplate } from "@/lib/supabase"
import RecipeTemplateDialog from "@/components/templates/RecipeTemplateDialog"
import MealPlanTemplateDialog from "@/components/templates/MealPlanTemplateDialog"
import TemplateEffectivenessWidget from "@/components/templates/TemplateEffectivenessWidget"
import ShareTemplateDialog from "@/components/templates/ShareTemplateDialog"
import MealPrepInstructionsDialog from "@/components/meal-prep/MealPrepInstructionsDialog"
import { useRouter } from "next/navigation"

type TemplateType = 'recipe' | 'meal_plan'

export default function TemplatesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TemplateType>('recipe')
  const [recipeTemplates, setRecipeTemplates] = useState<RecipeTemplate[]>([])
  const [mealPlanTemplates, setMealPlanTemplates] = useState<MealPlanTemplate[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<RecipeTemplate | MealPlanTemplate | null>(null)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [sharingTemplate, setSharingTemplate] = useState<RecipeTemplate | MealPlanTemplate | null>(null)
  const [isMealPrepDialogOpen, setIsMealPrepDialogOpen] = useState(false)
  const [mealPrepTemplate, setMealPrepTemplate] = useState<RecipeTemplate | MealPlanTemplate | null>(null)
  const [isGeneratingFromTemplate, setIsGeneratingFromTemplate] = useState(false)

  useEffect(() => {
    if (user) {
      fetchTemplates()
    }
  }, [user])

  const fetchTemplates = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Fetch recipe templates
      const { data: recipes, error: recipeError } = await supabase
        .from('recipe_templates')
        .select('*')
        .eq('dietitian_id', user.id)
        .order('created_at', { ascending: false })
      
      if (recipeError) throw recipeError
      
      // Fetch meal plan templates
      const { data: mealPlans, error: mealPlanError } = await supabase
        .from('meal_plan_templates')
        .select('*')
        .eq('dietitian_id', user.id)
        .order('created_at', { ascending: false })
      
      if (mealPlanError) throw mealPlanError
      
      setRecipeTemplates(recipes || [])
      setMealPlanTemplates(mealPlans || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les modèles",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateFromTemplate = async (template: MealPlanTemplate) => {
    if (!user) return
    
    setIsGeneratingFromTemplate(true)
    try {
      // Create a smart prompt from the template
      const prompt = `Créez un plan alimentaire basé sur ce modèle professionnel:
      
Nom: ${template.name}
Description: ${template.description || ''}
Durée: ${template.duration_days} jours
Catégorie: ${template.category}
Type de client: ${template.client_type}
Objectif: ${template.goal_type}
Calories cibles: ${template.target_calories || 'Non spécifiées'}
Difficulté: ${template.difficulty}

Utilisez cette structure comme guide et adaptez-la avec des recettes appropriées pour créer un plan complet et personnalisé.`

      // Navigate to generation page with the template data
      const searchParams = new URLSearchParams({
        prompt: prompt,
        planName: `Plan basé sur: ${template.name}`,
        templateId: template.id
      })
      
      router.push(`/dashboard/meal-plans/generate?${searchParams.toString()}`)
      
    } catch (error) {
      console.error('Error generating from template:', error)
      toast({
        title: "Erreur",
        description: "Impossible de générer à partir du modèle",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingFromTemplate(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string, type: TemplateType) => {
    if (!user) return
    
    try {
      const table = type === 'recipe' ? 'recipe_templates' : 'meal_plan_templates'
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', templateId)
        .eq('dietitian_id', user.id)
      
      if (error) throw error
      
      // Update local state
      if (type === 'recipe') {
        setRecipeTemplates(prev => prev.filter(t => t.id !== templateId))
      } else {
        setMealPlanTemplates(prev => prev.filter(t => t.id !== templateId))
      }
      
      toast({
        title: "Succès",
        description: "Modèle supprimé avec succès"
      })
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le modèle",
        variant: "destructive"
      })
    }
  }

  const currentTemplates = activeTab === 'recipe' ? recipeTemplates : mealPlanTemplates
  const filteredTemplates = currentTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Bibliothèque de modèles"
        subtitle={`${currentTemplates.length} modèles disponibles pour votre pratique`}
        searchPlaceholder="Rechercher des modèles..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/templates/marketplace')}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Marketplace
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/templates/analytics')}
              className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau modèle
            </Button>
          </div>
        }
      />

      <div className="px-6 space-y-6">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TemplateType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recipe" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Recettes ({recipeTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="meal_plan" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Plans alimentaires ({mealPlanTemplates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipe" className="space-y-4 mt-6">
            {filteredTemplates.length === 0 ? (
              <EmptyStateWithSkeleton 
                icon={ChefHat}
                title={searchTerm ? "Aucune recette trouvée" : "Aucune recette"}
                description={searchTerm 
                  ? "Essayez d'ajuster vos termes de recherche." 
                  : "Créez votre première recette pour commencer."
                }
                action={!searchTerm ? (
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer votre première recette
                  </Button>
                ) : undefined}
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    type="recipe"
                    onEdit={(template: RecipeTemplate | MealPlanTemplate) => {
                      setEditingTemplate(template)
                      setIsEditDialogOpen(true)
                    }}
                    onDelete={(id: string) => handleDeleteTemplate(id, 'recipe')}
                    onShare={(template: RecipeTemplate | MealPlanTemplate) => {
                      setSharingTemplate(template)
                      setIsShareDialogOpen(true)
                    }}
                    onMealPrep={(template: RecipeTemplate | MealPlanTemplate) => {
                      setMealPrepTemplate(template)
                      setIsMealPrepDialogOpen(true)
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="meal_plan" className="space-y-4 mt-6">
            {filteredTemplates.length === 0 ? (
              <EmptyStateWithSkeleton 
                icon={Calendar}
                title={searchTerm ? "Aucun plan alimentaire trouvé" : "Aucun plan alimentaire"}
                description={searchTerm 
                  ? "Essayez d'ajuster vos termes de recherche." 
                  : "Créez votre premier plan alimentaire pour commencer."
                }
                action={!searchTerm ? (
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer votre premier plan alimentaire
                  </Button>
                ) : undefined}
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    type="meal_plan"
                    onEdit={(template: RecipeTemplate | MealPlanTemplate) => {
                      setEditingTemplate(template)
                      setIsEditDialogOpen(true)
                    }}
                    onDelete={(id: string) => handleDeleteTemplate(id, 'meal_plan')}
                    onShare={(template: RecipeTemplate | MealPlanTemplate) => {
                      setSharingTemplate(template)
                      setIsShareDialogOpen(true)
                    }}
                    onMealPrep={(template: RecipeTemplate | MealPlanTemplate) => {
                      setMealPrepTemplate(template)
                      setIsMealPrepDialogOpen(true)
                    }}
                    onGenerate={(template: MealPlanTemplate) => handleGenerateFromTemplate(template)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Dialog */}
      {activeTab === 'recipe' ? (
        <RecipeTemplateDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSave={() => {
            setIsAddDialogOpen(false)
            fetchTemplates()
          }}
        />
      ) : (
        <MealPlanTemplateDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSave={() => {
            setIsAddDialogOpen(false)
            fetchTemplates()
          }}
        />
      )}

      {/* Edit Dialog */}
      {editingTemplate && (
        activeTab === 'recipe' ? (
          <RecipeTemplateDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false)
              setEditingTemplate(null)
            }}
            template={editingTemplate as RecipeTemplate}
            onSave={() => {
              setIsEditDialogOpen(false)
              setEditingTemplate(null)
              fetchTemplates()
            }}
          />
        ) : (
          <MealPlanTemplateDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false)
              setEditingTemplate(null)
            }}
            template={editingTemplate as MealPlanTemplate}
            onSave={() => {
              setIsEditDialogOpen(false)
              setEditingTemplate(null)
              fetchTemplates()
            }}
          />
        )
      )}

      {/* Share Dialog */}
      {sharingTemplate && (
        <ShareTemplateDialog
          isOpen={isShareDialogOpen}
          onClose={() => {
            setIsShareDialogOpen(false)
            setSharingTemplate(null)
          }}
          template={sharingTemplate}
          templateType={activeTab}
          onShared={() => {
            setIsShareDialogOpen(false)
            setSharingTemplate(null)
            fetchTemplates()
          }}
        />
      )}

      {/* Meal Prep Instructions Dialog */}
      {mealPrepTemplate && (
        <MealPrepInstructionsDialog
          isOpen={isMealPrepDialogOpen}
          onClose={() => {
            setIsMealPrepDialogOpen(false)
            setMealPrepTemplate(null)
          }}
          recipeId={activeTab === 'recipe' ? mealPrepTemplate.id : undefined}
          mealPlanId={activeTab === 'meal_plan' ? mealPrepTemplate.id : undefined}
          onSaved={() => {
            setIsMealPrepDialogOpen(false)
            setMealPrepTemplate(null)
            fetchTemplates()
          }}
        />
      )}
    </div>
  )
}

// Template Card Component
function TemplateCard({ 
  template, 
  type, 
  onEdit, 
  onDelete,
  onShare,
  onMealPrep,
  onGenerate 
}: { 
  template: RecipeTemplate | MealPlanTemplate
  type: TemplateType
  onEdit: (template: RecipeTemplate | MealPlanTemplate) => void
  onDelete: (id: string) => void
  onShare: (template: RecipeTemplate | MealPlanTemplate) => void
  onMealPrep: (template: RecipeTemplate | MealPlanTemplate) => void
  onGenerate?: (template: MealPlanTemplate) => void
}) {
  const getCategoryColor = (category: string) => {
    const colors = {
      'breakfast': 'bg-orange-100 text-orange-800',
      'lunch': 'bg-blue-100 text-blue-800',
      'dinner': 'bg-purple-100 text-purple-800',
      'snack': 'bg-green-100 text-green-800',
      'dessert': 'bg-pink-100 text-pink-800',
      'vegetarian': 'bg-emerald-100 text-emerald-800',
      'vegan': 'bg-teal-100 text-teal-800',
      'gluten-free': 'bg-yellow-100 text-yellow-800',
      'low-carb': 'bg-red-100 text-red-800',
      'high-protein': 'bg-indigo-100 text-indigo-800',
      'weekly': 'bg-blue-100 text-blue-800',
      'monthly': 'bg-purple-100 text-purple-800',
      'weight-loss': 'bg-red-100 text-red-800',
      'muscle-gain': 'bg-green-100 text-green-800',
      'maintenance': 'bg-gray-100 text-gray-800',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty) return 'bg-gray-100 text-gray-800'
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800',
    }
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm hover:shadow-soft-md transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
              {template.name}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              {type === 'meal_plan' && onGenerate && (
                <DropdownMenuItem onClick={() => onGenerate(template as MealPlanTemplate)}>
                  <Zap className="mr-2 h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Générer un plan</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(template)}>
                <Share2 className="mr-2 h-4 w-4" />
                Partager
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMealPrep(template)}>
                <BookOpen className="mr-2 h-4 w-4" />
                Instructions de préparation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(template.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge className={`${getCategoryColor(template.category)} border-0 font-medium px-3 py-1`}>
            {template.category}
          </Badge>
          {'difficulty' in template && template.difficulty && (
            <Badge className={`${getDifficultyColor(template.difficulty)} border-0 font-medium px-3 py-1`}>
              {template.difficulty}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-3 w-3" />
            <span>{'servings' in template ? `${template.servings} portions` : 'Plan complet'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-3 w-3" />
            <span>
              {'prep_time' in template && template.prep_time ? `${template.prep_time}min` : 'Flexible'}
            </span>
          </div>
        </div>

        {'tags' in template && template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Template Effectiveness Widget for Meal Plan Templates */}
        {type === 'meal_plan' && (
          <div className="mt-4">
            <TemplateEffectivenessWidget 
              templateId={template.id}
              templateName={template.name}
              compact={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
