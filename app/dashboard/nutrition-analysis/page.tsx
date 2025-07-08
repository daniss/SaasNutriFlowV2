"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
    Activity,
    BarChart3,
    Brain,
    Calculator,
    Droplets,
    Flame,
    Heart,
    Leaf,
    Plus,
    Search,
    Shield,
    Target,
    TrendingUp
} from "lucide-react"
import { useState } from "react"

interface NutritionalInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  calcium: number
  iron: number
  vitaminC: number
}

interface FoodItem {
  name: string
  serving: string
  nutrition: NutritionalInfo
  category: string
}

interface MacroCalculation {
  bmr: number
  tdee: number
  protein: number
  carbs: number
  fat: number
  calories: number
}

const SAMPLE_FOODS: FoodItem[] = [
  {
    name: "Blanc de poulet grillé",
    serving: "100g",
    nutrition: {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sugar: 0,
      sodium: 74,
      calcium: 15,
      iron: 0.9,
      vitaminC: 0
    },
    category: "Protéines"
  },
  {
    name: "Avocat",
    serving: "1 moyen (150g)",
    nutrition: {
      calories: 234,
      protein: 2.9,
      carbs: 12.8,
      fat: 21.4,
      fiber: 10,
      sugar: 0.7,
      sodium: 7,
      calcium: 18,
      iron: 0.9,
      vitaminC: 15
    },
    category: "Fruits"
  },
  {
    name: "Riz brun cuit",
    serving: "100g",
    nutrition: {
      calories: 112,
      protein: 2.6,
      carbs: 22.9,
      fat: 0.9,
      fiber: 1.8,
      sugar: 0.4,
      sodium: 5,
      calcium: 23,
      iron: 1.5,
      vitaminC: 0
    },
    category: "Céréales"
  },
  {
    name: "Épinards frais",
    serving: "100g",
    nutrition: {
      calories: 23,
      protein: 2.9,
      carbs: 3.6,
      fat: 0.4,
      fiber: 2.2,
      sugar: 0.4,
      sodium: 79,
      calcium: 99,
      iron: 2.7,
      vitaminC: 28
    },
    category: "Légumes"
  },
  {
    name: "Saumon grillé",
    serving: "100g",
    nutrition: {
      calories: 206,
      protein: 22,
      carbs: 0,
      fat: 12,
      fiber: 0,
      sugar: 0,
      sodium: 59,
      calcium: 26,
      iron: 0.9,
      vitaminC: 0
    },
    category: "Protéines"
  }
]

export default function NutritionalAnalysisPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFoods, setSelectedFoods] = useState<(FoodItem & { quantity: number })[]>([])
  const [macroForm, setMacroForm] = useState({
    age: "",
    gender: "female",
    weight: "",
    height: "",
    activityLevel: "moderate",
    goal: "maintain"
  })
  const [macroResults, setMacroResults] = useState<MacroCalculation | null>(null)
  
  const filteredFoods = SAMPLE_FOODS.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    food.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addFood = (food: FoodItem) => {
    const existing = selectedFoods.find(f => f.name === food.name)
    if (existing) {
      setSelectedFoods(selectedFoods.map(f => 
        f.name === food.name ? { ...f, quantity: f.quantity + 1 } : f
      ))
    } else {
      setSelectedFoods([...selectedFoods, { ...food, quantity: 1 }])
    }
    toast({
      title: "Aliment ajouté",
      description: `${food.name} a été ajouté à votre analyse.`
    })
  }

  const removeFood = (foodName: string) => {
    setSelectedFoods(selectedFoods.filter(f => f.name !== foodName))
  }

  const updateQuantity = (foodName: string, quantity: number) => {
    if (quantity <= 0) {
      removeFood(foodName)
      return
    }
    setSelectedFoods(selectedFoods.map(f => 
      f.name === foodName ? { ...f, quantity } : f
    ))
  }

  const calculateTotalNutrition = (): NutritionalInfo => {
    return selectedFoods.reduce((total, food) => ({
      calories: total.calories + (food.nutrition.calories * food.quantity),
      protein: total.protein + (food.nutrition.protein * food.quantity),
      carbs: total.carbs + (food.nutrition.carbs * food.quantity),
      fat: total.fat + (food.nutrition.fat * food.quantity),
      fiber: total.fiber + (food.nutrition.fiber * food.quantity),
      sugar: total.sugar + (food.nutrition.sugar * food.quantity),
      sodium: total.sodium + (food.nutrition.sodium * food.quantity),
      calcium: total.calcium + (food.nutrition.calcium * food.quantity),
      iron: total.iron + (food.nutrition.iron * food.quantity),
      vitaminC: total.vitaminC + (food.nutrition.vitaminC * food.quantity)
    }), {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
      sugar: 0, sodium: 0, calcium: 0, iron: 0, vitaminC: 0
    })
  }

  const calculateMacros = () => {
    const { age, gender, weight, height, activityLevel, goal } = macroForm
    
    if (!age || !weight || !height) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      })
      return
    }

    // BMR calculation using Mifflin-St Jeor equation
    const ageNum = parseInt(age)
    const weightNum = parseFloat(weight)
    const heightNum = parseFloat(height)
    
    let bmr: number
    if (gender === "male") {
      bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) + 5
    } else {
      bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) - 161
    }

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    }

    const tdee = bmr * activityMultipliers[activityLevel as keyof typeof activityMultipliers]

    // Goal adjustments
    let targetCalories = tdee
    if (goal === "lose") targetCalories = tdee - 500
    if (goal === "gain") targetCalories = tdee + 500

    // Macro distribution (40% carbs, 30% protein, 30% fat)
    const protein = (targetCalories * 0.3) / 4 // 4 calories per gram
    const carbs = (targetCalories * 0.4) / 4
    const fat = (targetCalories * 0.3) / 9 // 9 calories per gram

    setMacroResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calories: Math.round(targetCalories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat)
    })

    toast({
      title: "Calcul terminé",
      description: "Vos besoins nutritionnels ont été calculés avec succès."
    })
  }

  const totalNutrition = calculateTotalNutrition()

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Analyse Nutritionnelle"
        subtitle="Outils d'analyse et de calcul nutritionnel"
      />

      <div className="px-4 sm:px-6">
        <Tabs defaultValue="food-analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="food-analysis">Analyse d'Aliments</TabsTrigger>
            <TabsTrigger value="macro-calculator">Calculateur de Macros</TabsTrigger>
            <TabsTrigger value="meal-analysis">Analyse de Repas</TabsTrigger>
          </TabsList>

          {/* Food Analysis Tab */}
          <TabsContent value="food-analysis" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Food Database Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Base de Données Alimentaire
                  </CardTitle>
                  <CardDescription>
                    Recherchez et ajoutez des aliments pour analyser leur contenu nutritionnel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher un aliment..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredFoods.map((food) => (
                      <div key={food.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{food.name}</p>
                          <p className="text-sm text-slate-600">{food.serving} - {food.nutrition.calories} cal</p>
                          <Badge variant="outline" className="text-xs">
                            {food.category}
                          </Badge>
                        </div>
                        <Button size="sm" onClick={() => addFood(food)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Foods and Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Analyse Nutritionnelle
                  </CardTitle>
                  <CardDescription>
                    Aliments sélectionnés et leur valeur nutritionnelle totale
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedFoods.length === 0 ? (
                    <div className="text-center py-8">
                      <Calculator className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-600">Aucun aliment sélectionné</p>
                      <p className="text-sm text-slate-500">Ajoutez des aliments pour voir l'analyse</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedFoods.map((food) => (
                          <div key={food.name} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{food.name}</p>
                              <p className="text-xs text-slate-600">{food.serving}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={food.quantity}
                                onChange={(e) => updateQuantity(food.name, parseInt(e.target.value) || 0)}
                                className="w-16 h-8 text-sm"
                                min="0"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFood(food.name)}
                                className="h-8 w-8 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <h4 className="font-semibold">Totaux Nutritionnels</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">Calories: <strong>{Math.round(totalNutrition.calories)}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-red-500" />
                            <span className="text-sm">Protéines: <strong>{Math.round(totalNutrition.protein)}g</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Leaf className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Glucides: <strong>{Math.round(totalNutrition.carbs)}g</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Lipides: <strong>{Math.round(totalNutrition.fat)}g</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">Fibres: <strong>{Math.round(totalNutrition.fiber)}g</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">Sodium: <strong>{Math.round(totalNutrition.sodium)}mg</strong></span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Macro Calculator Tab */}
          <TabsContent value="macro-calculator" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Calculateur de Besoins
                  </CardTitle>
                  <CardDescription>
                    Calculez les besoins caloriques et les macronutriments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age">Âge *</Label>
                      <Input
                        id="age"
                        type="number"
                        value={macroForm.age}
                        onChange={(e) => setMacroForm({ ...macroForm, age: e.target.value })}
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Sexe</Label>
                      <select
                        id="gender"
                        value={macroForm.gender}
                        onChange={(e) => setMacroForm({ ...macroForm, gender: e.target.value })}
                        className="w-full h-10 px-3 border border-input rounded-md"
                      >
                        <option value="female">Femme</option>
                        <option value="male">Homme</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="weight">Poids (kg) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={macroForm.weight}
                        onChange={(e) => setMacroForm({ ...macroForm, weight: e.target.value })}
                        placeholder="70"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Taille (cm) *</Label>
                      <Input
                        id="height"
                        type="number"
                        value={macroForm.height}
                        onChange={(e) => setMacroForm({ ...macroForm, height: e.target.value })}
                        placeholder="170"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="activity">Niveau d'Activité</Label>
                    <select
                      id="activity"
                      value={macroForm.activityLevel}
                      onChange={(e) => setMacroForm({ ...macroForm, activityLevel: e.target.value })}
                      className="w-full h-10 px-3 border border-input rounded-md"
                    >
                      <option value="sedentary">Sédentaire (peu/pas d'exercice)</option>
                      <option value="light">Légèrement actif (exercice léger 1-3j/semaine)</option>
                      <option value="moderate">Modérément actif (exercice modéré 3-5j/semaine)</option>
                      <option value="active">Très actif (exercice intense 6-7j/semaine)</option>
                      <option value="very_active">Extrêmement actif (exercice très intense)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="goal">Objectif</Label>
                    <select
                      id="goal"
                      value={macroForm.goal}
                      onChange={(e) => setMacroForm({ ...macroForm, goal: e.target.value })}
                      className="w-full h-10 px-3 border border-input rounded-md"
                    >
                      <option value="lose">Perte de poids (-500 cal/jour)</option>
                      <option value="maintain">Maintien du poids</option>
                      <option value="gain">Prise de poids (+500 cal/jour)</option>
                    </select>
                  </div>

                  <Button onClick={calculateMacros} className="w-full">
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculer les Besoins
                  </Button>
                </CardContent>
              </Card>

              {macroResults && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Résultats
                    </CardTitle>
                    <CardDescription>
                      Vos besoins nutritionnels calculés
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Métabolisme de Base</p>
                        <p className="text-2xl font-bold text-blue-700">{macroResults.bmr}</p>
                        <p className="text-xs text-blue-600">calories/jour</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Dépense Totale</p>
                        <p className="text-2xl font-bold text-green-700">{macroResults.tdee}</p>
                        <p className="text-xs text-green-600">calories/jour</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3">Objectifs Quotidiens</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Calories</span>
                          <Badge className="bg-orange-100 text-orange-700">
                            {macroResults.calories} cal
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Protéines (30%)</span>
                          <Badge className="bg-red-100 text-red-700">
                            {macroResults.protein}g
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Glucides (40%)</span>
                          <Badge className="bg-green-100 text-green-700">
                            {macroResults.carbs}g
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Lipides (30%)</span>
                          <Badge className="bg-blue-100 text-blue-700">
                            {macroResults.fat}g
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Meal Analysis Tab */}
          <TabsContent value="meal-analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Analyse de Repas Complet
                </CardTitle>
                <CardDescription>
                  Analysez l'équilibre nutritionnel d'un repas ou d'une journée complète
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFoods.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-600 mb-2">Aucun aliment à analyser</p>
                    <p className="text-sm text-slate-500">
                      Ajoutez des aliments dans l'onglet "Analyse d'Aliments" pour voir l'analyse complète
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Macro Distribution */}
                    <div>
                      <h4 className="font-semibold mb-3">Répartition des Macronutriments</h4>
                      <div className="space-y-3">
                        {(() => {
                          const totalMacroCalories = (totalNutrition.protein * 4) + (totalNutrition.carbs * 4) + (totalNutrition.fat * 9)
                          const proteinPercent = totalMacroCalories > 0 ? (totalNutrition.protein * 4 / totalMacroCalories) * 100 : 0
                          const carbPercent = totalMacroCalories > 0 ? (totalNutrition.carbs * 4 / totalMacroCalories) * 100 : 0
                          const fatPercent = totalMacroCalories > 0 ? (totalNutrition.fat * 9 / totalMacroCalories) * 100 : 0

                          return (
                            <>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Protéines ({Math.round(proteinPercent)}%)</span>
                                  <span className="text-sm font-medium">{Math.round(totalNutrition.protein)}g</span>
                                </div>
                                <Progress value={proteinPercent} className="h-2" />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Glucides ({Math.round(carbPercent)}%)</span>
                                  <span className="text-sm font-medium">{Math.round(totalNutrition.carbs)}g</span>
                                </div>
                                <Progress value={carbPercent} className="h-2" />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Lipides ({Math.round(fatPercent)}%)</span>
                                  <span className="text-sm font-medium">{Math.round(totalNutrition.fat)}g</span>
                                </div>
                                <Progress value={fatPercent} className="h-2" />
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </div>

                    <Separator />

                    {/* Nutritional Quality Assessment */}
                    <div>
                      <h4 className="font-semibold mb-3">Évaluation Qualitative</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Fiber Assessment */}
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Leaf className="h-4 w-4 text-green-500" />
                            <span className="font-medium">Fibres</span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {totalNutrition.fiber >= 25 ? "Excellent" : 
                             totalNutrition.fiber >= 15 ? "Bon" : 
                             totalNutrition.fiber >= 5 ? "Modéré" : "Insuffisant"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {Math.round(totalNutrition.fiber)}g (recommandé: 25-35g/jour)
                          </p>
                        </div>

                        {/* Sodium Assessment */}
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">Sodium</span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {totalNutrition.sodium <= 2300 ? "Acceptable" : "Élevé"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {Math.round(totalNutrition.sodium)}mg (limite: 2300mg/jour)
                          </p>
                        </div>

                        {/* Sugar Assessment */}
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span className="font-medium">Sucres</span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {totalNutrition.sugar <= 50 ? "Acceptable" : "Élevé"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {Math.round(totalNutrition.sugar)}g (limite: 50g/jour)
                          </p>
                        </div>

                        {/* Protein Quality */}
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Protéines</span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {totalNutrition.protein >= 50 ? "Excellent" :
                             totalNutrition.protein >= 30 ? "Bon" : "Insuffisant"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {Math.round(totalNutrition.protein)}g
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
