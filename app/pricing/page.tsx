'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap, CreditCard, Users, BarChart3, Bot, Headphones } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { toast } from 'sonner'

// Local interface since SubscriptionPlan is not exported from supabase
interface SubscriptionPlan {
  name: string
  price: number
  features: string[]
  limits: {
    clients: number
    mealPlans: number
    aiGenerations: number
  }
  stripe_price_id: string
  max_clients: number | null
  max_meal_plans: number | null
  ai_generations_per_month: number | null
}

export default function PricingPage() {
  const router = useRouter()
  const { subscription, createCheckoutSession, loading: subscriptionLoading } = useSubscription()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans')
      const data = await response.json()
      
      if (data.success) {
        setPlans(data.plans)
      } else {
        throw new Error(data.error || 'Failed to fetch plans')
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast.error('Impossible de charger les plans d\'abonnement')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (plan.name === 'free') return
    
    setCheckoutLoading(plan.name)
    
    try {
      const checkoutUrl = await createCheckoutSession(
        plan.name as 'starter',
        plan.stripe_price_id
      )
      
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Erreur lors de la création de la session de paiement')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const isCurrentPlan = (planName: string) => {
    return subscription?.plan === planName
  }

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'starter':
        return <Zap className="h-6 w-6" />
      default:
        return <Users className="h-6 w-6" />
    }
  }

  const getPlanFeatures = (features: any) => {
    const featureList = []
    
    if (features.client_management) {
      featureList.push('Gestion des clients')
    }
    if (features.meal_plans) {
      featureList.push('Plans de repas')
    }
    if (features.ai_meal_plans) {
      featureList.push('Génération IA des plans')
    }
    if (features.document_storage) {
      featureList.push('Stockage de documents')
    }
    if (features.messaging) {
      featureList.push('Messagerie intégrée')
    }
    if (features.api_access) {
      featureList.push('Accès API')
    }
    if (features.custom_branding) {
      featureList.push('Personnalisation')
    }
    if (features.priority_support) {
      featureList.push('Support prioritaire')
    } else if (features.email_support) {
      featureList.push('Support email')
    }
    
    return featureList
  }

  const formatLimits = (plan: SubscriptionPlan) => {
    const limits = []
    
    if (plan.max_clients !== null) {
      limits.push(`${plan.max_clients === -1 ? 'Illimités' : plan.max_clients} clients`)
    }
    
    if (plan.max_meal_plans !== null) {
      limits.push(`${plan.max_meal_plans === -1 ? 'Illimités' : plan.max_meal_plans} plans/mois`)
    }
    
    if (plan.ai_generations_per_month !== null && plan.ai_generations_per_month > 0) {
      limits.push(`${plan.ai_generations_per_month} générations IA/mois`)
    }
    
    return limits
  }

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">NutriFlow</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Retour au tableau de bord
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Développez votre pratique avec les outils professionnels de NutriFlow. 
            Commencez votre essai gratuit de 14 jours dès aujourd'hui.
          </p>
          
          {subscription?.isTrialing && (
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Star className="h-4 w-4" />
              Période d'essai: {subscription.trialDaysLeft} jours restants
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="flex justify-center max-w-md mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.name === 'starter' 
                  ? 'border-2 border-emerald-500 shadow-xl scale-105' 
                  : 'border-gray-200'
              } ${isCurrentPlan(plan.name) ? 'ring-2 ring-emerald-500' : ''}`}
            >
              {plan.name === 'starter' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500">
                  Le plus populaire
                </Badge>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${
                    plan.name === 'starter' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getPlanIcon(plan.name)}
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold">
                  {plan.display_name}
                </CardTitle>
                
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {plan.price_monthly === 0 ? 'Gratuit' : `${plan.price_monthly}€`}
                  </span>
                  {plan.price_monthly > 0 && (
                    <span className="text-gray-600">/mois</span>
                  )}
                </div>
                
                {plan.name !== 'free' && (
                  <p className="text-sm text-gray-600 mt-2">
                    Essai gratuit de 14 jours
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Limits */}
                <div className="space-y-2">
                  {formatLimits(plan).map((limit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <BarChart3 className="h-4 w-4 text-emerald-600" />
                      {limit}
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="space-y-3 pt-4 border-t">
                  {getPlanFeatures(plan.features).map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Support Level */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Headphones className="h-4 w-4" />
                    Support {
                      plan.features.support === 'priority' ? 'prioritaire' :
                      plan.features.support === 'email' ? 'email' :
                      'communautaire'
                    }
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                {isCurrentPlan(plan.name) ? (
                  <Button disabled className="w-full">
                    Plan actuel
                  </Button>
                ) : plan.name === 'free' ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/dashboard')}
                  >
                    Plan actuel
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${
                      'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                    onClick={() => handleUpgrade(plan)}
                    disabled={checkoutLoading === plan.name}
                  >
                    {checkoutLoading === plan.name ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Chargement...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Commencer l'essai gratuit
                      </div>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Questions fréquentes
          </h2>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">
                  Puis-je annuler mon abonnement à tout moment ?
                </h3>
                <p className="text-gray-600">
                  Oui, vous pouvez annuler votre abonnement à tout moment via votre portail de facturation. 
                  Aucuns frais d'annulation ne sont appliqués.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">
                  Que se passe-t-il après la période d'essai ?
                </h3>
                <p className="text-gray-600">
                  Après 14 jours d'essai gratuit, votre abonnement sera automatiquement facturé. 
                  Vous pouvez annuler à tout moment avant la fin de l'essai.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">
                  Puis-je changer de plan plus tard ?
                </h3>
                <p className="text-gray-600">
                  Absolument ! Vous pouvez passer à un plan supérieur ou inférieur à tout moment. 
                  Les changements sont proratisés automatiquement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}