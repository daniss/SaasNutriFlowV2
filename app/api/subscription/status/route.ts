import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get dietitian subscription data
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select(`
        id,
        subscription_status,
        subscription_plan,
        subscription_started_at,
        subscription_ends_at,
        trial_ends_at,
        subscription_current_period_end
      `)
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json({ error: 'Dietitian not found' }, { status: 404 })
    }

    // Get subscription plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select(`
        name,
        display_name,
        price_monthly,
        features,
        max_clients,
        max_meal_plans,
        ai_generations_per_month
      `)
      .eq('name', dietitian.subscription_plan)
      .single()

    if (planError) {
      console.error('Failed to fetch plan details:', planError)
    }

    // Calculate trial status
    const now = new Date()
    const trialEnds = dietitian.trial_ends_at ? new Date(dietitian.trial_ends_at) : null
    const isTrialing = dietitian.subscription_status === 'trialing' && trialEnds && trialEnds > now
    const trialDaysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0

    return NextResponse.json({
      success: true,
      subscription: {
        status: dietitian.subscription_status,
        plan: dietitian.subscription_plan,
        startedAt: dietitian.subscription_started_at,
        endsAt: dietitian.subscription_ends_at,
        currentPeriodEnd: dietitian.subscription_current_period_end,
        isTrialing,
        trialEndsAt: dietitian.trial_ends_at,
        trialDaysLeft,
        planDetails: plan
      }
    })

  } catch (error) {
    console.error('Get subscription status error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}