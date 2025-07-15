"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
    Activity,
    AlertTriangle,
    Award,
    BarChart3,
    BookOpen,
    Calendar,
    Check,
    ChefHat,
    Clock,
    Download,
    Edit,
    Flame,
    Globe,
    Grid,
    Leaf,
    List,
    Loader2,
    PieChart,
    RefreshCw,
    Save,
    Send,
    Settings,
    Shield,
    ShoppingCart,
    Sparkles,
    Target,
    ThumbsDown,
    ThumbsUp,
    Timer,
    TrendingUp,
    Users,
    Utensils,
    X,
    Zap
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
// Dynamic import with client-side only loading to prevent server-side issues

// Now restored and working with proper dynamic imports!
import { useAuth } from "@/hooks/useAuthNew"
import { generateMealPlan, type GeneratedMealPlan, type Meal } from "@/lib/gemini"
import { supabase, type Client } from "@/lib/supabase"
import { generateProfessionalPDF } from "@/lib/pdf-generator"
import { useToast } from "@/hooks/use-toast"
import MacronutrientBreakdown from "@/components/nutrition/MacronutrientBreakdown"

export default function GenerateMealPlanPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealPlan | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [editingMeal, setEditingMeal] = useState<{ dayIndex: number; mealType: string; meal: Meal } | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [lastSubmission, setLastSubmission] = useState<number>(0)
  const [validationError, setValidationError] = useState<string>("")
  const [planFeedback, setPlanFeedback] = useState<{ planId: string; rating: 'good' | 'bad' | null }>({ planId: '', rating: null })
  const [viewMode, setViewMode] = useState<'cards' | 'timeline' | 'compact' | 'nutrition'>('cards')
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    prompt: "",
    planName: "",
    clientId: "",
  })

  // Quick preset prompts for inspiration
  const presetPrompts = [
    "Plan méditerranéen de 7 jours pour la santé cardiaque avec 1800 calories par jour",
    "Plan de perte de poids avec jeûne intermittent (16:8) et riche en protéines",
    "Plan nutritionnel végétalien pour sportif et développement musculaire (2500 calories)",
    "Plan anti-inflammatoire pour la santé articulaire avec aliments riches en oméga-3",
    "Plan adapté aux diabétiques avec aliments à faible index glycémique (1600 calories)",
    "Plan familial de préparation de repas avec options de cuisson par lots",
    "Plan sans gluten pour personne cœliaque avec alternatives nutritives et fibres",
    "Plan végétarien équilibré riche en fer et vitamine B12 pour femme enceinte",
    "Plan hypoallergénique sans lactose, œufs et noix pour enfant de 8 ans actif",
  ]

  // Anti-abuse validation
  const validatePrompt = (prompt: string): string | null => {
    if (!prompt.trim()) return "Veuillez entrer une description de plan alimentaire"
    if (prompt.length < 10) return "Veuillez fournir plus de détails (au moins 10 caractères)"
    if (prompt.length > 1000) return "Veuillez garder votre demande sous 1000 caractères"
    
    // Check for offensive content (basic keywords)
    const offensiveWords = ['spam', 'hack', 'illegal', 'drug', 'weapon']
    const lowerPrompt = prompt.toLowerCase()
    if (offensiveWords.some(word => lowerPrompt.includes(word))) {
      return "Veuillez vous assurer que votre demande concerne la planification de repas"
    }
    
    // Check if it's meal/nutrition related
    const nutritionKeywords = ['meal', 'diet', 'food', 'nutrition', 'calorie', 'protéines', 'carb', 'fat', 'vegetarian', 'vegan', 'keto', 'weight', 'healthy', 'breakfast', 'lunch', 'dinner', 'snack', 'plan']
    if (!nutritionKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      return "Veuillez décrire un plan alimentaire ou une demande liée à la nutrition"
    }
    
    return null
  }

  // Check cooldown
  const canSubmit = (): boolean => {
    const now = Date.now()
    return now - lastSubmission >= 5000 // 5 seconds cooldown
  }

  const getCooldownTimeLeft = (): number => {
    const now = Date.now()
    const timeLeft = Math.max(0, 5000 - (now - lastSubmission))
    return Math.ceil(timeLeft / 1000)
  }

  const loadClients = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("clients").select("*").eq("dietitian_id", user.id).order("name")

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Error loading clients:", error)
    }
  }

  useEffect(() => {
    if (user) {
      loadClients()
    }
  }, [user])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }


  const handleGenerate = async () => {
    // Validation
    const validation = validatePrompt(formData.prompt)
    if (validation) {
      setValidationError(validation)
      textareaRef.current?.focus()
      return
    }

    // Cooldown check
    if (!canSubmit()) {
      setValidationError(`Veuillez attendre ${getCooldownTimeLeft()} secondes avant de générer à nouveau`)
      return
    }

    setValidationError("")
    setIsGenerating(true)
    setGenerationProgress(0)
    setLastSubmission(Date.now())

    // Progress simulation
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 20
      })
    }, 800)

    try {
      // Real AI generation with Google Gemini!
      const mealPlanRequest = {
        prompt: formData.prompt,
        dietitianId: user?.id || '',
        clientId: formData.clientId || undefined,
      }

      const { transformed: plan, raw: rawPlan } = await generateMealPlan(mealPlanRequest)

      setGenerationProgress(100)
      setTimeout(() => {
        setGeneratedPlan(plan)
        // Store raw plan for saving to database
        ;(plan as any).rawData = rawPlan
        setPlanFeedback({ planId: plan.title + Date.now(), rating: null })
        clearInterval(progressInterval)
      }, 500)
      
    } catch (error) {
      console.error("Error generating meal plan:", error)
      setValidationError("Échec de la génération du plan alimentaire. Veuillez réessayer.")
      clearInterval(progressInterval)
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationProgress(0)
      }, 600)
    }
  }

  const handleFeedback = (rating: 'good' | 'bad') => {
    setPlanFeedback(prev => ({ ...prev, rating }))
    // Here you could send feedback to analytics
  }

  // Helper function to organize meals by type from array
  const getMealsByType = (meals: Meal[]) => {
    const organized = {
      breakfast: meals.find(m => m.type === 'breakfast'),
      lunch: meals.find(m => m.type === 'lunch'),
      dinner: meals.find(m => m.type === 'dinner'),
      snacks: meals.filter(m => m.type === 'snack')
    }
    return organized
  }

  const handleEditMeal = (dayIndex: number, mealType: string, meal: Meal) => {
    setEditingMeal({ dayIndex, mealType, meal: { ...meal } })
  }

  const handleSaveEdit = () => {
    if (!editingMeal || !generatedPlan) return

    const updatedPlan = { ...generatedPlan }
    const dayPlan = updatedPlan.days[editingMeal.dayIndex]

    // Update the meal in the array structure
    if (dayPlan && dayPlan.meals) {
      const mealIndex = dayPlan.meals.findIndex((m) => {
        if (editingMeal.mealType === 'snacks') {
          // For snacks, match by type and index
          const snacks = dayPlan.meals.filter(meal => meal.type === 'snack')
          const snackIndex = snacks.findIndex(s => s.name === editingMeal.meal.name)
          return m.type === 'snack' && snacks[snackIndex] === m
        }
        return m.type === editingMeal.mealType
      })
      
      if (mealIndex !== -1) {
        dayPlan.meals[mealIndex] = { ...editingMeal.meal }
      }
    }

    // Recalculate daily totals from array structure
    dayPlan.totalCalories = dayPlan.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
    dayPlan.totalProtein = dayPlan.meals.reduce((sum, meal) => sum + (meal.protéines || 0), 0)
    dayPlan.totalCarbs = dayPlan.meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0)
    dayPlan.totalFat = dayPlan.meals.reduce((sum, meal) => sum + (meal.fat || 0), 0)

    setGeneratedPlan(updatedPlan)
    setEditingMeal(null)
  }

  const handleSaveAsTemplate = async () => {
    if (!generatedPlan || !user) return

    try {
      // Save to meal_plan_templates table
      const { error } = await supabase.from("meal_plan_templates").insert({
        dietitian_id: user.id,
        name: formData.planName || generatedPlan.title,
        description: generatedPlan.description || '',
        category: 'general',
        duration_days: generatedPlan.duration,
        meal_structure: generatedPlan, // Changed from template_data to meal_structure
        tags: ['ai-generated'],
        difficulty: 'medium', // Required field with default value
        // Removed usage_count and is_favorite as they have defaults
      })

      if (error) throw error
      
      toast({
        title: "Modèle sauvegardé",
        description: "Le plan alimentaire a été sauvegardé comme modèle avec succès!",
      })
    } catch (error) {
      console.error("Error saving template:", error)
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder le modèle. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  const handleSendToClient = async () => {
    if (!generatedPlan || !formData.clientId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un client d'abord",
        variant: "destructive",
      })
      return
    }

    try {
      // Get client information for notification
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("name, email")
        .eq("id", formData.clientId)
        .single()
      
      if (clientError) throw clientError
      
      // Save the meal plan
      const { data: savedPlan, error: saveError } = await supabase
        .from("meal_plans")
        .insert({
          dietitian_id: user!.id,
          client_id: formData.clientId,
          name: formData.planName || generatedPlan.title,
          description: generatedPlan.description,
          duration_days: generatedPlan.duration,
          plan_content: (generatedPlan as any).rawData || generatedPlan,
          status: "Active",
        })
        .select()
        .single()
      
      if (saveError) throw saveError
      
      // Send notification to client
      try {
        const response = await fetch("/api/notifications/meal-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientEmail: client.email,
            mealPlanName: formData.planName || generatedPlan.title,
            dietitianName: user?.email?.split('@')[0] || "Votre nutritionniste",
          }),
        })
        
        if (!response.ok) {
          console.error("Failed to send notification")
        }
      } catch (notifError) {
        console.error("Error sending notification:", notifError)
        // Don't fail the whole operation if notification fails
      }
      
      toast({
        title: "Succès",
        description: "Plan alimentaire envoyé au client avec succès!",
      })
      
      // Optionally redirect to meal plans list
      router.push("/dashboard/meal-plans")
    } catch (error) {
      console.error("Error sending to client:", error)
      toast({
        title: "Erreur",
        description: "Échec de l'envoi au client. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  const handleExportPdf = async () => {
    if (!generatedPlan || !user) return

    try {
      // Get dietitian's name from profile
      const dietitianName = user.email?.split('@')[0] || 'Votre nutritionniste'
      
      // Generate professional PDF
      const pdf = generateProfessionalPDF(generatedPlan, dietitianName)
      
      // Save the PDF
      const fileName = `${generatedPlan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_meal_plan.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
        <div className="relative container mx-auto px-6 pt-12 pb-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                  Générateur de plans alimentaires IA
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  Créez des plans nutritionnels personnalisés en quelques secondes avec l'IA intelligente
                </p>
              </div>
            </div>
            
            {/* Key Features */}
            <div className="flex flex-wrap gap-4 mt-6">
              {[
                { icon: Target, label: "Nutrition de précision", color: "text-blue-600" },
                { icon: Clock, label: "Génération instantanée", color: "text-green-600" },
                { icon: Users, label: "Prêt pour les clients", color: "text-purple-600" },
                { icon: Shield, label: "Basé sur la science", color: "text-orange-600" },
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
                  <feature.icon className={`h-4 w-4 ${feature.color}`} />
                  <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-12">
        <div className="grid xl:grid-cols-5 gap-8">
          {/* Generation Panel */}
          <div className="xl:col-span-2 space-y-6">
            {/* Smart Prompt Area */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Edit className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Décrivez votre vision</CardTitle>
                      <CardDescription className="text-sm">Quel type de plan alimentaire avez-vous besoin ?</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, prompt: "" }))}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Clear prompt"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="ex: Créez un plan méditerranéen de 7 jours pour la perte de poids avec 1600 calories par jour, riche en acides gras oméga-3, adapté à une personne pré-diabétique..."
                    value={formData.prompt}
                    onChange={(e) => {
                      handleInputChange("prompt", e.target.value)
                      setValidationError("")
                    }}
                    rows={4}
                    className="resize-none border-0 bg-gray-50/50 focus:bg-white transition-colors pr-16 focus:ring-2 focus:ring-blue-500/20"
                    aria-describedby={validationError ? "prompt-error" : "prompt-help"}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <span className={`text-xs transition-colors ${formData.prompt.length > 800 ? 'text-red-500' : 'text-gray-400'}`}>
                      {formData.prompt.length}/1000
                    </span>
                  </div>
                </div>

                {validationError && (
                  <Alert className="border-red-200 bg-red-50" id="prompt-error" role="alert">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{validationError}</AlertDescription>
                  </Alert>
                )}

                <div id="prompt-help" className="sr-only">
                  Describe the meal plan you want to generate. Be specific about dietary preferences, restrictions, and goals.
                </div>

                {/* Quick Prompts */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Démarrage rapide</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {presetPrompts.slice(0, 3).map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => handleInputChange("prompt", preset)}
                        className="text-left p-3 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg border border-blue-200/50 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        aria-label={`Use preset: ${preset.substring(0, 50)}...`}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-blue-500 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          <span className="text-gray-700 group-hover:text-gray-900 line-clamp-2">{preset}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Essential Configuration */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Settings className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Configuration essentielle</CardTitle>
                    <CardDescription className="text-sm">Informations d'organisation</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="planName" className="text-sm font-medium">Nom du plan</Label>
                  <Input
                    id="planName"
                    placeholder="ex: Plan de Marie - Janvier 2024"
                    value={formData.planName}
                    onChange={(e) => handleInputChange("planName", e.target.value)}
                    className="mt-1 border-gray-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="client" className="text-sm font-medium">Client (optionnel)</Label>
                  <Select value={formData.clientId} onValueChange={(value: string) => handleInputChange("clientId", value)}>
                    <SelectTrigger className="mt-1 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                              {client.name.charAt(0)}
                            </div>
                            {client.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generation Button */}
                <div className="pt-4 border-t border-gray-100">
                  {isGenerating && (
                    <div className="mb-4 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          Génération de votre plan alimentaire...
                        </span>
                        <span className="font-medium text-blue-600 tabular-nums">{Math.round(generationProgress)}%</span>
                      </div>
                      <Progress value={generationProgress} className="h-2 bg-gray-100 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out relative"
                          style={{ width: `${generationProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </Progress>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !formData.prompt.trim() || !canSubmit()}
                    className={`w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isGenerating ? 'animate-pulse' : 'hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : !canSubmit() ? (
                      <>
                        <Timer className="h-5 w-5 mr-2" />
                        Attendez {getCooldownTimeLeft()}s
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Générer le plan alimentaire
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pro Tips */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-amber-900">Conseils pro</h3>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Soyez précis sur les préférences et restrictions alimentaires</li>
                      <li>• Mentionnez si vous préférez la préparation de repas ou des recettes rapides</li>
                      <li>• Incluez les conditions de santé ou objectifs de fitness</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Results Panel */}
          <div className="xl:col-span-3 space-y-6">
            {/* Loading State */}
            {isGenerating && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                          <Sparkles className="h-8 w-8 text-white animate-bounce" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-ping">
                          <Zap className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Création de votre plan alimentaire parfait</h3>
                      <p className="text-gray-600 mb-6">Notre IA analyse vos exigences et crée des recettes personnalisées...</p>
                      
                      <div className="space-y-3 max-w-md mx-auto">
                        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out relative"
                            style={{ width: `${generationProgress}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span>Traitement des données nutritionnelles</span>
                          </div>
                          <span className="font-medium tabular-nums">{Math.round(generationProgress)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Loading skeleton */}
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      {[
                        { label: "Analyse des préférences alimentaires" },
                        { label: "Calcul de l'équilibre nutritionnel" },
                        { label: "Génération des combinaisons de repas" },
                        { label: "Création de la liste de courses" }
                      ].map((item, i) => (
                        <div key={i} className="space-y-2" style={{ animationDelay: `${i * 100}ms` }}>
                          <Skeleton className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
                          <Skeleton className="h-8 w-full bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
                          <div className="text-xs text-gray-500">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Plan Display */}
            {generatedPlan && (
              <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                {/* Plan Header */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <ChefHat className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold text-gray-900 mb-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            {generatedPlan.title}
                          </CardTitle>
                          <CardDescription className="text-base text-gray-600 leading-relaxed">
                            {generatedPlan.description}
                          </CardDescription>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveAsTemplate}
                          className="bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300 hover:scale-105 transition-all duration-200"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder le modèle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportPdf}
                          className="bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300 hover:scale-105 transition-all duration-200"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Exporter en PDF
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSendToClient}
                          disabled={!formData.clientId}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all duration-200 disabled:hover:scale-100"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer au client
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Nutrition Overview */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: "Jours", value: generatedPlan.duration, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
                        { label: "Calories/Jour", value: generatedPlan.nutritionalGoals?.dailyCalories || 'N/A', icon: Flame, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", suffix: "kcal" },
                        { label: "Protéines %", value: `${generatedPlan.nutritionalGoals?.protéinesPercentage || 'N/A'}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
                        { label: "Glucides %", value: `${generatedPlan.nutritionalGoals?.carbPercentage || 'N/A'}%`, icon: Leaf, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
                      ].map((stat, index) => (
                        <div key={index} className={`${stat.bg} ${stat.border} border rounded-xl p-4 text-center transition-all hover:scale-105 cursor-pointer group`}>
                          <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                          <div className={`text-2xl font-bold ${stat.color} mb-1 tabular-nums`}>
                            {stat.value}{stat.suffix}
                          </div>
                          <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* View Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-gray-50/50 rounded-lg border border-gray-200/50">
                      <div className="flex items-center gap-4">
                        <Label className="text-sm font-medium text-gray-700">Mode d'affichage :</Label>
                        <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                          {[
                            { mode: 'cards', icon: Grid, label: 'Cartes' },
                            { mode: 'timeline', icon: List, label: 'Chronologie' },
                            { mode: 'compact', icon: BarChart3, label: 'Compact' },
                            { mode: 'nutrition', icon: PieChart, label: 'Nutrition' },
                          ].map((option) => (
                            <button
                              key={option.mode}
                              onClick={() => setViewMode(option.mode as any)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                                viewMode === option.mode
                                  ? 'bg-blue-600 text-white shadow-sm scale-105'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                              aria-pressed={viewMode === option.mode}
                            >
                              <option.icon className="h-4 w-4" />
                              <span className="hidden sm:inline">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Feedback */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Comment est ce plan ?</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant={planFeedback.rating === 'good' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleFeedback('good')}
                            className={`h-8 w-8 p-0 transition-all duration-200 ${
                              planFeedback.rating === 'good' 
                                ? 'bg-green-600 hover:bg-green-700 text-white scale-110' 
                                : 'hover:bg-green-50 hover:text-green-600 hover:border-green-300'
                            }`}
                            aria-label="Rate plan as good"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={planFeedback.rating === 'bad' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleFeedback('bad')}
                            className={`h-8 w-8 p-0 transition-all duration-200 ${
                              planFeedback.rating === 'bad' 
                                ? 'scale-110' 
                                : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                            }`}
                            aria-label="Rate plan as bad"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Meal Plan Content */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    {viewMode === 'cards' && (
                      <div className="p-6">
                        <Accordion type="multiple" value={Array.from(expandedDays).map(d => `day-${d}`)} onValueChange={(value: string[]) => {
                          const dayNumbers = value.map((v: string) => parseInt(v.replace('day-', '')))
                          setExpandedDays(new Set(dayNumbers))
                        }}>
                          {generatedPlan.days.map((day, dayIndex) => (
                            <AccordionItem key={day.day} value={`day-${day.day}`} className="border-0 mb-4">
                              <AccordionTrigger className="hover:no-underline p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg hover:from-gray-100 hover:to-gray-200/50 transition-all">
                                <div className="flex items-center justify-between w-full mr-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                      {day.day}
                                    </div>
                                    <div className="text-left">
                                      <div className="font-semibold text-gray-900">Jour {day.day}</div>
                                      <div className="text-sm text-gray-500">{day.date}</div>
                                    </div>
                                  </div>
                                  <div className="hidden lg:flex items-center gap-6 text-sm">
                                    <div className="text-center">
                                      <div className="font-semibold text-green-600">{day.totalCalories}</div>
                                      <div className="text-gray-500">calories</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-semibold text-blue-600">{day.totalProtein}g</div>
                                      <div className="text-gray-500">protéines</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-semibold text-orange-600">{(day as any).totalFiber || 'N/A'}g</div>
                                      <div className="text-gray-500">fibres</div>
                                    </div>
                                  </div>
                                  <div className="lg:hidden text-sm text-gray-600">
                                    {day.totalCalories} cal • {day.totalProtein}g protéines
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                <div className="grid gap-4 mt-4">
                                  {(() => {
                                    const organized = getMealsByType(day.meals)
                                    return (
                                      <>
                                        {/* Breakfast */}
                                        {organized.breakfast && (
                                          <MealCard
                                            meal={organized.breakfast}
                                            mealType="Petit-déjeuner"
                                            icon={<Utensils className="h-4 w-4" />}
                                            onEdit={() => handleEditMeal(dayIndex, "breakfast", organized.breakfast!)}
                                            gradientFrom="from-yellow-400"
                                            gradientTo="to-orange-500"
                                          />
                                        )}
                                        
                                        {/* Lunch */}
                                        {organized.lunch && (
                                          <MealCard
                                            meal={organized.lunch}
                                            mealType="Déjeuner"
                                            icon={<Utensils className="h-4 w-4" />}
                                            onEdit={() => handleEditMeal(dayIndex, "lunch", organized.lunch!)}
                                            gradientFrom="from-green-400"
                                            gradientTo="to-emerald-500"
                                          />
                                        )}
                                        
                                        {/* Dinner */}
                                        {organized.dinner && (
                                          <MealCard
                                            meal={organized.dinner}
                                            mealType="Dîner"
                                            icon={<Utensils className="h-4 w-4" />}
                                            onEdit={() => handleEditMeal(dayIndex, "dinner", organized.dinner!)}
                                            gradientFrom="from-purple-400"
                                            gradientTo="to-pink-500"
                                          />
                                        )}
                                        
                                        {/* Snacks */}
                                        {organized.snacks.map((snack, snackIndex) => (
                                          <MealCard
                                            key={snackIndex}
                                            meal={snack}
                                            mealType={`Collation ${snackIndex + 1}`}
                                            icon={<Utensils className="h-4 w-4" />}
                                            onEdit={() => handleEditMeal(dayIndex, "snacks", snack)}
                                            gradientFrom="from-cyan-400"
                                            gradientTo="to-blue-500"
                                          />
                                        ))}
                                      </>
                                    )
                                  })()}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}

                    {viewMode === 'timeline' && (
                      <div className="p-6">
                        <div className="relative">
                          {/* Timeline line */}
                          <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
                          
                          <div className="space-y-8">
                            {generatedPlan.days.map((day, dayIndex) => (
                              <div key={day.day} className="relative">
                                {/* Timeline dot */}
                                <div className="absolute left-6 w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-4 border-white shadow-lg"></div>
                                
                                <div className="ml-16 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900">Jour {day.day}</h3>
                                      <p className="text-sm text-gray-500">{day.date}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className="text-green-600 font-medium">{day.totalCalories} cal</span>
                                      <span className="text-blue-600 font-medium">{day.totalProtein}g protéines</span>
                                    </div>
                                  </div>
                                  
                                  <div className="grid gap-3">
                                    {/* Meals in timeline format */}
                                    {(() => {
                                      const organized = getMealsByType(day.meals)
                                      const mealItems = []
                                      
                                      if (organized.breakfast) {
                                        mealItems.push({ meal: organized.breakfast, type: 'Petit-déjeuner', time: '8:00', color: 'bg-yellow-100 border-yellow-300' })
                                      }
                                      if (organized.lunch) {
                                        mealItems.push({ meal: organized.lunch, type: 'Déjeuner', time: '12:30', color: 'bg-green-100 border-green-300' })
                                      }
                                      if (organized.dinner) {
                                        mealItems.push({ meal: organized.dinner, type: 'Dîner', time: '19:00', color: 'bg-purple-100 border-purple-300' })
                                      }
                                      
                                      return mealItems.map((mealData, mealIndex) => (
                                      <div key={mealIndex} className={`p-4 rounded-lg border-2 ${mealData.color} group hover:shadow-md transition-all`}>
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-3">
                                            <div className="text-sm font-medium text-gray-700">{mealData.time}</div>
                                            <div className="text-sm font-semibold text-gray-900">{mealData.type}</div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditMeal(dayIndex, mealData.type.toLowerCase(), mealData.meal)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 mb-1">{mealData.meal.name}</div>
                                        <div className="text-xs text-gray-600 mb-2">{mealData.meal.description}</div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                          <span>{mealData.meal.calories} cal</span>
                                          <span>{mealData.meal.protéines}g protéines</span>
                                          <span>{(mealData.meal.prepTime || 0) + (mealData.meal.cookTime || 0)} min</span>
                                        </div>
                                      </div>
                                    ))
                                    })()}
                                    
                                    {/* Snacks */}
                                    {getMealsByType(day.meals).snacks.map((snack, snackIndex) => (
                                      <div key={snackIndex} className="p-3 rounded-lg border-2 bg-cyan-50 border-cyan-200 group hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-3">
                                            <div className="text-sm font-medium text-gray-700">{snackIndex === 0 ? '15:00' : '21:00'}</div>
                                            <div className="text-sm font-semibold text-gray-900">Collation {snackIndex + 1}</div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditMeal(dayIndex, "snacks", snack)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 mb-1">{snack.name}</div>
                                        <div className="text-xs text-gray-600 mb-2">{snack.description}</div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                          <span>{snack.calories} cal</span>
                                          <span>{snack.protéines}g protéines</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {viewMode === 'compact' && (
                      <div className="p-6">
                        <div className="space-y-4">
                          {generatedPlan.days.map((day, dayIndex) => (
                            <div key={day.day} className="bg-gray-50/50 rounded-lg p-4 hover:bg-gray-100/50 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    {day.day}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">Jour {day.day}</div>
                                    <div className="text-sm text-gray-500">{day.date}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-green-600 font-medium">{day.totalCalories} cal</span>
                                  <span className="text-blue-600 font-medium">{day.totalProtein}g protéines</span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                {(() => {
                                  const organized = getMealsByType(day.meals)
                                  const allMeals = []
                                  
                                  if (organized.breakfast) {
                                    allMeals.push({ meal: organized.breakfast, type: 'Petit-déjeuner', color: 'border-l-yellow-500' })
                                  }
                                  if (organized.lunch) {
                                    allMeals.push({ meal: organized.lunch, type: 'Déjeuner', color: 'border-l-green-500' })
                                  }
                                  if (organized.dinner) {
                                    allMeals.push({ meal: organized.dinner, type: 'Dîner', color: 'border-l-purple-500' })
                                  }
                                  organized.snacks.forEach((snack, idx) => {
                                    allMeals.push({ meal: snack, type: `Collation ${idx + 1}`, color: 'border-l-cyan-500' })
                                  })
                                  
                                  return allMeals.map((mealData, mealIndex) => (
                                  <div key={mealIndex} className={`bg-white rounded-md p-3 border-l-4 ${mealData.color} group hover:shadow-sm transition-all`}>
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="text-sm font-medium text-gray-900">{mealData.type}</div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditMeal(dayIndex, mealData.type.toLowerCase().replace(/\s+\d+$/, 's'), mealData.meal)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <div className="text-xs font-medium text-gray-800 mb-1 line-clamp-1">{mealData.meal.name}</div>
                                    <div className="text-xs text-gray-600 mb-2 line-clamp-2">{mealData.meal.description}</div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>{mealData.meal.calories} cal</span>
                                      <span>{mealData.meal.protéines}g protéines</span>
                                    </div>
                                  </div>
                                ))
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewMode === 'nutrition' && (
                      <div className="p-6">
                        <MacronutrientBreakdown mealPlan={generatedPlan} />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shopping List & Notes */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Shopping List */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-white" />
                        </div>
                        Liste de courses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {(() => {
                            // Generate shopping list from ingredients
                            const allIngredients: string[] = []
                            generatedPlan.days.forEach(day => {
                              if (Array.isArray(day.meals)) {
                                day.meals.forEach(meal => {
                                  if (meal.ingredients) {
                                    allIngredients.push(...meal.ingredients)
                                  }
                                })
                              }
                            })
                            return [...new Set(allIngredients)].sort().map((item, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center hover:border-green-500 transition-colors cursor-pointer">
                                  <Check className="h-3 w-3 text-green-500 opacity-0 hover:opacity-100" />
                                </div>
                                <span className="text-sm text-gray-700">{item}</span>
                              </div>
                            ))
                          })()}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Notes & Tips */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-white" />
                        </div>
                        Conseils et notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {(generatedPlan.notes || []).map((note, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0">
                                <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{note}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!generatedPlan && !isGenerating && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="py-20">
                  <div className="text-center max-w-lg mx-auto">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                        <ChefHat className="h-10 w-10 text-gray-500" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Prêt à créer de la magie ?</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                      Remplissez vos exigences de plan alimentaire et laissez notre IA créer un plan nutritionnel personnalisé adapté à vos besoins exacts.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-6 mb-8">
                      {[
                        { 
                          icon: Target, 
                          label: "Alimenté par l'IA", 
                          description: "Analyse nutritionnelle intelligente",
                          color: "text-blue-600",
                          bg: "bg-blue-50",
                          border: "border-blue-200"
                        },
                        { 
                          icon: Users, 
                          label: "Personnalisé", 
                          description: "Adapté à chaque client",
                          color: "text-green-600",
                          bg: "bg-green-50",
                          border: "border-green-200"
                        },
                        { 
                          icon: Clock, 
                          label: "Résultats instantanés", 
                          description: "Généré en secondes",
                          color: "text-purple-600",
                          bg: "bg-purple-50",
                          border: "border-purple-200"
                        },
                      ].map((feature, index) => (
                        <div key={index} className={`flex flex-col items-center gap-3 p-4 ${feature.bg} ${feature.border} border rounded-xl hover:scale-105 transition-all duration-200`}>
                          <div className={`w-10 h-10 ${feature.bg} rounded-xl border ${feature.border} flex items-center justify-center shadow-sm`}>
                            <feature.icon className={`h-5 w-5 ${feature.color}`} />
                          </div>
                          <div className="text-center">
                            <div className={`font-semibold ${feature.color} text-sm`}>{feature.label}</div>
                            <div className="text-xs text-gray-600 mt-1">{feature.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Prêt à générer</span>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <span>Commencez par décrire votre vision ci-dessus ↖</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Meal Modal */}
      {editingMeal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Modifier le repas</CardTitle>
                  <CardDescription>Personnalisez ce repas pour mieux répondre à vos besoins</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingMeal(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="mealName" className="text-sm font-medium">Nom du repas</Label>
                  <Input
                    id="mealName"
                    value={editingMeal.meal.name}
                    onChange={(e) =>
                      setEditingMeal((prev) =>
                        prev
                          ? {
                              ...prev,
                              meal: { ...prev.meal, name: e.target.value },
                            }
                          : null,
                      )
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="mealDescription" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="mealDescription"
                    value={editingMeal.meal.description}
                    onChange={(e) =>
                      setEditingMeal((prev) =>
                        prev
                          ? {
                              ...prev,
                              meal: { ...prev.meal, description: e.target.value },
                            }
                          : null,
                      )
                    }
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Nutrition Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'calories', label: 'Calories', suffix: '' },
                  { key: 'protéines', label: 'Protéines', suffix: 'g' },
                  { key: 'carbs', label: 'Glucides', suffix: 'g' },
                  { key: 'fat', label: 'Lipides', suffix: 'g' },
                ].map((field) => (
                  <div key={field.key}>
                    <Label className="text-sm font-medium">{field.label}</Label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        value={editingMeal.meal[field.key as keyof Meal]}
                        onChange={(e) =>
                          setEditingMeal((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  meal: { ...prev.meal, [field.key]: Number.parseInt(e.target.value) || 0 },
                                }
                              : null,
                          )
                        }
                      />
                      {field.suffix && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                          {field.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Temps de préparation (min)</Label>
                  <Input
                    type="number"
                    value={(editingMeal.meal as any).prepTime || 0}
                    onChange={(e) =>
                      setEditingMeal((prev) =>
                        prev
                          ? {
                              ...prev,
                              meal: { ...prev.meal, prepTime: Number.parseInt(e.target.value) || 0 } as any,
                            }
                          : null,
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Temps de cuisson (min)</Label>
                  <Input
                    type="number"
                    value={(editingMeal.meal as any).cookTime || 0}
                    onChange={(e) =>
                      setEditingMeal((prev) =>
                        prev
                          ? {
                              ...prev,
                              meal: { ...prev.meal, cookTime: Number.parseInt(e.target.value) || 0 } as any,
                            }
                          : null,
                      )
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setEditingMeal(null)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveEdit} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Check className="h-4 w-4 mr-2" />
                  Sauvegarder les modifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Meal Card Component
function MealCard({ 
  meal, 
  mealType, 
  icon, 
  onEdit, 
  gradientFrom, 
  gradientTo 
}: { 
  meal: Meal
  mealType: string
  icon: React.ReactNode
  onEdit: () => void
  gradientFrom: string
  gradientTo: string
}) {
  return (
    <div className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-lg flex items-center justify-center text-white shadow-sm`}>
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">{mealType}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{((meal as any).prepTime || 0) + ((meal as any).cookTime || 0)} min total</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 hover:bg-gray-100"
          aria-label={`Edit ${mealType}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div>
          <h5 className="font-medium text-gray-900 mb-1 group-hover:text-gray-800 transition-colors">{meal.name}</h5>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{meal.description}</p>
        </div>
        
        <div className="flex flex-wrap gap-3 text-xs pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md">
            <Flame className="h-3 w-3" />
            <span className="font-medium">{meal.calories} cal</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
            <Activity className="h-3 w-3" />
            <span className="font-medium">{meal.protéines}g protéines</span>
          </div>
          <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
            <PieChart className="h-3 w-3" />
            <span className="font-medium">{meal.carbs}g glucides</span>
          </div>
          <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
            <Globe className="h-3 w-3" />
            <span className="font-medium">{meal.fat}g lipides</span>
          </div>
        </div>
      </div>
      
      {/* Hover overlay for better visual feedback */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
    </div>
  )
}
