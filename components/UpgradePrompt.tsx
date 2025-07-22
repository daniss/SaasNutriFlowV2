'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Crown, 
  Star, 
  Zap, 
  CreditCard, 
  Lock, 
  Bot, 
  Users, 
  BarChart3,
  X,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useSubscription } from '@/hooks/useSubscription'

interface UpgradePromptProps {
  feature?: string
  title?: string
  description?: string
  variant?: 'banner' | 'modal' | 'card' | 'inline'
  dismissible?: boolean
  onDismiss?: () => void
  showPlans?: boolean
}

const FEATURE_CONFIG = {
  ai_meal_plans: {
    title: 'Génération IA de plans alimentaires',
    description: 'Créez des plans personnalisés en quelques secondes avec notre IA avancée',
    icon: <Bot className="h-5 w-5" />,
    color: 'emerald'
  },
  analytics: {
    title: 'Analyses avancées',
    description: 'Obtenez des insights détaillés sur vos clients et votre pratique',
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'blue'
  },
  unlimited_clients: {
    title: 'Clients illimités',
    description: 'Développez votre pratique sans limites sur le nombre de clients',
    icon: <Users className="h-5 w-5" />,
    color: 'purple'
  },
  api_access: {
    title: 'Accès API',
    description: 'Intégrez NutriFlow avec vos autres outils professionnels',
    icon: <Zap className="h-5 w-5" />,
    color: 'orange'
  },
  branding: {
    title: 'Personnalisation de marque',
    description: 'Personnalisez l\'interface avec votre identité visuelle',
    icon: <Star className="h-5 w-5" />,
    color: 'pink'
  },
  pro: {
    title: 'Fonctionnalités Pro',
    description: 'Débloquez toutes les fonctionnalités avancées de NutriFlow',
    icon: <Crown className="h-5 w-5" />,
    color: 'gold'
  }
}

export function UpgradePrompt({
  feature = 'pro',
  title,
  description,
  variant = 'card',
  dismissible = false,
  onDismiss,
  showPlans = true
}: UpgradePromptProps) {
  const { subscription, loading, isTrialing, isActive } = useSubscription()
  const [dismissed, setDismissed] = useState(false)

  const featureConfig = FEATURE_CONFIG[feature as keyof typeof FEATURE_CONFIG] || FEATURE_CONFIG.pro
  const finalTitle = title || featureConfig.title
  const finalDescription = description || featureConfig.description

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  // Don't show if user already has active subscription that's not in trial, or if dismissed
  if (loading || (isActive && !isTrialing) || dismissed) {
    return null
  }

  if (variant === 'banner') {
    return (
      <Alert className="border-emerald-200 bg-emerald-50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
              {featureConfig.icon}
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900">{finalTitle}</h3>
              <AlertDescription className="text-emerald-700">
                {finalDescription}
              </AlertDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Link href={`/dashboard/upgrade?feature=${feature}`}>
                <CreditCard className="h-4 w-4 mr-2" />
                Passer au Pro
              </Link>
            </Button>
            {dismissible && (
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Alert>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-emerald-600" />
          <div>
            <h3 className="font-medium text-emerald-900">{finalTitle}</h3>
            <p className="text-sm text-emerald-700">{finalDescription}</p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
          <Link href={`/dashboard/upgrade?feature=${feature}`}>
            Débloquer <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
              {featureConfig.icon}
            </div>
            <div>
              <CardTitle className="text-lg text-emerald-900">
                {finalTitle}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-emerald-600 hover:bg-emerald-700">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro
                </Badge>
                {isTrialing && subscription?.trialDaysLeft && (
                  <span className="text-sm text-emerald-700">
                    {subscription.trialDaysLeft} jours d'essai restants
                  </span>
                )}
              </div>
            </div>
          </div>
          {dismissible && (
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-emerald-700">
          {finalDescription}
        </p>

        {showPlans && (
          <div className="space-y-3">
            <h4 className="font-medium text-emerald-900">Fonctionnalités Pro incluses :</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-emerald-700">
                <Bot className="h-4 w-4" />
                Génération IA de plans alimentaires
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <Users className="h-4 w-4" />
                Clients illimités
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <BarChart3 className="h-4 w-4" />
                Analyses avancées
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <Crown className="h-4 w-4" />
                Support prioritaire
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            <Link href={`/dashboard/upgrade?feature=${feature}`}>
              <CreditCard className="h-4 w-4 mr-2" />
              {isTrialing ? 'Choisir un plan' : 'Commencer l\'essai gratuit'}
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
            <Link href="/pricing">
              Voir tous les plans
            </Link>
          </Button>
        </div>

        {!isTrialing && (
          <p className="text-xs text-emerald-600 text-center">
            ✨ Essai gratuit de 14 jours • Aucune carte bancaire requise
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Specialized component for feature limits
interface FeatureLimitPromptProps {
  limitType: 'clients' | 'meal_plans' | 'ai_generations'
  currentUsage: number
  limit: number
  onUpgrade?: () => void
}

export function FeatureLimitPrompt({ 
  limitType, 
  currentUsage, 
  limit,
  onUpgrade 
}: FeatureLimitPromptProps) {
  const limitConfig = {
    clients: {
      title: 'Limite de clients atteinte',
      description: `Vous avez atteint votre limite de ${limit} client${limit > 1 ? 's' : ''}. Passez au Pro pour des clients illimités.`,
      feature: 'unlimited_clients'
    },
    meal_plans: {
      title: 'Limite de plans alimentaires atteinte',
      description: `Vous avez utilisé ${currentUsage}/${limit} plans ce mois. Passez au Pro pour des plans illimités.`,
      feature: 'unlimited_meal_plans'
    },
    ai_generations: {
      title: 'Limite de générations IA atteinte',
      description: `Vous avez utilisé toutes vos générations IA ce mois. Passez au Pro pour plus de générations.`,
      feature: 'ai_meal_plans'
    }
  }

  const config = limitConfig[limitType]

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Lock className="h-4 w-4" />
      <div className="flex items-center justify-between w-full">
        <div>
          <h3 className="font-semibold text-amber-900">{config.title}</h3>
          <AlertDescription className="text-amber-700">
            {config.description}
          </AlertDescription>
        </div>
        <Button 
          asChild 
          size="sm" 
          className="bg-amber-600 hover:bg-amber-700"
          onClick={onUpgrade}
        >
          <Link href={`/dashboard/upgrade?feature=${config.feature}`}>
            Passer au Pro
          </Link>
        </Button>
      </div>
    </Alert>
  )
}