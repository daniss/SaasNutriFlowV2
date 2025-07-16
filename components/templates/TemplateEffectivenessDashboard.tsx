"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Users, 
  Scale,
  Activity,
  Clock,
  Star,
  BarChart3,
  Filter,
  RefreshCw,
  Download,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TemplateEffectiveness {
  template_id: string
  template_name: string
  template_category: string
  template_client_type?: string
  template_goal_type?: string
  template_rating: number
  template_usage_count: number
  client_count: number
  success_rate: number
  average_weight_loss: number
  average_duration: number
  client_satisfaction: number
  dropout_rate: number
}

interface TemplateAnalytics {
  summary: {
    total_templates: number
    total_usage: number
    average_rating: number
    overall_success_rate: number
    average_weight_loss: number
    average_duration: number
    total_clients: number
    timeframe: string
  }
  category_breakdown: Record<string, {
    count: number
    usage: number
    averageRating: number
    averageUsage: number
    successRate: number
    averageWeightLoss: number
  }>
  top_templates: TemplateEffectiveness[]
  usage_trends: Array<{
    date: string
    usage: number
    success_rate: number
  }>
  effectiveness_distribution: {
    high_performers: number
    medium_performers: number
    low_performers: number
  }
}

interface TemplateEffectivenessDashboardProps {
  dietitianId: string
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function TemplateEffectivenessDashboard({ dietitianId }: TemplateEffectivenessDashboardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [effectiveness, setEffectiveness] = useState<TemplateEffectiveness[]>([])
  const [analytics, setAnalytics] = useState<TemplateAnalytics | null>(null)
  const [timeframe, setTimeframe] = useState('30days')
  const [category, setCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'success_rate' | 'usage' | 'rating' | 'weight_loss'>('success_rate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchData()
  }, [timeframe, category])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch effectiveness data
      const effectivenessParams = new URLSearchParams()
      if (category !== 'all') effectivenessParams.append('category', category)
      
      const effectivenessResponse = await fetch(`/api/templates/effectiveness?${effectivenessParams}`)
      
      // Fetch analytics data
      const analyticsParams = new URLSearchParams({ timeframe })
      if (category !== 'all') analyticsParams.append('category', category)
      
      const analyticsResponse = await fetch(`/api/analytics/templates?${analyticsParams}`)

      if (effectivenessResponse.ok && analyticsResponse.ok) {
        const effectivenessData = await effectivenessResponse.json()
        const analyticsData = await analyticsResponse.json()
        
        setEffectiveness(effectivenessData.effectiveness)
        setAnalytics(analyticsData)
      } else {
        throw new Error('Failed to fetch data')
      }
    } catch (error) {
      console.error('Error fetching template effectiveness:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'efficacité",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchData()
  }

  const sortedEffectiveness = [...effectiveness].sort((a, b) => {
    let aValue: number
    let bValue: number
    
    switch (sortBy) {
      case 'success_rate':
        aValue = a.success_rate
        bValue = b.success_rate
        break
      case 'usage':
        aValue = a.template_usage_count
        bValue = b.template_usage_count
        break
      case 'rating':
        aValue = a.template_rating
        bValue = b.template_rating
        break
      case 'weight_loss':
        aValue = a.average_weight_loss
        bValue = b.average_weight_loss
        break
      default:
        aValue = a.success_rate
        bValue = b.success_rate
    }
    
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
  })

  const getPerformanceColor = (successRate: number) => {
    if (successRate >= 80) return 'text-green-600 bg-green-50'
    if (successRate >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getPerformanceLabel = (successRate: number) => {
    if (successRate >= 80) return 'Excellent'
    if (successRate >= 60) return 'Bon'
    return 'À améliorer'
  }

  const formatNumber = (num: number, decimals: number = 1) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

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

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée disponible
            </h3>
            <p className="text-gray-600 mb-4">
              Commencez par utiliser des templates pour voir les statistiques d'efficacité.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const distributionData = [
    { name: 'Excellents (≥80%)', value: analytics.effectiveness_distribution.high_performers, color: '#10b981' },
    { name: 'Bons (60-79%)', value: analytics.effectiveness_distribution.medium_performers, color: '#f59e0b' },
    { name: 'À améliorer (<60%)', value: analytics.effectiveness_distribution.low_performers, color: '#ef4444' }
  ]

  const categoryData = Object.entries(analytics.category_breakdown).map(([name, data]) => ({
    name,
    count: data.count,
    successRate: data.successRate,
    averageRating: data.averageRating,
    averageUsage: data.averageUsage
  }))

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Efficacité des Templates</h2>
          <p className="text-slate-600">Analysez les performances de vos templates</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 derniers jours</SelectItem>
              <SelectItem value="30days">30 derniers jours</SelectItem>
              <SelectItem value="90days">90 derniers jours</SelectItem>
              <SelectItem value="1year">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="general">Général</SelectItem>
              <SelectItem value="weight_loss">Perte de poids</SelectItem>
              <SelectItem value="muscle_gain">Prise de muscle</SelectItem>
              <SelectItem value="maintenance">Maintien</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux de réussite global</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.summary.overall_success_rate)}%
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
                <p className="text-sm font-medium text-gray-600">Perte de poids moyenne</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.summary.average_weight_loss)} kg
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
                <p className="text-sm font-medium text-gray-600">Clients total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.summary.total_clients}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Note moyenne</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.summary.average_rating)}/5
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution des performances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {distributionData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm">{entry.name}</span>
                      </div>
                      <span className="text-sm font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendances d'utilisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.usage_trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="usage" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Utilisation"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="success_rate" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Taux de réussite"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Performance des templates</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success_rate">Taux de réussite</SelectItem>
                      <SelectItem value="usage">Utilisation</SelectItem>
                      <SelectItem value="rating">Note</SelectItem>
                      <SelectItem value="weight_loss">Perte de poids</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedEffectiveness.map((template) => (
                  <div 
                    key={template.template_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-900">
                          {template.template_name}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {template.template_category}
                        </Badge>
                        <Badge 
                          className={`text-xs ${getPerformanceColor(template.success_rate)}`}
                        >
                          {getPerformanceLabel(template.success_rate)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                        <span>{template.client_count} clients</span>
                        <span>{template.template_usage_count} utilisations</span>
                        <span>{formatNumber(template.average_weight_loss)} kg perdus</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{formatNumber(template.template_rating)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatNumber(template.success_rate)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        Taux de réussite
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des tendances</CardTitle>
              <CardDescription>
                Évolution des performances sur la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.usage_trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="usage" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Utilisation quotidienne"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="success_rate" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Taux de réussite (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="successRate" fill="#10b981" name="Taux de réussite (%)" />
                    <Bar dataKey="averageRating" fill="#3b82f6" name="Note moyenne" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}