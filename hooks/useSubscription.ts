import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { SubscriptionPlanName, SubscriptionStatus, SubscriptionPlan } from '@/lib/supabase'

export interface SubscriptionData {
  status: SubscriptionStatus
  plan: SubscriptionPlanName
  startedAt: string | null
  endsAt: string | null
  currentPeriodEnd: string | null
  isTrialing: boolean
  trialEndsAt: string | null
  trialDaysLeft: number
  planDetails: SubscriptionPlan | null
}

export interface UseSubscriptionReturn {
  subscription: SubscriptionData | null
  loading: boolean
  error: string | null
  isActive: boolean
  isFree: boolean
  isTrialing: boolean
  canUseFeature: (feature: string) => boolean
  hasReachedLimit: (limitType: 'clients' | 'meal_plans') => Promise<boolean>
  createCheckoutSession: (planName: SubscriptionPlanName, priceId: string) => Promise<string>
  openBillingPortal: () => Promise<void>
  refetch: () => void
}

const PLAN_FEATURES = {
  free: {
    client_management: true,
    meal_plans: true,
    document_storage: true,
    messaging: true,
    support: 'community'
  },
  starter: {
    client_management: true,
    meal_plans: true,
    document_storage: true,
    messaging: true,
    ai_meal_plans: true,
    email_support: true,
    support: 'email'
  },
  professional: {
    client_management: true,
    meal_plans: true,
    document_storage: true,
    messaging: true,
    ai_meal_plans: true,
    email_support: true,
    priority_support: true,
    api_access: true,
    custom_branding: true,
    support: 'priority'
  }
} as const

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

export function useSubscription(): UseSubscriptionReturn {
  const [loading, setLoading] = useState(false)
  
  const { data, error, mutate } = useSWR('/api/subscription/status', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 30000 // Refresh every 30 seconds
  })

  const subscription = data?.subscription || null
  const isActive = subscription?.status === 'active'
  const isFree = subscription?.plan === 'free' || !subscription
  const isTrialing = subscription?.isTrialing || false

  const canUseFeature = (feature: string): boolean => {
    if (!subscription) return false
    
    const planFeatures = subscription.planDetails?.features || PLAN_FEATURES[subscription.plan as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.free
    return planFeatures[feature as keyof typeof planFeatures] === true
  }

  const hasReachedLimit = async (limitType: 'clients' | 'meal_plans'): Promise<boolean> => {
    if (!subscription?.planDetails) return false
    
    const limit = limitType === 'clients' 
      ? subscription.planDetails.max_clients
      : subscription.planDetails.max_meal_plans
    
    // -1 means unlimited
    if (limit === -1) return false
    
    try {
      const response = await fetch(`/api/subscription/usage?type=${limitType}`)
      const { current } = await response.json()
      return current >= limit
    } catch (error) {
      console.error(`Failed to check ${limitType} usage:`, error)
      return false
    }
  }

  const createCheckoutSession = async (planName: SubscriptionPlanName, priceId: string): Promise<string> => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName, priceId })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      return data.checkoutUrl
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create checkout session'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const openBillingPortal = async (): Promise<void> => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      window.open(data.portalUrl, '_blank')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open billing portal'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    mutate()
  }

  return {
    subscription,
    loading: loading || !data,
    error: error?.message || null,
    isActive,
    isFree,
    isTrialing,
    canUseFeature,
    hasReachedLimit,
    createCheckoutSession,
    openBillingPortal,
    refetch
  }
}

// Utility hook for checking specific feature access
export function useFeatureAccess(feature: string) {
  const { canUseFeature, subscription, loading } = useSubscription()
  
  return {
    hasAccess: canUseFeature(feature),
    plan: subscription?.plan || 'free',
    loading
  }
}

// Utility hook for checking usage limits
export function useUsageLimit(limitType: 'clients' | 'meal_plans') {
  const { subscription, hasReachedLimit, loading } = useSubscription()
  const [isAtLimit, setIsAtLimit] = useState(false)
  const [checkingLimit, setCheckingLimit] = useState(false)

  useEffect(() => {
    const checkLimit = async () => {
      if (loading || !subscription) return
      
      setCheckingLimit(true)
      try {
        const atLimit = await hasReachedLimit(limitType)
        setIsAtLimit(atLimit)
      } catch (error) {
        console.error(`Failed to check ${limitType} limit:`, error)
      } finally {
        setCheckingLimit(false)
      }
    }

    checkLimit()
  }, [subscription, limitType, hasReachedLimit, loading])

  return {
    isAtLimit,
    loading: checkingLimit,
    limit: subscription?.planDetails?.[limitType === 'clients' ? 'max_clients' : 'max_meal_plans'] || 0,
    plan: subscription?.plan || 'free'
  }
}