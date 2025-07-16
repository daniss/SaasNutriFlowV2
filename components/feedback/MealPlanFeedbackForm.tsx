"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog"
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Send, 
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import StarRating from "@/components/ui/star-rating"

interface MealPlanFeedbackFormProps {
  mealPlanId: string
  mealPlanTitle: string
  existingFeedback?: {
    id: string
    rating: number
    feedback_text?: string
    difficulty_rating?: number
    satisfaction_rating?: number
    would_recommend?: boolean
  }
  onFeedbackSubmitted?: () => void
}

export default function MealPlanFeedbackForm({
  mealPlanId,
  mealPlanTitle,
  existingFeedback,
  onFeedbackSubmitted
}: MealPlanFeedbackFormProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rating, setRating] = useState(existingFeedback?.rating || 0)
  const [feedbackText, setFeedbackText] = useState(existingFeedback?.feedback_text || "")
  const [difficultyRating, setDifficultyRating] = useState(existingFeedback?.difficulty_rating || 0)
  const [satisfactionRating, setSatisfactionRating] = useState(existingFeedback?.satisfaction_rating || 0)
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(
    existingFeedback?.would_recommend !== undefined ? existingFeedback.would_recommend : null
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast({
        title: "Note requise",
        description: "Veuillez donner une note globale avant de soumettre",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meal_plan_id: mealPlanId,
          rating,
          feedback_text: feedbackText,
          difficulty_rating: difficultyRating,
          satisfaction_rating: satisfactionRating,
          would_recommend: wouldRecommend
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      const result = await response.json()

      toast({
        title: "Commentaire envoyé",
        description: "Merci pour votre retour sur ce plan alimentaire !",
        duration: 3000
      })

      setIsOpen(false)
      onFeedbackSubmitted?.()
      
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le commentaire. Veuillez réessayer.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasExistingFeedback = !!existingFeedback
  const isComplete = rating > 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={hasExistingFeedback ? "outline" : "default"}
          className={hasExistingFeedback ? "text-emerald-600 border-emerald-600" : ""}
        >
          {hasExistingFeedback ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Modifier l'avis
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Donner un avis
            </>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            {hasExistingFeedback ? "Modifier votre avis" : "Donner votre avis"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Plan alimentaire
            </Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{mealPlanTitle}</p>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Note globale *
            </Label>
            <div className="flex items-center gap-3">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
              />
              <span className="text-sm text-gray-600">
                {rating === 0 ? "Pas encore noté" : `${rating}/5`}
              </span>
            </div>
          </div>

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Facilité de suivi
              </Label>
              <div className="flex items-center gap-2">
                <StarRating
                  rating={difficultyRating}
                  onRatingChange={setDifficultyRating}
                  size="sm"
                />
                <span className="text-xs text-gray-500">
                  {difficultyRating === 0 ? "Non noté" : `${difficultyRating}/5`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Satisfaction
              </Label>
              <div className="flex items-center gap-2">
                <StarRating
                  rating={satisfactionRating}
                  onRatingChange={setSatisfactionRating}
                  size="sm"
                />
                <span className="text-xs text-gray-500">
                  {satisfactionRating === 0 ? "Non noté" : `${satisfactionRating}/5`}
                </span>
              </div>
            </div>
          </div>

          {/* Would Recommend */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Recommanderiez-vous ce plan ?
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={wouldRecommend === true ? "default" : "outline"}
                size="sm"
                onClick={() => setWouldRecommend(true)}
                className={wouldRecommend === true ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Oui
              </Button>
              <Button
                type="button"
                variant={wouldRecommend === false ? "default" : "outline"}
                size="sm"
                onClick={() => setWouldRecommend(false)}
                className={wouldRecommend === false ? "bg-red-600 hover:bg-red-700" : ""}
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Non
              </Button>
            </div>
          </div>

          <Separator />

          {/* Written Feedback */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Commentaire (optionnel)
            </Label>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Partagez votre expérience avec ce plan alimentaire..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Optionnel - Aidez votre nutritionniste à améliorer</span>
              <span>{feedbackText.length}/500</span>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={!isComplete || isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {hasExistingFeedback ? "Modifier" : "Envoyer"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}