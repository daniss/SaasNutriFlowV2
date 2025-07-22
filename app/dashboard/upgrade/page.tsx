'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap, CreditCard, Bot, Users, BarChart3, Lock } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { SubscriptionPlan } from '@/lib/supabase'
import { toast } from 'sonner'

const FEATURE_DESCRIPTIONS = {
  'generate': {
    title: 'Génération IA de plans de repas',
    description: 'Créez des plans de repas personnalisés en quelques secondes avec notre IA',
    icon: <Bot className="h-6 w-6" />
  },
  'analytics': {
    title: 'Analyses avancées',
    description: 'Obtenez des insights détaillés sur vos clients et votre pratique',
    icon: <BarChart3 className="h-6 w-6" />
  },
  'api': {
    title: 'Accès API',
    description: 'Intégrez NutriFlow avec vos autres outils professionnels',
    icon: <Zap className="h-6 w-6" />
  },
  'branding': {
    title: 'Personnalisation de marque',
    description: 'Personnalisez l\'interface avec votre identité visuelle',
    icon: <Star className="h-6 w-6" />
  },
  'pro': {
    title: 'Fonctionnalités Pro',
    description: 'Accédez à toutes les fonctionnalités avancées de NutriFlow',
    icon: <Lock className="h-6 w-6" />
  }
}

export default function UpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const feature = searchParams.get('feature') || 'pro'
  const reason = searchParams.get('reason')
  const { subscription, createCheckoutSession, isTrialing, isTrialExpired } = useSubscription()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const featureInfo = FEATURE_DESCRIPTIONS[feature as keyof typeof FEATURE_DESCRIPTIONS] || FEATURE_DESCRIPTIONS.pro

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans')
      const data = await response.json()
      
      if (data.success) {
        // Filter out free plan for upgrade page
        setPlans(data.plans.filter((p: SubscriptionPlan) => p.name !== 'free'))
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

  const getPlanFeatures = (features: any) => {
    const featureList = []
    
    if (features.client_management) {
      featureList.push('Gestion illimitée des clients')
    }
    if (features.ai_meal_plans) {
      featureList.push('Génération IA des plans de repas')
    }
    if (features.meal_plans) {
      featureList.push('Plans de repas avancés')
    }
    if (features.document_storage) {
      featureList.push('Stockage de documents')
    }
    if (features.ingredient_database) {
      featureList.push('Accès base de données d\'ingrédients')
    }
    if (features.recipe_database) {
      featureList.push('Accès base de données de recettes')
    }
    if (features.api_access) {
      featureList.push('Accès API complet')
    }
    if (features.custom_branding) {
      featureList.push('Personnalisation de marque')
    }
    if (features.priority_support) {
      featureList.push('Support prioritaire')
    }
    
    return featureList
  }

  const formatLimits = (plan: SubscriptionPlan) => {
    const limits = []
    
    if (plan.max_clients !== null) {
      limits.push(`${plan.max_clients === -1 ? 'Clients illimités' : `${plan.max_clients} clients`}`)
    }
    
    if (plan.max_meal_plans !== null) {
      limits.push(`${plan.max_meal_plans === -1 ? 'Plans illimités' : `${plan.max_meal_plans} plans/mois`}`)
    }
    
    if (plan.ai_generations_per_month !== null && plan.ai_generations_per_month > 0) {
      limits.push(`${plan.ai_generations_per_month} générations IA/mois`)
    }
    
    return limits
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">

        {/* Feature Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-emerald-100 rounded-full text-emerald-600">
              {featureInfo.icon}
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {featureInfo.title}
          </h1>
          
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            {featureInfo.description}
          </p>

          {/* Trial Status */}
          {isTrialing && !isTrialExpired && subscription?.trialDaysLeft && (
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Star className="h-4 w-4" />
              Période d'essai: {subscription.trialDaysLeft} jours restants
            </div>
          )}

          {/* Upgrade Reason Messages */}
          <div className={`rounded-lg p-4 max-w-2xl mx-auto ${
            reason === 'trial_expired' 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className={`flex items-center gap-2 ${
              reason === 'trial_expired' ? 'text-red-800' : 'text-yellow-800'
            }`}>
              <Lock className="h-5 w-5" />
              <span className="font-medium">
                {reason === 'trial_expired' 
                  ? 'Période d\'essai expirée' 
                  : reason === 'subscription_required'
                  ? 'Abonnement requis'
                  : 'Abonnement nécessaire'
                }
              </span>
            </div>
            <p className={`mt-2 ${
              reason === 'trial_expired' ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {reason === 'trial_expired' 
                ? 'Votre période d\'essai gratuite de 2 semaines est terminée. Choisissez un plan pour continuer à utiliser NutriFlow.'
                : 'Pour accéder à toutes les fonctionnalités de NutriFlow, veuillez choisir un plan d\'abonnement ci-dessous.'
              }
            </p>
          </div>
        </div>

        {/* Plans */}
        <div className="flex justify-center max-w-md mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.name === 'starter' 
                  ? 'border-2 border-emerald-500 shadow-xl scale-105' 
                  : 'border-gray-200'
              }`}
            >
              {plan.name === 'starter' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500">
                  Recommandé
                </Badge>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                    <Zap className="h-6 w-6" />
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold">
                  {plan.display_name}
                </CardTitle>
                
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {plan.price_monthly}€
                  </span>
                  <span className="text-gray-600">/mois</span>
                </div>
                
                {!isTrialExpired && (
                  <p className="text-sm text-emerald-600 font-medium mt-2">
                    Essai gratuit de 14 jours
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Limits */}
                <div className="space-y-2">
                  {formatLimits(plan).map((limit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Users className="h-4 w-4 text-emerald-600" />
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
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
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
                      {isTrialExpired ? 'Choisir ce plan' : 'Commencer l\'essai gratuit'}
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Benefits */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Pourquoi choisir NutriFlow ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                    <Bot className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">IA Avancée</h3>
                <p className="text-gray-600 text-sm">
                  Générez des plans de repas personnalisés en quelques secondes avec notre IA
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">Analyses Détaillées</h3>
                <p className="text-gray-600 text-sm">
                  Suivez les progrès de vos clients avec des rapports détaillés
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">Gestion Complète</h3>
                <p className="text-gray-600 text-sm">
                  Gérez jusqu'à 25 clients avec tous leurs documents et suivis
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}