"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart
} from "recharts"
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react"
import { type GeneratedMealPlan, type DayPlan } from "@/lib/gemini"

interface NutritionalAnalysisChartsProps {
  mealPlan: GeneratedMealPlan
  className?: string
}

const MACRO_COLORS = {
  protein: '#3B82F6',  // blue-500
  carbs: '#F97316',    // orange-500
  fat: '#8B5CF6',      // purple-500
  calories: '#10B981', // emerald-500
  fiber: '#F59E0B',    // amber-500
}

const CHART_COLORS = ['#3B82F6', '#F97316', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#14B8A6', '#8B5CF6']

export default function NutritionalAnalysisCharts({ mealPlan, className = "" }: NutritionalAnalysisChartsProps) {
  // Prepare data for charts
  const dailyData = mealPlan.days.map(day => {
    // Calculate fiber from meals - handle both object and array structures
    let totalFiber = 0
    if (day.meals && typeof day.meals === 'object') {
      if (Array.isArray(day.meals)) {
        // Array structure (legacy)
        totalFiber = day.meals.reduce((total, meal) => total + (meal.fiber || 0), 0)
      } else {
        // Object structure: { breakfast: [...], lunch: [...], etc. }
        Object.values(day.meals).forEach((mealArray: any) => {
          if (Array.isArray(mealArray)) {
            mealArray.forEach((meal: any) => {
              if (typeof meal === 'object' && meal.fiber) {
                totalFiber += meal.fiber || 0
              }
            })
          }
        })
      }
    }

    return {
      day: `J${day.day}`,
      fullDay: `Jour ${day.day}`,
      date: day.date,
      calories: day.totalCalories || 0,
      protein: day.totalProtein || 0,
      carbs: day.totalCarbs || 0,
      fat: day.totalFat || 0,
      fiber: totalFiber
    }
  })

  // Average values
  const averages = {
    calories: Math.round(dailyData.reduce((sum, day) => sum + day.calories, 0) / dailyData.length),
    protein: Math.round(dailyData.reduce((sum, day) => sum + day.protein, 0) / dailyData.length),
    carbs: Math.round(dailyData.reduce((sum, day) => sum + day.carbs, 0) / dailyData.length),
    fat: Math.round(dailyData.reduce((sum, day) => sum + day.fat, 0) / dailyData.length),
    fiber: Math.round(dailyData.reduce((sum, day) => sum + day.fiber, 0) / dailyData.length)
  }

  // Pie chart data for macro distribution
  const macroDistribution = [
    { name: 'Protéines', value: averages.protein * 4, color: MACRO_COLORS.protein },
    { name: 'Glucides', value: averages.carbs * 4, color: MACRO_COLORS.carbs },
    { name: 'Lipides', value: averages.fat * 9, color: MACRO_COLORS.fat }
  ]

  // Target vs actual comparison
  const targetMacros = mealPlan.nutritionalGoals || {
    dailyCalories: 2000,
    proteinPercentage: 25,
    carbPercentage: 45,
    fatPercentage: 30
  }

  const comparisonData = [
    {
      nutrient: 'Calories',
      target: targetMacros.dailyCalories,
      actual: averages.calories,
      unit: 'kcal',
      status: Math.abs(averages.calories - targetMacros.dailyCalories) <= targetMacros.dailyCalories * 0.1 ? 'good' : 'warning'
    },
    {
      nutrient: 'Protéines',
      target: Math.round((targetMacros.dailyCalories * targetMacros.proteinPercentage / 100) / 4),
      actual: averages.protein,
      unit: 'g',
      status: Math.abs(averages.protein - Math.round((targetMacros.dailyCalories * targetMacros.proteinPercentage / 100) / 4)) <= 10 ? 'good' : 'warning'
    },
    {
      nutrient: 'Glucides',
      target: Math.round((targetMacros.dailyCalories * targetMacros.carbPercentage / 100) / 4),
      actual: averages.carbs,
      unit: 'g',
      status: Math.abs(averages.carbs - Math.round((targetMacros.dailyCalories * targetMacros.carbPercentage / 100) / 4)) <= 15 ? 'good' : 'warning'
    },
    {
      nutrient: 'Lipides',
      target: Math.round((targetMacros.dailyCalories * targetMacros.fatPercentage / 100) / 9),
      actual: averages.fat,
      unit: 'g',
      status: Math.abs(averages.fat - Math.round((targetMacros.dailyCalories * targetMacros.fatPercentage / 100) / 9)) <= 8 ? 'good' : 'warning'
    }
  ]

  // Radar chart data for nutritional balance
  const radarData = [
    {
      subject: 'Protéines',
      A: (averages.protein * 4 / averages.calories) * 100,
      B: targetMacros.proteinPercentage,
      fullMark: 100
    },
    {
      subject: 'Glucides',
      A: (averages.carbs * 4 / averages.calories) * 100,
      B: targetMacros.carbPercentage,
      fullMark: 100
    },
    {
      subject: 'Lipides',
      A: (averages.fat * 9 / averages.calories) * 100,
      B: targetMacros.fatPercentage,
      fullMark: 100
    },
    {
      subject: 'Variété',
      A: Math.min(100, mealPlan.days.length * 15), // Assume variety increases with plan length
      B: 80,
      fullMark: 100
    },
    {
      subject: 'Fibres',
      A: Math.min(100, (averages.fiber / 25) * 100), // 25g recommended daily
      B: 100,
      fullMark: 100
    }
  ]

  // Custom tooltip components
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}{entry.unit || ''}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Analyses Nutritionnelles Professionnelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Vue d'ensemble</span>
                <span className="sm:hidden">Vue</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Tendances</span>
                <span className="sm:hidden">Trend</span>
              </TabsTrigger>
              <TabsTrigger value="balance" className="text-xs sm:text-sm">
                <span className="hidden lg:inline">Équilibre</span>
                <span className="lg:hidden">Balance</span>
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="text-xs sm:text-sm">
                <span className="hidden lg:inline">Conseils</span>
                <span className="lg:hidden">Tips</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                {/* Macro Distribution Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4" />
                      Distribution Calorique
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={macroDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {macroDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Target vs Actual Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Objectifs vs Réalisé
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nutrient" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="target" fill="#E5E7EB" name="Objectif" />
                        <Bar dataKey="actual" fill="#3B82F6" name="Réalisé" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Status Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {comparisonData.map((item) => (
                  <div key={item.nutrient} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.nutrient}</span>
                      {item.status === 'good' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {item.actual}{item.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      Objectif: {item.target}{item.unit}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              {/* Daily Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Évolution Quotidienne
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="calories" stroke={MACRO_COLORS.calories} strokeWidth={3} name="Calories" />
                      <Line type="monotone" dataKey="protein" stroke={MACRO_COLORS.protein} strokeWidth={2} name="Protéines (g)" />
                      <Line type="monotone" dataKey="carbs" stroke={MACRO_COLORS.carbs} strokeWidth={2} name="Glucides (g)" />
                      <Line type="monotone" dataKey="fat" stroke={MACRO_COLORS.fat} strokeWidth={2} name="Lipides (g)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Fiber and Micronutrients Area Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Micronutriments et Fibres</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="fiber" stackId="1" stroke={MACRO_COLORS.fiber} fill={MACRO_COLORS.fiber} fillOpacity={0.6} name="Fibres (g)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="balance" className="space-y-6">
              {/* Radar Chart for Nutritional Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Équilibre Nutritionnel Global</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar name="Actuel" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                      <Radar name="Objectif" dataKey="B" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Nutritional Quality Indicators */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{averages.fiber}g</div>
                      <div className="text-sm text-blue-800">Fibres / jour</div>
                      <Badge variant={averages.fiber >= 25 ? "default" : "secondary"} className="mt-2">
                        {averages.fiber >= 25 ? "Optimal" : "À améliorer"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((averages.protein / (averages.calories / 4)) * 100)}%
                      </div>
                      <div className="text-sm text-green-800">Protéines / Total</div>
                      <Badge variant="default" className="mt-2">Équilibré</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{mealPlan.duration}</div>
                      <div className="text-sm text-purple-800">Jours de plan</div>
                      <Badge variant="outline" className="mt-2">Personnalisé</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900">Analyse Professionnelle</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Équilibre général:</strong> Le plan présente une répartition {Math.abs(averages.calories - targetMacros.dailyCalories) <= targetMacros.dailyCalories * 0.1 ? 'équilibrée' : 'à ajuster'} des macronutriments.</p>
                      <p><strong>Apport protéique:</strong> {averages.protein >= Math.round((targetMacros.dailyCalories * targetMacros.proteinPercentage / 100) / 4) ? 'Satisfaisant' : 'Insuffisant'} pour les objectifs fixés.</p>
                      <p><strong>Fibres alimentaires:</strong> {averages.fiber >= 25 ? 'Apport optimal' : 'Augmentation recommandée'} pour une meilleure santé digestive.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-base text-green-900 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Recommandations Prioritaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      {averages.fiber < 25 && (
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <span>Augmenter l'apport en fibres avec plus de légumes et céréales complètes</span>
                        </li>
                      )}
                      {averages.protein < Math.round((targetMacros.dailyCalories * targetMacros.proteinPercentage / 100) / 4) && (
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <span>Optimiser l'apport protéique avec des sources variées</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span>Maintenir la variété alimentaire pour couvrir tous les micronutriments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span>Surveiller l'hydratation (2-2.5L d'eau par jour)</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-base text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Points de Vigilance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                        <span>Surveiller les variations caloriques entre les jours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                        <span>Évaluer la tolérance et les préférences du client</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                        <span>Ajuster selon l'activité physique et le métabolisme</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                        <span>Prévoir un suivi régulier pour les ajustements</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}