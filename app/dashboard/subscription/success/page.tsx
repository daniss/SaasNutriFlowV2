'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Crown, Star, Zap, ArrowRight, Bot, Users, BarChart3, Sparkles } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import Link from 'next/link'
import { useCallback } from 'react'

// Dynamic import for confetti to avoid SSR issues
const triggerConfetti = async () => {
  if (typeof window !== 'undefined') {
    try {
      const confetti = (await import('canvas-confetti')).default
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#047857']
      })
    } catch (error) {
      console.log('Confetti animation not available')
    }
  }
}

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { subscription, refetch } = useSubscription()
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)

  useEffect(() => {
    // Trigger confetti animation
    const timer = setTimeout(() => {
      triggerConfetti()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Refetch subscription data to get the latest status
    const refreshData = async () => {
      try {
        await refetch()
        // If we have a session ID, we could validate it with Stripe
        // For now, we'll just refetch the subscription data
        setLoading(false)
      } catch (error) {
        console.error('Error refreshing subscription data:', error)
        setLoading(false)
      }
    }

    refreshData()
  }, [refetch])

  const getPlanIcon = () => {
    if (!subscription) return <Star className="h-8 w-8" />
    
    switch (subscription.plan) {
      case 'starter':
        return <Zap className="h-8 w-8" />
      case 'professional':
        return <Crown className="h-8 w-8" />
      default:
        return <Star className="h-8 w-8" />
    }
  }

  const getPlanName = () => {
    if (!subscription) return 'Plan'
    
    switch (subscription.plan) {
      case 'starter':
        return 'Starter'
      case 'professional':
        return 'Professional'
      default:
        return 'Plan'
    }
  }

  const getFeatureList = () => {
    if (!subscription || subscription.plan === 'free') return []

    const features = []
    
    if (subscription.plan === 'starter' || subscription.plan === 'professional') {
      features.push(
        { icon: <Bot className="h-5 w-5" />, text: 'Génération IA de plans alimentaires' },
        { icon: <Users className="h-5 w-5" />, text: '25 clients (Starter) / Illimité (Pro)' },
        { icon: <BarChart3 className="h-5 w-5" />, text: 'Analyses détaillées' }
      )
    }

    if (subscription.plan === 'professional') {
      features.push(
        { icon: <Crown className="h-5 w-5" />, text: 'Clients illimités' },
        { icon: <Sparkles className="h-5 w-5" />, text: 'Personnalisation de marque' },
        { icon: <Zap className="h-5 w-5" />, text: 'Accès API' }
      )
    }

    return features
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Finalisation de votre abonnement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="p-6 bg-emerald-100 rounded-full text-emerald-600">
                  <CheckCircle className="h-12 w-12" />
                </div>
                <div className="absolute -top-2 -right-2 p-2 bg-white rounded-full shadow-lg">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-white">
                    {getPlanIcon()}
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Bienvenue dans NutriFlow {getPlanName()} ! 🎉
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Votre abonnement a été activé avec succès. Vous avez maintenant accès à toutes les fonctionnalités Pro.
            </p>

            {subscription?.isTrialing && (
              <Badge className="bg-emerald-100 text-emerald-800 text-sm px-4 py-2">
                <Star className="h-4 w-4 mr-2" />
                Période d'essai de 14 jours activée
              </Badge>
            )}
          </div>

          {/* Subscription Details */}
          <Card className="mb-8 border-emerald-200 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                  {getPlanIcon()}
                </div>
                Plan {getPlanName()}
                {subscription?.isTrialing && (
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                    Essai gratuit
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription?.isTrialing && (
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h3 className="font-semibold text-emerald-900 mb-2">
                    Période d'essai de 14 jours
                  </h3>
                  <p className="text-emerald-700 text-sm">
                    Profitez de toutes les fonctionnalités Pro gratuitement pendant 14 jours. 
                    Votre première facturation aura lieu le {subscription.trialEndsAt && new Date(subscription.trialEndsAt).toLocaleDateString('fr-FR')}.
                  </p>
                </div>
              )}

              {/* Features */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Fonctionnalités débloquées :
                </h3>
                <div className="grid gap-3">
                  {getFeatureList().map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-emerald-600">
                        {feature.icon}
                      </div>
                      <span className="text-gray-700">{feature.text}</span>
                      <CheckCircle className="h-4 w-4 text-emerald-600 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Prochaines étapes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Link 
                  href="/dashboard/meal-plans/generate" 
                  className="block p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Créer votre premier plan IA
                        </h3>
                        <p className="text-sm text-gray-600">
                          Testez la génération automatique de plans alimentaires
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <Link 
                  href="/dashboard/clients" 
                  className="block p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Ajouter plus de clients
                        </h3>
                        <p className="text-sm text-gray-600">
                          Profitez de votre limite étendue de clients
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <Link 
                  href="/dashboard/settings" 
                  className="block p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Gérer votre abonnement
                        </h3>
                        <p className="text-sm text-gray-600">
                          Accédez au portail de facturation et aux paramètres
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/dashboard">
                Accéder au tableau de bord
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard/meal-plans/generate">
                <Bot className="h-4 w-4 mr-2" />
                Tester l'IA
              </Link>
            </Button>
          </div>

          {/* Support */}
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600 mb-4">
              Besoin d'aide pour commencer ?
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="ghost" size="sm">
                <Link href="/help" className="text-emerald-600 hover:text-emerald-700">
                  Centre d'aide
                </Link>
              </Button>
              <Button variant="ghost" size="sm">
                <Link href="mailto:support@nutriflow.fr" className="text-emerald-600 hover:text-emerald-700">
                  Contacter le support
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}