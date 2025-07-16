"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  User, 
  Calendar,
  BarChart3,
  Filter,
  RefreshCw
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import StarRating from "@/components/ui/star-rating"

interface Feedback {
  id: string
  rating: number
  feedback_text?: string
  difficulty_rating?: number
  satisfaction_rating?: number
  would_recommend?: boolean
  created_at: string
  meal_plans: {
    id: string
    title: string
    clients: {
      id: string
      name: string
      email: string
    }
  }
}

interface FeedbackDisplayProps {
  mealPlanId?: string
  showTitle?: boolean
}

export default function FeedbackDisplay({ 
  mealPlanId, 
  showTitle = true 
}: FeedbackDisplayProps) {
  const { toast } = useToast()
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'satisfaction'>('recent')

  useEffect(() => {
    fetchFeedback()
  }, [mealPlanId])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (mealPlanId) params.append('meal_plan_id', mealPlanId)
      
      const response = await fetch(`/api/feedback?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback')
      }
      
      const data = await response.json()
      setFeedback(data.feedback || [])
    } catch (error) {
      console.error('Error fetching feedback:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les commentaires",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredFeedback = feedback.filter(fb => {
    if (filter === 'positive') return fb.rating >= 4
    if (filter === 'negative') return fb.rating <= 2
    return true
  })

  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating
      case 'satisfaction':
        return (b.satisfaction_rating || 0) - (a.satisfaction_rating || 0)
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const averageRating = feedback.length > 0 
    ? feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length 
    : 0

  const recommendationRate = feedback.length > 0 
    ? (feedback.filter(fb => fb.would_recommend === true).length / feedback.length) * 100
    : 0

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Commentaires clients</h2>
            <p className="text-gray-600">
              {feedback.length} commentaire{feedback.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" onClick={fetchFeedback}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      )}

      {feedback.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Note moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux de recommandation</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recommendationRate.toFixed(0)}%
                  </p>
                </div>
                <ThumbsUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total commentaires</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {feedback.length}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les commentaires</SelectItem>
            <SelectItem value="positive">Positifs (4-5 étoiles)</SelectItem>
            <SelectItem value="negative">Négatifs (1-2 étoiles)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Plus récents</SelectItem>
            <SelectItem value="rating">Note décroissante</SelectItem>
            <SelectItem value="satisfaction">Satisfaction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {sortedFeedback.length === 0 ? (
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun commentaire
                </h3>
                <p className="text-gray-600">
                  {mealPlanId 
                    ? "Aucun commentaire pour ce plan alimentaire"
                    : "Vos clients n'ont pas encore laissé de commentaires"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedFeedback.map((fb) => (
            <Card key={fb.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {fb.meal_plans.clients.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {fb.meal_plans.clients.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Plan: {fb.meal_plans.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <StarRating rating={fb.rating} readonly size="sm" />
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(fb.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {fb.feedback_text && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-700">{fb.feedback_text}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      {fb.difficulty_rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Facilité:</span>
                          <StarRating rating={fb.difficulty_rating} readonly size="sm" />
                        </div>
                      )}
                      
                      {fb.satisfaction_rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Satisfaction:</span>
                          <StarRating rating={fb.satisfaction_rating} readonly size="sm" />
                        </div>
                      )}
                      
                      {fb.would_recommend !== null && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Recommande:</span>
                          {fb.would_recommend ? (
                            <ThumbsUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}