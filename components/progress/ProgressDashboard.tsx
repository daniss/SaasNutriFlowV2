"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingDown, 
  TrendingUp, 
  Target, 
  Award, 
  Calendar, 
  Scale,
  Activity,
  Brain,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"
import { useAuth } from "@/hooks/useAuthNew"
import { useToast } from "@/hooks/use-toast"
// Progress integration types
interface ProgressEntry {
  id: string
  client_id: string
  weight: number
  recorded_date: string
  notes?: string
}

interface ProgressGoal {
  id: string
  client_id: string
  target_weight: number
  target_date: string
  status: 'active' | 'completed' | 'paused'
}

interface ProgressAnalysis {
  currentWeight: number
  goalWeight: number
  progressPercentage: number
  weeklyAverage: number
  monthlyTrend: 'gaining' | 'losing' | 'stable'
  nextMilestone: {
    weight: number
    estimatedDate: string
  }
}

interface Client {
  id: string
  name: string
  email: string
  current_weight?: number
  goal_weight?: number
  goal?: string
  age?: number
  notes?: string
  dietitian_id?: string
}

interface ProgressDashboardProps {
  client: Client
  onUpdateProgress?: () => void
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ProgressDashboard({ client, onUpdateProgress }: ProgressDashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<ProgressAnalysis | null>(null)
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([])
  const [goals, setGoals] = useState<ProgressGoal[]>([])
  const [insights, setInsights] = useState<any[]>([])

  useEffect(() => {
    fetchProgressData()
  }, [client.id])

  const fetchProgressData = async () => {
    try {
      setLoading(true)
      
      // Mock progress analysis based on client data
      const mockAnalysis: ProgressAnalysis = {
        currentWeight: client.current_weight || 70,
        goalWeight: client.goal_weight || 65,
        progressPercentage: client.current_weight && client.goal_weight ? 
          Math.round(((client.current_weight - client.goal_weight) / client.current_weight) * 100) : 0,
        weeklyAverage: -0.5,
        monthlyTrend: 'losing',
        nextMilestone: {
          weight: client.goal_weight || 65,
          estimatedDate: '2024-03-15'
        }
      }

      const mockGoals: ProgressGoal[] = [
        {
          id: '1',
          client_id: client.id,
          target_weight: client.goal_weight || 65,
          target_date: '2024-06-01',
          status: 'active'
        }
      ]

      const mockHistory: ProgressEntry[] = [
        {
          id: '1',
          client_id: client.id,
          weight: client.current_weight || 70,
          recorded_date: '2024-01-01',
          notes: 'Poids initial'
        }
      ]

      setAnalysis(mockAnalysis)
      setGoals(mockGoals)
      setProgressHistory(mockHistory)
      
      // Mock insights
      setInsights([
        {
          id: '1',
          type: 'trend',
          title: 'Progression positive',
          description: 'Excellente progression dans la perte de poids',
          status: 'active',
          confidence: 0.9
        }
      ])
    } catch (error) {
      console.error('Error fetching progress data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de progression",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'losing': return <TrendingDown className="h-4 w-4 text-green-600" />
      case 'gaining': return <TrendingUp className="h-4 w-4 text-red-600" />
      case 'stable': return <Minus className="h-4 w-4 text-gray-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'losing': return 'text-green-600'
      case 'gaining': return 'text-red-600'
      case 'stable': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const formatWeight = (weight: number) => `${weight.toFixed(1)} kg`
  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée de progression
            </h3>
            <p className="text-gray-600 mb-4">
              Commencez par enregistrer le poids de votre client pour suivre sa progression.
            </p>
            <Button onClick={onUpdateProgress}>
              Enregistrer le poids
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = progressHistory.slice(0, 10).reverse().map(entry => ({
    date: formatDate(entry.recorded_date),
    weight: entry.weight,
    target: client.goal_weight || entry.weight
  }))

  const progressData = [
    { name: 'Accompli', value: analysis.progressPercentage, color: '#10b981' },
    { name: 'Restant', value: 100 - analysis.progressPercentage, color: '#e5e7eb' }
  ]

  return (
    <div className="space-y-6">
      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Poids actuel</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatWeight(analysis.currentWeight)}
                </p>
              </div>
              <Scale className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Objectif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatWeight(analysis.goalWeight)}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progression</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analysis.progressPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="flex items-center">
                <Progress value={analysis.progressPercentage} className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tendance</p>
                <div className="flex items-center gap-1">
                  {getTrendIcon(analysis.monthlyTrend)}
                  <span className={`text-sm font-medium ${getTrendColor(analysis.monthlyTrend)}`}>
                    {analysis.monthlyTrend === 'losing' ? 'En baisse' : 
                     analysis.monthlyTrend === 'gaining' ? 'En hausse' : 'Stable'}
                  </span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution du poids</CardTitle>
            <CardDescription>Suivi de la progression dans le temps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Poids"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#ef4444" 
                    strokeDasharray="5 5"
                    name="Objectif"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progression circulaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {progressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <p className="text-2xl font-bold text-gray-900">
                {analysis.progressPercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">de l'objectif atteint</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
          <TabsTrigger value="goals">Objectifs</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Perte hebdomadaire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {Math.abs(analysis.weeklyAverage).toFixed(1)} kg
                  </span>
                  {analysis.weeklyAverage < 0 ? (
                    <TrendingDown className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Moyenne par semaine
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prochaine étape</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">
                    {formatWeight(analysis.nextMilestone.weight)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Estimé pour le {formatDate(analysis.nextMilestone.estimatedDate)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score d'efficacité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      85
                    </span>
                    <span className="text-gray-600">/100</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4">
            {goals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucun objectif défini
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Définissez des objectifs spécifiques pour mieux suivre la progression.
                    </p>
                    <Button>
                      Créer un objectif
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              goals.map((goal) => (
                <Card key={goal.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          Objectif de poids
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Objectif: {goal.target_weight} kg
                        </p>
                        <p className="text-sm text-gray-600">
                          Échéance: {formatDate(goal.target_date)}
                        </p>
                      </div>
                      <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
                        {goal.status === 'active' ? 'En cours' :
                         goal.status === 'completed' ? 'Atteint' :
                         goal.status === 'paused' ? 'En pause' : 'Annulé'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucun insight disponible
                    </h3>
                    <p className="text-gray-600">
                      Plus de données sont nécessaires pour générer des insights personnalisés.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              insights.map((insight) => (
                <Card key={insight.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {insight.type === 'trend' ? (
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        ) : insight.type === 'achievement' ? (
                          <Award className="h-5 w-5 text-green-600" />
                        ) : insight.type === 'alert' ? (
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        ) : (
                          <Brain className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {insight.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            Confiance: {(insight.confidence * 100).toFixed(0)}%
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {insight.status === 'active' ? 'Actif' : 'Traité'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}