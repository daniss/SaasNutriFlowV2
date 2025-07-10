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
import { generateMealPlan, type GeneratedMealPlan, type Meal } from "@/lib/gemini"
import { useAuth } from "@/hooks/useAuthNew"
import { supabase, type Client } from "@/lib/supabase"
import jsPDF from "jspdf"

export default function GenerateMealPlanPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealPlan | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [editingMeal, setEditingMeal] = useState<{ dayIndex: number; mealType: string; meal: Meal } | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [lastSubmission, setLastSubmission] = useState<number>(0)
  const [validationError, setValidationError] = useState<string>("")
  const [planFeedback, setPlanFeedback] = useState<{ planId: string; rating: 'good' | 'bad' | null }>({ planId: '', rating: null })
  const [viewMode, setViewMode] = useState<'cards' | 'timeline' | 'compact'>('cards')
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]))
  const [quickPresets, setQuickPresets] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    prompt: "",
    planName: "",
    clientId: "",
    duration: 7,
    targetCalories: 2000,
    dietType: "balanced",
    goals: "",
    restrictions: [] as string[],
  })

  // Quick preset prompts for inspiration
  const presetPrompts = [
    "7-day Mediterranean diet plan for heart health with 1800 calories per day",
    "Weight loss meal plan with intermittent fasting (16:8) and high protein",
    "Plant-based athlete nutrition plan for muscle building (2500 calories)",
    "Anti-inflammatory meal plan for joint health with omega-3 rich foods",
    "Diabetic-friendly meal plan with low glycemic index foods (1600 calories)",
    "Family-friendly meal prep plan with batch cooking options",
  ]

  // Anti-abuse validation
  const validatePrompt = (prompt: string): string | null => {
    if (!prompt.trim()) return "Please enter a meal plan description"
    if (prompt.length < 10) return "Please provide more details (at least 10 characters)"
    if (prompt.length > 1000) return "Please keep your request under 1000 characters"
    
    // Check for offensive content (basic keywords)
    const offensiveWords = ['spam', 'hack', 'illegal', 'drug', 'weapon']
    const lowerPrompt = prompt.toLowerCase()
    if (offensiveWords.some(word => lowerPrompt.includes(word))) {
      return "Please ensure your request is related to meal planning"
    }
    
    // Check if it's meal/nutrition related
    const nutritionKeywords = ['meal', 'diet', 'food', 'nutrition', 'calorie', 'protein', 'carb', 'fat', 'vegetarian', 'vegan', 'keto', 'weight', 'healthy', 'breakfast', 'lunch', 'dinner', 'snack', 'plan']
    if (!nutritionKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      return "Please describe a meal plan or nutrition-related request"
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

  const handleRestrictionToggle = (restriction: string) => {
    setFormData((prev) => ({
      ...prev,
      restrictions: prev.restrictions.includes(restriction)
        ? prev.restrictions.filter((r) => r !== restriction)
        : [...prev.restrictions, restriction],
    }))
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
      setValidationError(`Please wait ${getCooldownTimeLeft()} seconds before generating again`)
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
        clientId: formData.selectedClient || undefined,
        duration: parseInt(formData.duration) || 7,
        targetCalories: parseInt(formData.targetCalories) || 2000,
        dietType: formData.dietType,
        restrictions: formData.restrictions,
        goals: formData.goals
      }

      const plan: GeneratedMealPlan = await generateMealPlan(mealPlanRequest)

      setGenerationProgress(100)
      setTimeout(() => {
        setGeneratedPlan(plan)
        setPlanFeedback({ planId: plan.name + Date.now(), rating: null })
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

  const handleEditMeal = (dayIndex: number, mealType: string, meal: Meal) => {
    setEditingMeal({ dayIndex, mealType, meal: { ...meal } })
  }

  const handleSaveEdit = () => {
    if (!editingMeal || !generatedPlan) return

    const updatedPlan = { ...generatedPlan }
    const dayPlan = updatedPlan.days[editingMeal.dayIndex]

    if (editingMeal.mealType === "snacks") {
      // For snacks, we'll update the first snack for simplicity
      dayPlan.meals.snacks[0] = editingMeal.meal
    } else {
      // Type assertion to fix the type issue
      (dayPlan.meals as any)[editingMeal.mealType] = editingMeal.meal
    }

    // Recalculate daily totals
    const meals = dayPlan.meals
    dayPlan.totalCalories =
      meals.breakfast.calories +
      meals.lunch.calories +
      meals.dinner.calories +
      meals.snacks.reduce((sum, snack) => sum + snack.calories, 0)
    dayPlan.totalProtein =
      meals.breakfast.protein +
      meals.lunch.protein +
      meals.dinner.protein +
      meals.snacks.reduce((sum, snack) => sum + snack.protein, 0)
    dayPlan.totalCarbs =
      meals.breakfast.carbs +
      meals.lunch.carbs +
      meals.dinner.carbs +
      meals.snacks.reduce((sum, snack) => sum + snack.carbs, 0)
    dayPlan.totalFat =
      meals.breakfast.fat + meals.lunch.fat + meals.dinner.fat + meals.snacks.reduce((sum, snack) => sum + snack.fat, 0)
    dayPlan.totalFiber =
      meals.breakfast.fiber +
      meals.lunch.fiber +
      meals.dinner.fiber +
      meals.snacks.reduce((sum, snack) => sum + snack.fiber, 0)

    setGeneratedPlan(updatedPlan)
    setEditingMeal(null)
  }

  const handleSaveAsTemplate = async () => {
    if (!generatedPlan || !user) return

    try {
      // Save to meal_plan_templates table
      const { error } = await supabase.from("meal_plan_templates").insert({
        dietitian_id: user.id,
        name: formData.planName || generatedPlan.name,
        description: generatedPlan.description || '',
        category: formData.goals || 'general',
        duration_days: generatedPlan.duration,
        template_data: generatedPlan,
        tags: [formData.goals, ...formData.restrictions].filter(Boolean),
        usage_count: 0,
        is_favorite: false,
      })

      if (error) throw error
      alert("Plan alimentaire sauvegardé comme modèle avec succès!")
    } catch (error) {
      console.error("Error saving template:", error)
      alert("Échec de la sauvegarde du modèle. Veuillez réessayer.")
    }
  }

  const handleSendToClient = async () => {
    if (!generatedPlan || !formData.clientId) {
      alert("Please select a client first")
      return
    }

    try {
      const { error } = await supabase.from("meal_plans").insert({
        dietitian_id: user!.id,
        client_id: formData.clientId,
        name: formData.planName || generatedPlan.name,
        description: generatedPlan.description,
        duration_days: generatedPlan.duration,
        plan_content: generatedPlan,
        status: "Active",
      })

      if (error) throw error
      alert("Meal plan sent to client successfully!")
    } catch (error) {
      console.error("Error sending to client:", error)
      alert("Failed to send to client. Please try again.")
    }
  }

  const handleExportPdf = async () => {
    if (!generatedPlan) return

    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const margin = 20
      const contentWidth = pageWidth - (margin * 2)
      let yPosition = margin

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
        pdf.setFontSize(fontSize)
        const lines = pdf.splitTextToSize(text, maxWidth)
        pdf.text(lines, x, y)
        return y + (lines.length * fontSize * 0.4) // Return new Y position
      }

      // Header
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      yPosition = addText(generatedPlan.name, margin, yPosition, contentWidth, 24)
      yPosition += 10

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      yPosition = addText(generatedPlan.description, margin, yPosition, contentWidth, 12)
      yPosition += 15

      // Summary stats
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      yPosition = addText('Plan Overview', margin, yPosition, contentWidth, 14)
      yPosition += 5

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      const stats = [
        `Duration: ${generatedPlan.duration} days`,
        `Target Calories: ${generatedPlan.targetCalories}/day`,
        `Average Protein: ${generatedPlan.nutritionSummary.avgProtein}g`,
        `Average Fiber: ${generatedPlan.nutritionSummary.avgFiber}g`
      ]
      
      stats.forEach(stat => {
        yPosition = addText(`• ${stat}`, margin, yPosition, contentWidth, 10)
        yPosition += 2
      })
      yPosition += 10

      // Days
      for (const day of generatedPlan.days) {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          pdf.addPage()
          yPosition = margin
        }

        // Day header
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        yPosition = addText(`Day ${day.day} - ${day.date}`, margin, yPosition, contentWidth, 16)
        yPosition += 3

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        yPosition = addText(`Total: ${day.totalCalories} cal, ${day.totalProtein}g protein`, margin, yPosition, contentWidth, 10)
        yPosition += 8

        // Meals
        const meals = [
          { name: 'Breakfast', data: day.meals.breakfast },
          { name: 'Lunch', data: day.meals.lunch },
          { name: 'Dinner', data: day.meals.dinner }
        ]

        meals.forEach(meal => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage()
            yPosition = margin
          }

          // Meal name
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'bold')
          yPosition = addText(meal.name, margin + 5, yPosition, contentWidth - 5, 12)
          yPosition += 2

          // Meal details
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          yPosition = addText(meal.data.name, margin + 10, yPosition, contentWidth - 10, 9)
          yPosition += 2

          pdf.setFont('helvetica', 'normal')
          yPosition = addText(meal.data.description, margin + 10, yPosition, contentWidth - 10, 9)
          yPosition += 2

          const nutrition = `${meal.data.calories} cal • ${meal.data.protein}g protein • ${meal.data.carbs}g carbs • ${meal.data.fat}g fat`
          yPosition = addText(nutrition, margin + 10, yPosition, contentWidth - 10, 8)
          yPosition += 6
        })

        // Snacks
        if (day.meals.snacks && day.meals.snacks.length > 0) {
          day.meals.snacks.forEach((snack, index) => {
            if (yPosition > pageHeight - 30) {
              pdf.addPage()
              yPosition = margin
            }

            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            yPosition = addText(`Snack ${index + 1}`, margin + 5, yPosition, contentWidth - 5, 12)
            yPosition += 2

            pdf.setFontSize(9)
            pdf.setFont('helvetica', 'bold')
            yPosition = addText(snack.name, margin + 10, yPosition, contentWidth - 10, 9)
            yPosition += 2

            pdf.setFont('helvetica', 'normal')
            yPosition = addText(snack.description, margin + 10, yPosition, contentWidth - 10, 9)
            yPosition += 2

            const nutrition = `${snack.calories} cal • ${snack.protein}g protein • ${snack.carbs}g carbs • ${snack.fat}g fat`
            yPosition = addText(nutrition, margin + 10, yPosition, contentWidth - 10, 8)
            yPosition += 6
          })
        }

        yPosition += 5
      }

      // Shopping List
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = margin
      }

      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      yPosition = addText('Shopping List', margin, yPosition, contentWidth, 16)
      yPosition += 8

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      generatedPlan.shoppingList.forEach(item => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage()
          yPosition = margin
        }
        yPosition = addText(`• ${item}`, margin, yPosition, contentWidth, 10)
        yPosition += 3
      })

      // Notes
      if (generatedPlan.notes && generatedPlan.notes.length > 0) {
        yPosition += 10
        if (yPosition > pageHeight - 60) {
          pdf.addPage()
          yPosition = margin
        }

        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        yPosition = addText('Tips & Notes', margin, yPosition, contentWidth, 16)
        yPosition += 8

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        generatedPlan.notes.forEach(note => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage()
            yPosition = margin
          }
          yPosition = addText(`• ${note}`, margin, yPosition, contentWidth, 10)
          yPosition += 5
        })
      }

      // Save the PDF
      const fileName = `${generatedPlan.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_meal_plan.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  const commonRestrictions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Nut-Free",
    "Low-Sodium",
    "Low-Carb",
    "Keto",
    "Paleo",
    "Mediterranean",
  ]

  const dietTypes = [
    { value: "balanced", label: "Balanced" },
    { value: "weight-loss", label: "Weight Loss" },
    { value: "weight-gain", label: "Weight Gain" },
    { value: "muscle-building", label: "Muscle Building" },
    { value: "heart-healthy", label: "Heart Healthy" },
    { value: "diabetic", label: "Diabetic Friendly" },
  ]

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
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Quick Start</Label>
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

            {/* Configuration Panel */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Settings className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Plan Configuration</CardTitle>
                    <CardDescription className="text-sm">Fine-tune your requirements</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100/50">
                    <TabsTrigger value="basic" className="text-sm">Basic</TabsTrigger>
                    <TabsTrigger value="advanced" className="text-sm">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="planName" className="text-sm font-medium">Plan Name</Label>
                        <Input
                          id="planName"
                          placeholder="e.g., Sarah's Plan"
                          value={formData.planName}
                          onChange={(e) => handleInputChange("planName", e.target.value)}
                          className="mt-1 border-gray-200 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="client" className="text-sm font-medium">Client</Label>
                        <Select value={formData.clientId} onValueChange={(value: string) => handleInputChange("clientId", value)}>
                          <SelectTrigger className="mt-1 border-gray-200 focus:border-blue-500">
                            <SelectValue placeholder="Select client" />
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
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Duration</Label>
                        <Select
                          value={formData.duration.toString()}
                          onValueChange={(value: string) => handleInputChange("duration", Number.parseInt(value))}
                        >
                          <SelectTrigger className="mt-1 border-gray-200 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[3, 7, 14, 21, 30].map((days) => (
                              <SelectItem key={days} value={days.toString()}>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  {days} Days
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Calories/Day</Label>
                        <div className="relative mt-1">
                          <Input
                            type="number"
                            value={formData.targetCalories}
                            onChange={(e) => handleInputChange("targetCalories", Number.parseInt(e.target.value))}
                            min="1000"
                            max="4000"
                            step="50"
                            className="border-gray-200 focus:border-blue-500 pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">kcal</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Diet Type</Label>
                        <Select value={formData.dietType} onValueChange={(value: string) => handleInputChange("dietType", value)}>
                          <SelectTrigger className="mt-1 border-gray-200 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {dietTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4 mt-4">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Dietary Restrictions</Label>
                      <div className="flex flex-wrap gap-2">
                        {commonRestrictions.map((restriction) => (
                          <Badge
                            key={restriction}
                            variant={formData.restrictions.includes(restriction) ? "default" : "outline"}
                            className="cursor-pointer transition-all hover:scale-105 text-xs"
                            onClick={() => handleRestrictionToggle(restriction)}
                          >
                            {formData.restrictions.includes(restriction) && <Check className="h-3 w-3 mr-1" />}
                            {restriction}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="goals" className="text-sm font-medium">Additional Goals & Notes</Label>
                      <Textarea
                        id="goals"
                        placeholder="e.g., Focus on anti-inflammatory foods, include meal prep options, avoid shellfish..."
                        value={formData.goals}
                        onChange={(e) => handleInputChange("goals", e.target.value)}
                        rows={3}
                        className="mt-1 border-gray-200 focus:border-blue-500 resize-none"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Perfect Meal Plan</h3>
                      <p className="text-gray-600 mb-6">Our AI is analyzing your requirements and crafting personalized recipes...</p>
                      
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
                            <span>Processing nutrition data</span>
                          </div>
                          <span className="font-medium tabular-nums">{Math.round(generationProgress)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Loading skeleton */}
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      {[
                        { label: "Analyzing dietary preferences" },
                        { label: "Calculating nutrition balance" },
                        { label: "Generating meal combinations" },
                        { label: "Creating shopping list" }
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
                            {generatedPlan.name}
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
                          Save Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportPdf}
                          className="bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300 hover:scale-105 transition-all duration-200"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSendToClient}
                          disabled={!formData.clientId}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all duration-200 disabled:hover:scale-100"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send to Client
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Nutrition Overview */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: "Days", value: generatedPlan.duration, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
                        { label: "Calories/Day", value: generatedPlan.targetCalories, icon: Flame, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", suffix: "kcal" },
                        { label: "Avg Protein", value: `${generatedPlan.nutritionSummary.avgProtein}g`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
                        { label: "Avg Fiber", value: `${generatedPlan.nutritionSummary.avgFiber}g`, icon: Leaf, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
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
                        <Label className="text-sm font-medium text-gray-700">View Mode:</Label>
                        <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                          {[
                            { mode: 'cards', icon: Grid, label: 'Cards' },
                            { mode: 'timeline', icon: List, label: 'Timeline' },
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
                        <span className="text-sm text-gray-600">How is this plan?</span>
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
                                      <div className="font-semibold text-gray-900">Day {day.day}</div>
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
                                      <div className="text-gray-500">protein</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-semibold text-orange-600">{day.totalFiber}g</div>
                                      <div className="text-gray-500">fiber</div>
                                    </div>
                                  </div>
                                  <div className="lg:hidden text-sm text-gray-600">
                                    {day.totalCalories} cal • {day.totalProtein}g protein
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                <div className="grid gap-4 mt-4">
                                  {/* Breakfast */}
                                  <MealCard
                                    meal={day.meals.breakfast}
                                    mealType="Breakfast"
                                    icon={<Utensils className="h-4 w-4" />}
                                    onEdit={() => handleEditMeal(dayIndex, "breakfast", day.meals.breakfast)}
                                    gradientFrom="from-yellow-400"
                                    gradientTo="to-orange-500"
                                  />
                                  
                                  {/* Lunch */}
                                  <MealCard
                                    meal={day.meals.lunch}
                                    mealType="Lunch"
                                    icon={<Utensils className="h-4 w-4" />}
                                    onEdit={() => handleEditMeal(dayIndex, "lunch", day.meals.lunch)}
                                    gradientFrom="from-green-400"
                                    gradientTo="to-emerald-500"
                                  />
                                  
                                  {/* Dinner */}
                                  <MealCard
                                    meal={day.meals.dinner}
                                    mealType="Dinner"
                                    icon={<Utensils className="h-4 w-4" />}
                                    onEdit={() => handleEditMeal(dayIndex, "dinner", day.meals.dinner)}
                                    gradientFrom="from-purple-400"
                                    gradientTo="to-pink-500"
                                  />
                                  
                                  {/* Snacks */}
                                  {day.meals.snacks.map((snack, snackIndex) => (
                                    <MealCard
                                      key={snackIndex}
                                      meal={snack}
                                      mealType={`Snack ${snackIndex + 1}`}
                                      icon={<Utensils className="h-4 w-4" />}
                                      onEdit={() => handleEditMeal(dayIndex, "snacks", snack)}
                                      gradientFrom="from-cyan-400"
                                      gradientTo="to-blue-500"
                                    />
                                  ))}
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
                                      <h3 className="text-lg font-semibold text-gray-900">Day {day.day}</h3>
                                      <p className="text-sm text-gray-500">{day.date}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className="text-green-600 font-medium">{day.totalCalories} cal</span>
                                      <span className="text-blue-600 font-medium">{day.totalProtein}g protein</span>
                                    </div>
                                  </div>
                                  
                                  <div className="grid gap-3">
                                    {/* Meals in timeline format */}
                                    {[
                                      { meal: day.meals.breakfast, type: 'Breakfast', time: '8:00 AM', color: 'bg-yellow-100 border-yellow-300' },
                                      { meal: day.meals.lunch, type: 'Lunch', time: '12:30 PM', color: 'bg-green-100 border-green-300' },
                                      { meal: day.meals.dinner, type: 'Dinner', time: '7:00 PM', color: 'bg-purple-100 border-purple-300' },
                                    ].map((mealData, mealIndex) => (
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
                                          <span>{mealData.meal.protein}g protein</span>
                                          <span>{mealData.meal.prepTime + mealData.meal.cookTime} min</span>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {/* Snacks */}
                                    {day.meals.snacks.map((snack, snackIndex) => (
                                      <div key={snackIndex} className="p-3 rounded-lg border-2 bg-cyan-50 border-cyan-200 group hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-3">
                                            <div className="text-sm font-medium text-gray-700">{snackIndex === 0 ? '3:00 PM' : '9:00 PM'}</div>
                                            <div className="text-sm font-semibold text-gray-900">Snack {snackIndex + 1}</div>
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
                                          <span>{snack.protein}g protein</span>
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
                                    <div className="font-semibold text-gray-900">Day {day.day}</div>
                                    <div className="text-sm text-gray-500">{day.date}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-green-600 font-medium">{day.totalCalories} cal</span>
                                  <span className="text-blue-600 font-medium">{day.totalProtein}g protein</span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                {[
                                  { meal: day.meals.breakfast, type: 'Breakfast', color: 'border-l-yellow-500' },
                                  { meal: day.meals.lunch, type: 'Lunch', color: 'border-l-green-500' },
                                  { meal: day.meals.dinner, type: 'Dinner', color: 'border-l-purple-500' },
                                  ...(day.meals.snacks.map((snack, idx) => ({ meal: snack, type: `Snack ${idx + 1}`, color: 'border-l-cyan-500' })))
                                ].map((mealData, mealIndex) => (
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
                                      <span>{mealData.meal.protein}g protein</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
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
                        Shopping List
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {generatedPlan.shoppingList.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                              <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center hover:border-green-500 transition-colors cursor-pointer">
                                <Check className="h-3 w-3 text-green-500 opacity-0 hover:opacity-100" />
                              </div>
                              <span className="text-sm text-gray-700">{item}</span>
                            </div>
                          ))}
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
                        Tips & Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {generatedPlan.notes.map((note, index) => (
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
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Create Magic?</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                      Fill out your meal plan requirements and let our AI create a personalized nutrition plan tailored to your exact needs.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-6 mb-8">
                      {[
                        { 
                          icon: Target, 
                          label: "AI-Powered", 
                          description: "Smart nutrition analysis",
                          color: "text-blue-600",
                          bg: "bg-blue-50",
                          border: "border-blue-200"
                        },
                        { 
                          icon: Users, 
                          label: "Personalized", 
                          description: "Tailored to each client",
                          color: "text-green-600",
                          bg: "bg-green-50",
                          border: "border-green-200"
                        },
                        { 
                          icon: Clock, 
                          label: "Instant Results", 
                          description: "Generated in seconds",
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
                        <span>Ready to generate</span>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <span>Start by describing your vision above ↖</span>
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
                  <CardTitle className="text-xl">Edit Meal</CardTitle>
                  <CardDescription>Customize this meal to better fit your needs</CardDescription>
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
                  <Label htmlFor="mealName" className="text-sm font-medium">Meal Name</Label>
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
                  { key: 'protein', label: 'Protein', suffix: 'g' },
                  { key: 'carbs', label: 'Carbs', suffix: 'g' },
                  { key: 'fat', label: 'Fat', suffix: 'g' },
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
                  <Label className="text-sm font-medium">Prep Time (min)</Label>
                  <Input
                    type="number"
                    value={editingMeal.meal.prepTime}
                    onChange={(e) =>
                      setEditingMeal((prev) =>
                        prev
                          ? {
                              ...prev,
                              meal: { ...prev.meal, prepTime: Number.parseInt(e.target.value) || 0 },
                            }
                          : null,
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Cook Time (min)</Label>
                  <Input
                    type="number"
                    value={editingMeal.meal.cookTime}
                    onChange={(e) =>
                      setEditingMeal((prev) =>
                        prev
                          ? {
                              ...prev,
                              meal: { ...prev.meal, cookTime: Number.parseInt(e.target.value) || 0 },
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
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
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
              <span>{meal.prepTime + meal.cookTime} min total</span>
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
            <span className="font-medium">{meal.protein}g protein</span>
          </div>
          <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
            <PieChart className="h-3 w-3" />
            <span className="font-medium">{meal.carbs}g carbs</span>
          </div>
          <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
            <Globe className="h-3 w-3" />
            <span className="font-medium">{meal.fat}g fat</span>
          </div>
        </div>
      </div>
      
      {/* Hover overlay for better visual feedback */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
    </div>
  )
}
