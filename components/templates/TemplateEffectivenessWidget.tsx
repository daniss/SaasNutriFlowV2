"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Star,
  Scale,
  Activity,
  BarChart3,
  ExternalLink
} from "lucide-react"

interface TemplateEffectivenessWidgetProps {
  templateId: string
  templateName: string
  onViewDetails?: () => void
  compact?: boolean
}

interface EffectivenessData {
  template_id: string
  client_count: number
  success_rate: number
  average_weight_loss: number
  average_duration: number
  client_satisfaction: number
  dropout_rate: number
  template_usage_count: number
  template_rating: number
}

export default function TemplateEffectivenessWidget({ 
  templateId, 
  templateName, 
  onViewDetails,
  compact = false 
}: TemplateEffectivenessWidgetProps) {
  const [effectiveness, setEffectiveness] = useState<EffectivenessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEffectiveness()
  }, [templateId])

  const fetchEffectiveness = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/templates/effectiveness?template_id=${templateId}`)
      
      if (response.ok) {
        const data = await response.json()
        const templateData = data.effectiveness.find((e: any) => e.template_id === templateId)
        setEffectiveness(templateData || null)
      } else {
        throw new Error('Failed to fetch effectiveness data')
      }
    } catch (err) {
      setError('Impossible de charger les données')
      console.error('Error fetching template effectiveness:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (successRate: number) => {
    if (successRate >= 80) return 'text-green-600'
    if (successRate >= 60) return 'text-yellow-600'
    return 'text-red-600'
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
      <Card className={compact ? "w-full" : ""}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !effectiveness) {
    return (
      <Card className={compact ? "w-full" : ""}>
        <CardContent className="p-4">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {error || 'Aucune donnée disponible'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (effectiveness.client_count === 0) {
    return (
      <Card className={compact ? "w-full" : ""}>
        <CardContent className="p-4">
          <div className="text-center">
            <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Aucun client n'a encore utilisé ce template
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Efficacité</span>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs ${getPerformanceColor(effectiveness.success_rate)}`}
            >
              {getPerformanceLabel(effectiveness.success_rate)}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {formatNumber(effectiveness.success_rate)}%
              </span>
              <span className="text-sm text-gray-600">
                {effectiveness.client_count} clients
              </span>
            </div>
            
            <Progress value={effectiveness.success_rate} className="h-2" />
            
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{formatNumber(effectiveness.average_weight_loss)} kg perdus</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>{formatNumber(effectiveness.template_rating)}</span>
              </div>
            </div>
          </div>
          
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onViewDetails}
              className="w-full mt-3"
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              Voir détails
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">Efficacité du template</span>
          <Badge 
            variant="outline" 
            className={getPerformanceColor(effectiveness.success_rate)}
          >
            {getPerformanceLabel(effectiveness.success_rate)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Success Rate */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {formatNumber(effectiveness.success_rate)}%
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Taux de réussite
            </div>
            <Progress value={effectiveness.success_rate} className="h-3" />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">
                {effectiveness.client_count}
              </div>
              <div className="text-xs text-gray-600">Clients</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Scale className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">
                {formatNumber(effectiveness.average_weight_loss)} kg
              </div>
              <div className="text-xs text-gray-600">Perte moyenne</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">
                {Math.round(effectiveness.average_duration)}
              </div>
              <div className="text-xs text-gray-600">Jours moyens</div>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">
                {formatNumber(effectiveness.template_rating)}/5
              </div>
              <div className="text-xs text-gray-600">Satisfaction</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Taux d'abandon</span>
              <span className="font-medium">
                {formatNumber(effectiveness.dropout_rate)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Utilisations totales</span>
              <span className="font-medium">
                {effectiveness.template_usage_count}
              </span>
            </div>
          </div>

          {onViewDetails && (
            <Button 
              variant="outline" 
              onClick={onViewDetails}
              className="w-full"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Voir l'analyse détaillée
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}