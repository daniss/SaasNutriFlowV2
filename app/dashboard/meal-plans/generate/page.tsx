"use client"

import { DashboardHeader } from "@/components/dashboard-header"
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
    BarChart3,
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
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
// Dynamic import with client-side only loading to prevent server-side issues

// Now restored and working with proper dynamic imports!
import { useAuth } from "@/hooks/useAuthNew"
import { useSubscription } from "@/hooks/useSubscription"
import { generateMealPlan, type GeneratedMealPlan, type Meal } from "@/lib/gemini"
import { supabase, type Client } from "@/lib/supabase"
import { convertAIToDynamicMealPlan } from "@/lib/meal-plan-types"
import { useToast } from "@/hooks/use-toast"

export default function GenerateMealPlanPage() {
  const { user } = useAuth()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealPlan | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [generationProgress, setGenerationProgress] = useState(0)
  const [lastSubmission, setLastSubmission] = useState<number>(0)
  const [validationError, setValidationError] = useState<string>("")
  
  // Send to client loading states
  const [isSendingToClient, setIsSendingToClient] = useState(false)
  const [sendingProgress, setSendingProgress] = useState(0)
  
  // Save only loading state
  const [isSavingOnly, setIsSavingOnly] = useState(false)
  
  // Save as template loading state
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  
  // Safe progress setter that caps at 100%
  const setSafeProgress = (progress: number) => {
    setSendingProgress(Math.min(100, Math.max(0, progress)))
  }
  const [sendingStep, setSendingStep] = useState("")
  const [planFeedback, setPlanFeedback] = useState<{ planId: string; rating: 'good' | 'bad' | null }>({ planId: '', rating: null })
  const [viewMode, setViewMode] = useState<'cards' | 'timeline' | 'compact'>('cards')
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Form state - Updated for new security validation
  const [formData, setFormData] = useState({
    prompt: "",
    planName: "",
    clientId: "",
    duration: 7,
    targetCalories: 2000,
    restrictions: [] as string[],
  })
  
  // Rate limit state
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    isLimited: boolean;
    resetTime?: number;
  }>({ isLimited: false })

  // AI usage tracking state
  const [aiUsage, setAiUsage] = useState<{
    current: number;
    limit: number;
    loading: boolean;
  }>({ current: 0, limit: 0, loading: true })

  // Client account state
  const [hasClientAccount, setHasClientAccount] = useState(false)

  // Check if selected client has an active account
  const checkClientAccount = async (clientId: string) => {
    if (!clientId) {
      setHasClientAccount(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("client_accounts")
        .select("is_active")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .single()

      setHasClientAccount(!!data && data.is_active)
    } catch (error) {
      setHasClientAccount(false)
    }
  }

  // Check client account when clientId changes
  useEffect(() => {
    checkClientAccount(formData.clientId)
  }, [formData.clientId])

  // Initialize form data from URL parameters (for template-based generation)
  useEffect(() => {
    const prompt = searchParams.get('prompt')
    const planName = searchParams.get('planName')
    const templateId = searchParams.get('templateId')
    
    if (prompt || planName) {
      setFormData(prev => ({
        ...prev,
        prompt: prompt || prev.prompt,
        planName: planName || prev.planName
      }))
      
    }
  }, [searchParams])

  // Quick preset prompts for inspiration (focus on style and health goals only)
  const presetPrompts = [
    "Plan méditerranéen riche en poissons gras, huile d'olive et légumes colorés pour la santé cardiaque",
    "Plan protéiné avec jeûne intermittent (16:8), privilégiant viandes maigres et légumineuses",
    "Plan végétalien équilibré avec sources complètes de protéines et superaliments",
    "Plan anti-inflammatoire avec curcuma, gingembre, baies et poissons gras",
    "Plan à faible index glycémique avec céréales complètes et fibres pour diabétiques",
    "Plan batch cooking familial avec préparations simples et réchauffables",
    "Plan cœliaque avec quinoa, sarrasin et alternatives naturellement sans gluten",
    "Plan grossesse végétarien riche en fer, B12 et acide folique",
    "Plan simple et digeste pour sensibilités alimentaires multiples",
  ]

  // Enhanced validation to match backend security
  const validateFormData = (data: typeof formData): string | null => {
    // Prompt validation
    if (!data.prompt.trim()) return "Veuillez entrer une description de plan alimentaire"
    if (data.prompt.length < 10) return "Veuillez fournir plus de détails (au moins 10 caractères)"
    if (data.prompt.length > 500) return "Veuillez garder votre demande sous 500 caractères"
    
    // Duration validation  
    if (data.duration < 1 || data.duration > 14) return "La durée doit être entre 1 et 14 jours"
    
    // Calories validation
    if (data.targetCalories < 800 || data.targetCalories > 4000) return "Les calories doivent être entre 800 et 4000 par jour"
    
    // Restrictions validation
    if (data.restrictions.length > 10) return "Maximum 10 restrictions alimentaires"
    
    // Check for malicious content patterns (basic client-side check)
    const suspiciousPatterns = [
      /ignore\s+(previous\s+)?instructions?/gi,
      /system\s+(prompt|message|role)/gi,
      /pretend\s+you\s+are/gi,
      /act\s+as\s+(if\s+you\s+are\s+)?/gi,
      /api\s*key/gi,
      /password/gi,
      /secret/gi,
    ]
    
    const lowerPrompt = data.prompt.toLowerCase()
    if (suspiciousPatterns.some(pattern => pattern.test(data.prompt))) {
      return "Contenu invalide détecté dans la description"
    }
    
    // Check if it's meal/nutrition related
    const nutritionKeywords = ['meal', 'diet', 'food', 'nutrition', 'calorie', 'protéines', 'carb', 'fat', 'vegetarian', 'vegan', 'keto', 'weight', 'healthy', 'breakfast', 'lunch', 'dinner', 'snack', 'plan', 'alimentaire', 'repas']
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
    if (!user) {
      return
    }


    try {
      // RLS policies will automatically filter clients for the authenticated user
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name")


      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("🔍 loadClients Error:", error)
    }
  }

  useEffect(() => {
    if (user) {
      loadClients()
    }
  }, [user])

  // Fetch AI usage data
  const fetchAIUsage = async () => {
    if (!subscription?.planDetails) return

    try {
      setAiUsage(prev => ({ ...prev, loading: true }))
      
      const response = await fetch('/api/subscription/usage?type=ai_generations')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      setAiUsage({
        current: data.current || 0,
        limit: subscription.planDetails?.ai_generations_per_month || subscription.planDetails?.limits?.aiGenerations || 0,
        loading: false
      })
    } catch (error) {
      console.error('Error fetching AI usage:', error)
      setAiUsage(prev => ({ ...prev, loading: false }))
    }
  }

  // Load AI usage when subscription data is available
  useEffect(() => {
    if (subscription && subscription.planDetails && !subscriptionLoading) {
      fetchAIUsage()
    }
  }, [subscription, subscriptionLoading])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }



  const handleGenerate = async () => {
    // Enhanced validation
    const validation = validateFormData(formData)
    if (validation) {
      setValidationError(validation)
      textareaRef.current?.focus()
      return
    }

    // Check if rate limited
    if (rateLimitInfo.isLimited) {
      const now = Date.now()
      if (rateLimitInfo.resetTime && now < rateLimitInfo.resetTime) {
        const remainingSeconds = Math.ceil((rateLimitInfo.resetTime - now) / 1000)
        setValidationError(`Limite de génération atteinte. Réessayez dans ${remainingSeconds} secondes.`)
        return
      } else {
        // Reset rate limit info if time has passed
        setRateLimitInfo({ isLimited: false })
      }
    }

    // Cooldown check (5 seconds between requests)
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
      // Updated request structure for new security validation
      const selectedClient = clients.find(c => c.id === formData.clientId)
      const mealPlanRequest = {
        prompt: formData.prompt,
        duration: formData.duration,
        targetCalories: formData.targetCalories,
        restrictions: formData.restrictions,
        clientDietaryTags: selectedClient?.tags || [],
        clientId: formData.clientId || undefined,
      }

      const result = await generateMealPlan(mealPlanRequest)
      const { transformed: plan, raw: rawPlan } = result

      setGenerationProgress(100)
      setTimeout(() => {
        setGeneratedPlan(plan)
        setPlanFeedback({ planId: plan.title + Date.now(), rating: null })
        clearInterval(progressInterval)
        // Refresh AI usage counter after successful generation with delay to ensure DB update
        setTimeout(() => fetchAIUsage(), 1000)
      }, 500)
      
    } catch (error: any) {
      console.error("Error generating meal plan:", error)
      
      // Enhanced error handling for security responses
      let errorMessage = "Échec de la génération du plan alimentaire. Veuillez réessayer."
      
      if (error?.message) {
        const message = error.message.toLowerCase()
        
        if (message.includes('rate limit') || message.includes('limite de génération')) {
          errorMessage = "Limite de génération atteinte. Veuillez attendre avant de réessayer."
          // Set rate limit info if available
          if (error.resetTime) {
            setRateLimitInfo({ 
              isLimited: true, 
              resetTime: error.resetTime 
            })
          }
        } else if (message.includes('contenu invalide') || message.includes('suspicious')) {
          errorMessage = "Contenu invalide détecté. Veuillez reformuler votre demande."
        } else if (message.includes('validation') || message.includes('invalide')) {
          errorMessage = "Données invalides. Vérifiez votre saisie."
        } else if (message.includes('timeout')) {
          errorMessage = "La génération a pris trop de temps. Essayez avec moins de jours."
        } else if (message.includes('service') || message.includes('indisponible')) {
          errorMessage = "Service temporairement indisponible. Veuillez réessayer plus tard."
        }
      }
      
      setValidationError(errorMessage)
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


  const handleSaveAsTemplate = async () => {
    if (!generatedPlan || !user) return

    setIsSavingTemplate(true)
    setSafeProgress(0)
    setSendingStep("Préparation...")
    
    try {
      // Step 1: Save ingredients to database
      setSendingStep("Création des ingrédients...")
      setSafeProgress(20)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for smooth UI
      
      const savedIngredients = await saveIngredientsToDatabase(generatedPlan.days)

      // Step 2: Create recipes from AI-generated meals
      setSendingStep("Création des recettes...")
      setSafeProgress(40)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for smooth UI
      
      const createdRecipes = await createRecipesFromMeals(generatedPlan.days, user!.id)

      // Step 3: Create recipe-to-meal mapping for template structure
      setSendingStep("Création de la structure du modèle...")
      setSafeProgress(60)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for smooth UI
      
      const recipeMapping = createRecipeToMealMapping(generatedPlan.days, createdRecipes)

      // Step 4: Transform AI plan to template structure with recipe references
      setSendingStep("Traitement de la structure...")
      setSafeProgress(80)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for smooth UI
      
      const templateStructure = []
      
      for (let dayNum = 1; dayNum <= generatedPlan.duration; dayNum++) {
        const dayData = generatedPlan.days.find(d => d.day === dayNum)
        if (!dayData) continue

        const dayTemplate = {
          day: dayNum,
          meals: dayData.meals.map((meal: any) => {
            // Find corresponding recipe for this meal
            const recipe = createdRecipes.find(r => r.name === meal.name)
            
            return {
              name: meal.type, // Use meal type (breakfast, lunch, etc.)
              time: meal.time || "08:00", // Default time if not provided
              calories_target: meal.calories || null,
              description: meal.name, // Use meal name as description
              recipe_id: recipe?.id || null // Link to created recipe
            }
          })
        }
        
        templateStructure.push(dayTemplate)
      }

      // Step 5: Save enhanced template with recipe references
      setSendingStep("Sauvegarde du modèle...")
      setSafeProgress(90)
      
      const { error } = await supabase.from("meal_plan_templates").insert({
        dietitian_id: user.id,
        name: formData.planName || generatedPlan.title,
        description: generatedPlan.description || '',
        category: 'general',
        client_type: 'general',
        goal_type: 'general',
        duration_days: generatedPlan.duration,
        meal_structure: templateStructure, // Enhanced structure with recipe references
        target_calories: generatedPlan.targetCalories?.toString() || '',
        tags: ['ai-generated'],
        difficulty: 'medium',
        // Nutritional targets from AI plan
        target_macros: {
          protein: generatedPlan.nutritionalGoals?.proteinPercentage || null,
          carbs: generatedPlan.nutritionalGoals?.carbPercentage || null,
          fat: generatedPlan.nutritionalGoals?.fatPercentage || null
        }
      })

      if (error) throw error
      
      // Step 6: Complete
      setSendingStep("Finalisation...")
      setSafeProgress(100)
      
      toast({
        title: "Modèle sauvegardé",
        description: `Le plan alimentaire a été sauvegardé comme modèle avec ${createdRecipes.length} recettes et ${savedIngredients.length} ingrédients créés!`,
      })
      
      // Small delay to show completion, then redirect
      setTimeout(() => {
        router.push('/dashboard/templates')
      }, 1000)
    } catch (error) {
      console.error("Error saving template:", error)
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder le modèle. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      // Reset loading state
      setIsSavingTemplate(false)
      setSafeProgress(0)
      setSendingStep("")
    }
  }

  // Function to map created recipes to their corresponding meals
  const createRecipeToMealMapping = (days: any[], createdRecipes: any[]) => {
    const mapping: Record<string, any> = {}
    
    // Create a lookup for recipes by name
    const recipesByName = createdRecipes.reduce((acc, recipe) => {
      acc[recipe.name] = recipe
      return acc
    }, {} as Record<string, any>)
    
    days.forEach(day => {
      day.meals.forEach((meal: any) => {
        const recipeName = meal.name
        const recipeKey = `${day.day}-${meal.name}`
        
        if (recipesByName[recipeName]) {
          // Map the recipe with its ingredients for the meal plan editor
          const recipe = recipesByName[recipeName]
          
          // Fetch the recipe ingredients to include in the mapping
          const recipeWithIngredients = {
            id: recipe.id,
            name: recipe.name,
            description: recipe.description,
            servings: recipe.servings,
            prep_time: recipe.prep_time,
            cook_time: recipe.cook_time,
            calories_per_serving: recipe.calories_per_serving,
            protein_per_serving: recipe.protein_per_serving,
            carbs_per_serving: recipe.carbs_per_serving,
            fat_per_serving: recipe.fat_per_serving,
            fiber_per_serving: recipe.fiber_per_serving,
            ingredients: [] // Will be populated from the original meal data
          }
          
          // Add ingredient details from the original meal
          if (meal.ingredientsNutrition && meal.ingredientsNutrition.length > 0) {
            recipeWithIngredients.ingredients = meal.ingredientsNutrition.map((nutrition: any, index: number) => {
              const ingredientString = meal.ingredients[index] || `${nutrition.name}`
              
              // Parse quantity and unit
              let quantity = 100 // default
              let unit = nutrition.unit || 'g'
              
              const quantityMatch = ingredientString.match(/^(\d+(?:\.\d+)?)\s*(g|ml|kg|l|piece|pièce|cuillère|tasse)?/)
              if (quantityMatch) {
                quantity = parseFloat(quantityMatch[1])
                if (quantityMatch[2]) {
                  unit = quantityMatch[2] === 'piece' || quantityMatch[2] === 'pièce' ? 'piece' : quantityMatch[2]
                }
              }
              
              return {
                id: `temp-${index}`, // Temporary ID for the mapping
                ingredient: {
                  id: `ingredient-${index}`,
                  name: nutrition.name,
                  category: nutrition.unit === 'ml' ? 'Liquides' : nutrition.unit === 'piece' ? 'Comptables' : 'Solides'
                },
                quantity: quantity,
                unit: unit
              }
            })
          }
          
          mapping[recipeKey] = recipeWithIngredients
        }
      })
    })
    
    return mapping
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

    setIsSendingToClient(true)
    setSafeProgress(0)
    setSendingStep("Préparation...")

    try {
      // Step 1: Get client information for notification
      setSendingStep("Récupération des informations client...")
      setSafeProgress(10)
      
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("name, email")
        .eq("id", formData.clientId)
        .single()
      
      if (clientError) throw clientError
      
      
      // CRITICAL: Save ingredients and create recipes BEFORE converting to dynamic format
      // The conversion strips out ingredients data, so we must do this first!
      
      // Step 2: Save ingredients to database first
      setSendingStep("Création des ingrédients...")
      setSafeProgress(20)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for smooth UI
      
      const savedIngredients = await saveIngredientsToDatabase(generatedPlan.days)
      
      // Step 3: Create recipes for each meal with full ingredient data
      setSendingStep("Création des recettes...")
      setSafeProgress(40)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for smooth UI
      
      const createdRecipes = await createRecipesFromMeals(generatedPlan.days, user!.id)
      
      // Step 4: Convert AI plan to dynamic format
      setSendingStep("Traitement du plan alimentaire...")
      setSafeProgress(50)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for smooth UI
      
      const dynamicPlan = convertAIToDynamicMealPlan({
        ...generatedPlan,
        totalDays: generatedPlan.duration,
        averageCaloriesPerDay: generatedPlan.targetCalories || generatedPlan.nutritionalGoals?.dailyCalories,
        nutritionSummary: generatedPlan.nutritionSummary || {
          protein: `${generatedPlan.nutritionalGoals?.proteinPercentage || 25}%`,
          carbohydrates: `${generatedPlan.nutritionalGoals?.carbPercentage || 45}%`,
          fat: `${generatedPlan.nutritionalGoals?.fatPercentage || 30}%`
        }
      })

      // Step 5: Link recipes to meals
      setSendingStep("Liaison des recettes aux repas...")
      setSafeProgress(60)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for smooth UI
      
      // IMPORTANT: Add created recipes to the dynamic plan structure
      // Map recipes to their corresponding meals using the ORIGINAL plan structure
      const recipesByMeal = createRecipeToMealMapping(generatedPlan.days, createdRecipes)
      
      // Link recipes to meals - simple many-to-one relationship
      for (const day of dynamicPlan.days) {
        const originalDay = generatedPlan.days.find(d => d.day === day.day)
        if (!originalDay) continue
        
        for (const meal of day.meals) {
          // Find matching recipe by comparing with original AI meal data
          // The dynamic meal uses meal.name as meal type, but we need to match with original meal.name
          const originalMeal = originalDay.meals?.find((origMeal: any) => {
            const mealTypeMap: Record<string, string> = {
              breakfast: 'Petit-déjeuner',
              lunch: 'Déjeuner', 
              dinner: 'Dîner',
              snack: 'Collation',
              snacks: 'Collation'
            }
            const expectedType = mealTypeMap[origMeal.type] || origMeal.type
            return expectedType === meal.name
          })
          
          // Use the original_meal_name if available (new approach) or fallback to originalMeal lookup
          const originalMealName = meal.original_meal_name || (originalMeal ? originalMeal.name : null)
          
          if (originalMealName) {
            // Find matching recipe by original meal name (used during recipe creation)
            const matchingRecipe = createdRecipes.find(recipe => 
              recipe.name === originalMealName || 
              recipe.name.toLowerCase().trim() === originalMealName.toLowerCase().trim()
            )
            
            if (matchingRecipe) {
              // Link the recipe to the meal
              meal.recipe_id = matchingRecipe.id
            }
          }
        }
      }
      
      
      if (savedIngredients.length > 0 || createdRecipes.length > 0) {
        toast({
          title: "Données créées",
          description: `${savedIngredients.length} ingrédient(s) et ${createdRecipes.length} recette(s) ont été automatiquement créés.`
        })
      }
      
      // Step 6: Save the meal plan to database
      setSendingStep("Sauvegarde du plan alimentaire...")
      setSafeProgress(75)
      
      
      const { data: savedPlan, error: saveError } = await supabase
        .from("meal_plans")
        .insert({
          dietitian_id: user!.id,
          client_id: formData.clientId,
          name: formData.planName || generatedPlan.title,
          description: generatedPlan.description,
          duration_days: generatedPlan.duration,
          plan_content: dynamicPlan,
          status: "active",
        })
        .select()
        .single()
      
      if (saveError) throw saveError
      
      // Step 7: Send notification to client
      setSendingStep("Envoi de la notification au client...")
      setSafeProgress(90)
      
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
      
      // Step 8: Complete
      setSendingStep("Finalisation...")
      setSafeProgress(100)
      
      toast({
        title: "Succès",
        description: `Plan alimentaire envoyé au client avec succès! ${savedIngredients.length} ingrédient(s) et ${createdRecipes.length} recette(s) créés.`,
      })
      
      // Small delay to show completion, then redirect
      setTimeout(() => {
        router.push(`/dashboard/meal-plans/${savedPlan.id}`)
      }, 1000)
    } catch (error) {
      console.error("Error sending to client:", error)
      toast({
        title: "Erreur",
        description: "Échec de l'envoi au client. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      // Reset loading state
      setIsSendingToClient(false)
      setSafeProgress(0)
      setSendingStep("")
    }
  }

  // Save plan without activating it for the client
  const handleSaveOnly = async () => {
    if (!generatedPlan) {
      toast({
        title: "Erreur",
        description: "Aucun plan généré à sauvegarder",
        variant: "destructive",
      })
      return
    }

    setIsSavingOnly(true)
    setSafeProgress(0)
    setSendingStep("Préparation...")

    try {
      // Step 1: Create ingredients
      setSendingStep("Création des ingrédients...")
      setSafeProgress(15)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for smooth UI
      
      const savedIngredients = await saveIngredientsToDatabase(generatedPlan.days)
      
      // Step 2: Create recipes for each meal with full ingredient data
      setSendingStep("Création des recettes...")
      setSafeProgress(35)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for smooth UI
      
      const createdRecipes = await createRecipesFromMeals(generatedPlan.days, user!.id)
      
      // Step 3: Convert AI plan to dynamic format
      setSendingStep("Traitement du plan alimentaire...")
      setSafeProgress(55)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for smooth UI
      
      const dynamicPlan = convertAIToDynamicMealPlan({
        ...generatedPlan,
        totalDays: generatedPlan.duration,
        averageCaloriesPerDay: generatedPlan.targetCalories || generatedPlan.nutritionalGoals?.dailyCalories,
        nutritionSummary: generatedPlan.nutritionSummary || {
          protein: `${generatedPlan.nutritionalGoals?.proteinPercentage || 25}%`,
          carbohydrates: `${generatedPlan.nutritionalGoals?.carbPercentage || 45}%`,
          fat: `${generatedPlan.nutritionalGoals?.fatPercentage || 30}%`
        }
      })

      // Step 4: Link recipes to meals
      setSendingStep("Liaison des recettes aux repas...")
      setSafeProgress(75)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for smooth UI
      
      // IMPORTANT: Add created recipes to the dynamic plan structure
      // Map recipes to their corresponding meals using the ORIGINAL plan structure
      const recipesByMeal = createRecipeToMealMapping(generatedPlan.days, createdRecipes)
      
      for (const day of dynamicPlan.days) {
        const originalDay = generatedPlan.days.find(d => d.day === day.day)
        if (!originalDay) continue
        
        for (const meal of day.meals) {
          const originalMeal = originalDay.meals?.find((origMeal: any) => {
            const mealTypeMap: Record<string, string> = {
              breakfast: 'Petit-déjeuner',
              lunch: 'Déjeuner', 
              dinner: 'Dîner',
              snack: 'Collation',
              snacks: 'Collation'
            }
            const expectedType = mealTypeMap[origMeal.type] || origMeal.type
            return expectedType === meal.name
          })
          
          const originalMealName = meal.original_meal_name || (originalMeal ? originalMeal.name : null)
          
          if (originalMealName) {
            const matchingRecipe = createdRecipes.find(recipe => 
              recipe.name === originalMealName || 
              recipe.name.toLowerCase().trim() === originalMealName.toLowerCase().trim()
            )
            
            if (matchingRecipe) {
              meal.recipe_id = matchingRecipe.id
            }
          }
        }
      }
      
      // Step 5: Save the meal plan to database
      setSendingStep("Sauvegarde du plan alimentaire...")
      setSafeProgress(90)
      
      const { data: savedPlan, error: saveError } = await supabase
        .from("meal_plans")
        .insert({
          dietitian_id: user!.id,
          client_id: formData.clientId || null, // Allow null client
          name: formData.planName || generatedPlan.title,
          description: generatedPlan.description,
          duration_days: generatedPlan.duration,
          plan_content: dynamicPlan,
          status: "paused", // Different from Active - not visible to client
        })
        .select()
        .single()
      
      if (saveError) throw saveError
      
      // Step 6: Complete
      setSendingStep("Finalisation...")
      setSafeProgress(100)
      
      toast({
        title: "Plan sauvegardé",
        description: `Plan alimentaire sauvegardé avec succès! ${savedIngredients.length} ingrédient(s) et ${createdRecipes.length} recette(s) créés.`,
      })
      
      // Small delay to show completion, then redirect
      setTimeout(() => {
        router.push(`/dashboard/meal-plans/${savedPlan.id}`)
      }, 1000)
    } catch (error) {
      console.error("Error saving plan:", error)
      toast({
        title: "Erreur",
        description: "Échec de la sauvegarde. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      // Reset loading state
      setIsSavingOnly(false)
      setSafeProgress(0)
      setSendingStep("")
    }
  }

  // Function to save ingredients to database
  const saveIngredientsToDatabase = async (days: any[]) => {
    const savedIngredients = []
    
    for (const day of days) {
      for (const meal of day.meals) {
        if (!meal.ingredientsNutrition || meal.ingredientsNutrition.length === 0) continue
        
        for (const ingredient of meal.ingredientsNutrition) {
          try {
            // Check if ingredient already exists globally
            const { data: existingIngredient } = await supabase
              .from("ingredients")
              .select("id")
              .eq("name", ingredient.name)
              .single()
            
            if (existingIngredient) {
              continue
            }
            
            // Prepare ingredient data based on unit type
            const ingredientData = {
              name: ingredient.name,
              category: ingredient.unit === 'ml' ? 'liquid' : ingredient.unit === 'piece' ? 'countable' : 'solid',
              unit_type: ingredient.unit,
              
              // Set nutritional values based on unit
              ...(ingredient.unit === 'g' && {
                calories_per_100g: ingredient.caloriesPer100,
                protein_per_100g: ingredient.proteinPer100,
                carbs_per_100g: ingredient.carbsPer100,
                fat_per_100g: ingredient.fatPer100,
                fiber_per_100g: ingredient.fiberPer100
              }),
              
              ...(ingredient.unit === 'ml' && {
                calories_per_100ml: ingredient.caloriesPer100,
                protein_per_100ml: ingredient.proteinPer100,
                carbs_per_100ml: ingredient.carbsPer100,
                fat_per_100ml: ingredient.fatPer100,
                fiber_per_100ml: ingredient.fiberPer100
              }),
              
              ...(ingredient.unit === 'piece' && {
                calories_per_piece: ingredient.caloriesPer100,
                protein_per_piece: ingredient.proteinPer100,
                carbs_per_piece: ingredient.carbsPer100,
                fat_per_piece: ingredient.fatPer100,
                fiber_per_piece: ingredient.fiberPer100
              })
            }
            
            // Save ingredient
            const { data: savedIngredient, error: ingredientError } = await supabase
              .from("ingredients")
              .insert(ingredientData)
              .select()
              .single()
            
            if (ingredientError) {
              continue
            }
            
            savedIngredients.push(savedIngredient)
            
          } catch (error) {
            // Silently handle errors
          }
        }
      }
    }
    
    return savedIngredients
  }

  // Function to create recipes from AI-generated meals
  const createRecipesFromMeals = async (days: any[], dietitianId: string) => {
    const createdRecipes = []
    
    for (const day of days) {
      for (const meal of day.meals) {
        if (!meal.ingredients || meal.ingredients.length === 0) {
          continue
        }
        
        try {
          // Map meal type to recipe category
          const categoryMap: Record<string, string> = {
            breakfast: 'breakfast',
            lunch: 'lunch', 
            dinner: 'dinner',
            snack: 'snack'
          }
          
          // Use just the meal name without day
          const recipeName = meal.name
          
          // Check if recipe with this name already exists
          const { data: existingRecipe } = await supabase
            .from("recipes")
            .select("id")
            .eq("dietitian_id", dietitianId)
            .eq("name", recipeName)
            .single()
          
          if (existingRecipe) {
            // Get the full existing recipe data to add to createdRecipes array
            const { data: fullExistingRecipe } = await supabase
              .from("recipes")
              .select("*")
              .eq("id", existingRecipe.id)
              .single()
            
            if (fullExistingRecipe) {
              createdRecipes.push(fullExistingRecipe)  // Add existing recipe to array for later linking
            }
            continue
          }
          
          // Create recipe data
          const recipeData = {
            dietitian_id: dietitianId,
            name: recipeName,
            description: meal.description || `Recette générée automatiquement par l'IA`,
            category: categoryMap[meal.type] || 'lunch',
            prep_time: meal.prepTime || null,
            cook_time: meal.cookTime || null,
            servings: 1,
            difficulty: 'medium',
            calories_per_serving: meal.calories || null,
            protein_per_serving: meal.protein || null,
            carbs_per_serving: meal.carbs || null,
            fat_per_serving: meal.fat || null,
            fiber_per_serving: meal.fiber || null,
            image_url: null,
            instructions: meal.instructions || [],
            tags: meal.tags || ['ia-generee'],
            is_favorite: false,
            usage_count: 0
          }
          
          // Create the recipe
          const { data: savedRecipe, error: recipeError } = await supabase
            .from("recipes")
            .insert(recipeData)
            .select()
            .single()
          
          if (recipeError) {
            console.error(`Error creating recipe "${recipeName}":`, recipeError)
            continue
          }
          
          
          // Create ingredients using ingredientsNutrition data and link to global database
          const ingredientData = []
          
          if (meal.ingredientsNutrition && meal.ingredientsNutrition.length > 0) {
            // Use detailed ingredient nutrition data
            for (let index = 0; index < meal.ingredientsNutrition.length; index++) {
              const nutritionData = meal.ingredientsNutrition[index]
              const ingredientString = meal.ingredients[index] || `${nutritionData.name}`
              
              // Parse quantity and unit from ingredient string
              let quantity = null
              let unit = nutritionData.unit || 'g'
              
              // Extract quantity from ingredient string (e.g., "100g quinoa" -> 100)
              const quantityMatch = ingredientString.match(/^(\d+(?:\.\d+)?)\s*(g|ml|kg|l|piece|pièce|cuillère|tasse)?/)
              if (quantityMatch) {
                quantity = parseFloat(quantityMatch[1])
                if (quantityMatch[2]) {
                  unit = quantityMatch[2] === 'piece' || quantityMatch[2] === 'pièce' ? 'piece' : quantityMatch[2]
                }
              }
              
              // Find ingredient ID from global database
              let ingredientId = null
              try {
                const { data: globalIngredient } = await supabase
                  .from("ingredients")
                  .select("id")
                  .eq("name", nutritionData.name)
                  .single()
                
                if (globalIngredient) {
                  ingredientId = globalIngredient.id
                }
              } catch (error) {
              }
              
              ingredientData.push({
                recipe_id: savedRecipe.id,
                ingredient_id: ingredientId, // Link to global ingredient if found
                name: nutritionData.name,
                quantity: quantity,
                unit: unit,
                notes: null,
                order_index: index
              })
            }
          } else {
            // Fallback: use basic ingredients array if no nutrition data
            meal.ingredients.forEach((ingredient: string, index: number) => {
              const parts = ingredient.trim().split(' ')
              let quantity = null
              let unit = null
              let name = ingredient
              
              if (parts.length >= 2) {
                const firstPart = parts[0]
                const quantityMatch = firstPart.match(/^(\d+(?:\.\d+)?)(.*)$/)
                
                if (quantityMatch) {
                  quantity = parseFloat(quantityMatch[1])
                  unit = quantityMatch[2] || (parts[1] && ['g', 'kg', 'ml', 'l'].includes(parts[1]) ? parts[1] : 'g')
                  name = parts.slice(unit && unit === parts[1] ? 2 : 1).join(' ')
                }
              }
              
              ingredientData.push({
                recipe_id: savedRecipe.id,
                ingredient_id: null, // No global reference for fallback ingredients
                name: name,
                quantity: quantity,
                unit: unit,
                notes: null,
                order_index: index
              })
            })
          }
          
          // Insert ingredients
          if (ingredientData.length > 0) {
            const { error: ingredientsError } = await supabase
              .from("recipe_ingredients")
              .insert(ingredientData)
            
            if (ingredientsError) {
              console.error(`Error creating ingredients for "${recipeName}":`, ingredientsError)
            }
          }
          
          createdRecipes.push(savedRecipe)
          
        } catch (error) {
          console.error(`Error processing meal "${meal.name}":`, error)
        }
      }
    }
    
    return createdRecipes
  }




  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Générateur de plans alimentaires IA"
        subtitle="Créez des plans nutritionnels personnalisés en quelques secondes avec l'IA intelligente"
        showSearch={false}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
        <div className="relative container mx-auto px-6 pt-12 pb-8">
            <div className="max-w-3xl">
            
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
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8">
          {/* Generation Panel */}
          <div className="lg:col-span-1 xl:col-span-2 space-y-6">
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
                    placeholder="ex: Plan méditerranéen riche en oméga-3, adapté à une personne pré-diabétique avec focus sur les légumes verts et poissons gras..."
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
                    <span className={`text-xs transition-colors ${formData.prompt.length > 400 ? 'text-red-500' : 'text-gray-400'}`}>
                      {formData.prompt.length}/500
                    </span>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium mb-1">💡 Conseil</p>
                  <p className="text-xs text-blue-600">
                    Décrivez le style alimentaire et les objectifs. La durée et les calories seront configurées ci-dessous.
                  </p>
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
                    <CardTitle className="text-lg">Configuration du plan</CardTitle>
                    <CardDescription className="text-sm">Durée, calories et paramètres spécifiques</CardDescription>
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
                    readOnly={isGenerating}
                    disabled={isGenerating}
                  />
                </div>
                <div>
                  <Label htmlFor="client" className="text-sm font-medium">Client (optionnel)</Label>
                  <Select 
                    value={formData.clientId} 
                    onValueChange={(value: string) => handleInputChange("clientId", value)}
                    disabled={isGenerating}
                  >
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

                {/* Duration Field */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration" className="text-sm font-medium">Durée (jours)</Label>
                    <Select 
                      value={formData.duration.toString()} 
                      onValueChange={(value: string) => handleInputChange("duration", parseInt(value))}
                      disabled={isGenerating}
                    >
                      <SelectTrigger className="mt-1 border-gray-200 focus:border-blue-500">
                        <SelectValue placeholder="Nombre de jours" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 14 }, (_, i) => i + 1).map((days) => (
                          <SelectItem key={days} value={days.toString()}>
                            {days} jour{days > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Calories Field */}
                  <div>
                    <Label htmlFor="targetCalories" className="text-sm font-medium">Calories/jour</Label>
                    <Input
                      id="targetCalories"
                      type="number"
                      min="800"
                      max="4000"
                      step="50"
                      placeholder="2000"
                      value={formData.targetCalories}
                      onChange={(e) => handleInputChange("targetCalories", parseInt(e.target.value) || 2000)}
                      className="mt-1 border-gray-200 focus:border-blue-500"
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-gray-500 mt-1">Entre 800 et 4000 calories</p>
                  </div>
                </div>

                {/* Dietary Restrictions Field */}
                <div>
                  <Label className="text-sm font-medium">Restrictions alimentaires (optionnel)</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {['Sans gluten', 'Sans lactose', 'Végétarien', 'Végétalien', 'Sans noix', 'Sans fruits de mer', 'Diabétique', 'Faible en sodium', 'Sans œufs', 'Halal', 'Casher'].map((restriction) => {
                        const isSelected = formData.restrictions.includes(restriction)
                        return (
                          <button
                            key={restriction}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                handleInputChange("restrictions", formData.restrictions.filter(r => r !== restriction))
                              } else if (formData.restrictions.length < 10) {
                                handleInputChange("restrictions", [...formData.restrictions, restriction])
                              }
                            }}
                            disabled={isGenerating || (!isSelected && formData.restrictions.length >= 10)}
                            className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                              isSelected
                                ? 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            {restriction}
                          </button>
                        )
                      })}
                    </div>
                    {formData.restrictions.length > 0 && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700 mb-1">Restrictions sélectionnées:</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.restrictions.map((restriction) => (
                            <Badge key={restriction} variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                              {restriction}
                              <button
                                type="button"
                                onClick={() => handleInputChange("restrictions", formData.restrictions.filter(r => r !== restriction))}
                                disabled={isGenerating}
                                className="ml-1 hover:text-blue-900 disabled:opacity-50"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">{formData.restrictions.length}/10 restrictions</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Usage Counter */}
                {subscription && subscription.planDetails && aiUsage.limit > 0 && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm font-semibold text-gray-700">Générations IA ce mois</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-700">
                          {aiUsage.loading ? '...' : aiUsage.current}/{aiUsage.limit === -1 ? '∞' : aiUsage.limit}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    {aiUsage.limit !== -1 && (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              aiUsage.current / aiUsage.limit >= 0.9 
                                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                : aiUsage.current / aiUsage.limit >= 0.7 
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            }`}
                            style={{
                              width: `${Math.min((aiUsage.current / aiUsage.limit) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        
                        {aiUsage.current >= aiUsage.limit && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              Limite mensuelle atteinte. 
                              <button 
                                className="underline ml-1 hover:text-red-700"
                                onClick={() => router.push('/dashboard/subscription')}
                              >
                                Passer au plan supérieur
                              </button>
                            </span>
                          </div>
                        )}
                        
                        {aiUsage.current / aiUsage.limit >= 0.8 && aiUsage.current < aiUsage.limit && (
                          <div className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              Proche de la limite mensuelle ({Math.round((aiUsage.current / aiUsage.limit) * 100)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Free Plan Upgrade Prompt */}
                {subscription && subscription.planDetails && aiUsage.limit === 0 && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-800 mb-1">
                          Génération IA non disponible
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          Passez au plan Starter pour débloquer la génération automatique de plans alimentaires par IA.
                        </p>
                        <button
                          onClick={() => router.push('/dashboard/subscription')}
                          className="text-xs font-medium text-purple-600 hover:text-purple-700 underline"
                        >
                          Découvrir les plans →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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


          </div>
          {/* Results Panel */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
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
                      
                      {/* PDF Export Tip */}
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-600 text-xs font-semibold">💡</span>
                          </div>
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Pour exporter en PDF :</span> Utilisez "Sauvegarder seulement" ou "Sauvegarder et activer pour le client" puis exportez en PDF dans la page du plan alimentaire.
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveAsTemplate}
                          disabled={isSavingTemplate || isSavingOnly || isSendingToClient}
                          className="bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300 hover:scale-105 transition-all duration-200 disabled:hover:scale-100"
                        >
                          {isSavingTemplate ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                              Sauvegarde...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Sauvegarder le modèle</span>
                              <span className="sm:hidden">Modèle</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveOnly}
                          disabled={isSavingOnly || isSendingToClient}
                          className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-300 hover:border-gray-400 hover:scale-105 transition-all duration-200 disabled:hover:scale-100"
                        >
                          {isSavingOnly ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                              Sauvegarde...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Sauvegarder seulement</span>
                              <span className="sm:hidden">Sauvegarder</span>
                            </>
                          )}
                        </Button>
                        {hasClientAccount && (
                          <Button
                            size="sm"
                            onClick={handleSendToClient}
                            disabled={!formData.clientId || isSendingToClient || isSavingOnly}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all duration-200 disabled:hover:scale-100"
                          >
                            {isSendingToClient ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                En cours...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Sauvegarder et Activer pour le client</span>
                                <span className="sm:hidden">Activer</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Nutrition Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: "Jours", value: generatedPlan.duration, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
                        { label: "Calories/Jour", value: generatedPlan.nutritionalGoals?.dailyCalories || 'N/A', icon: Flame, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", suffix: "kcal" },
                        { label: "Protéines %", value: `${generatedPlan.nutritionalGoals?.proteinPercentage || 'N/A'}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
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
                                      <div className="font-semibold text-orange-600">{day.totalCarbs}g</div>
                                      <div className="text-gray-500">glucides</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-semibold text-purple-600">{day.totalFat}g</div>
                                      <div className="text-gray-500">lipides</div>
                                    </div>
                                  </div>
                                  <div className="lg:hidden text-sm text-gray-600">
                                    {day.totalCalories} cal • {day.totalCarbs}g glucides • {day.totalFat}g lipides
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
                          <div className="absolute left-4 sm:left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
                          
                          <div className="space-y-8">
                            {generatedPlan.days.map((day, dayIndex) => (
                              <div key={day.day} className="relative">
                                {/* Timeline dot */}
                                <div className="absolute left-2 sm:left-6 w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-4 border-white shadow-lg"></div>
                                
                                <div className="ml-8 sm:ml-16 space-y-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900">Jour {day.day}</h3>
                                      <p className="text-sm text-gray-500">{day.date}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className="text-green-600 font-medium">{day.totalCalories} cal</span>
                                      <span className="text-orange-600 font-medium">{day.totalCarbs}g glucides</span>
                                      <span className="text-purple-600 font-medium">{day.totalFat}g lipides</span>
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
                                      <div key={mealIndex} className={`p-4 rounded-lg border-2 ${mealData.color} hover:shadow-md transition-all`}>
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-3">
                                            <div className="text-sm font-medium text-gray-700">{mealData.time}</div>
                                            <div className="text-sm font-semibold text-gray-900">{mealData.type}</div>
                                          </div>
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 mb-1">{mealData.meal.name}</div>
                                        <div className="text-xs text-gray-600 mb-2">{mealData.meal.description}</div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                          <span>{mealData.meal.calories} cal</span>
                                          <span>{mealData.meal.protein}g protéines</span>
                                          <span>{(mealData.meal.prepTime || 0) + (mealData.meal.cookTime || 0)} min</span>
                                        </div>
                                      </div>
                                    ))
                                    })()}
                                    
                                    {/* Snacks */}
                                    {getMealsByType(day.meals).snacks.map((snack, snackIndex) => (
                                      <div key={snackIndex} className="p-3 rounded-lg border-2 bg-cyan-50 border-cyan-200 hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-3">
                                            <div className="text-sm font-medium text-gray-700">{snackIndex === 0 ? '15:00' : '21:00'}</div>
                                            <div className="text-sm font-semibold text-gray-900">Collation {snackIndex + 1}</div>
                                          </div>
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 mb-1">{snack.name}</div>
                                        <div className="text-xs text-gray-600 mb-2">{snack.description}</div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                          <span>{snack.calories} cal</span>
                                          <span>{snack.protein}g protéines</span>
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
                                  <span className="text-orange-600 font-medium">{day.totalCarbs}g glucides</span>
                                  <span className="text-purple-600 font-medium">{day.totalFat}g lipides</span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
                                  <div key={mealIndex} className={`bg-white rounded-md p-3 border-l-4 ${mealData.color} hover:shadow-sm transition-all`}>
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="text-sm font-medium text-gray-900">{mealData.type}</div>
                                    </div>
                                    <div className="text-xs font-medium text-gray-800 mb-1 line-clamp-1">{mealData.meal.name}</div>
                                    <div className="text-xs text-gray-600 mb-2 line-clamp-2">{mealData.meal.description}</div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>{mealData.meal.calories} cal</span>
                                      <span>{mealData.meal.protein}g protéines</span>
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

                  </CardContent>
                </Card>

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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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


      {/* Progress Modal */}
      {(isSendingToClient || isSavingOnly || isSavingTemplate) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isSendingToClient ? "Envoi au client en cours..." : 
                 isSavingTemplate ? "Création du modèle en cours..." : 
                 "Sauvegarde en cours..."}
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                {sendingStep}
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${sendingProgress}%` }}
                />
              </div>
              
              <div className="text-xs text-gray-500">
                {sendingProgress}% terminé
              </div>
            </div>
          </div>
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
  gradientFrom, 
  gradientTo 
}: { 
  meal: Meal
  mealType: string
  icon: React.ReactNode
  gradientFrom: string
  gradientTo: string
}) {
  return (
    <div className="relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-0.5">
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
            <span className="font-medium">{meal.protein}g protéines</span>
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
