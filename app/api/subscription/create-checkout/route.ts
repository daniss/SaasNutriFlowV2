import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentService } from '@/lib/payment-service'
import { z } from 'zod'

const createCheckoutSchema = z.object({
  priceId: z.string(),
  planName: z.enum(['starter'])
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create dietitian record
    let { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id, email, name, stripe_customer_id, subscription_status')
      .eq('auth_user_id', user.id)
      .single()

    // If dietitian record doesn't exist, create one
    if (dietitianError?.code === 'PGRST116' || !dietitian) {
      // Get user profile data first
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, phone, address, city, state, zip_code')
        .eq('id', user.id)
        .single()

      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      
      const fullName = profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile?.first_name || profile?.last_name || profile?.email || user.email || 'User'
      
      const dietitianData = {
        auth_user_id: user.id,
        email: profile?.email || user.email || '',
        name: fullName,
        phone: profile?.phone,
        subscription_status: 'trialing',
        subscription_plan: 'starter',
        trial_ends_at: trialEndsAt
      }

      const { data: newDietitian, error: createError } = await supabase
        .from('dietitians')
        .insert(dietitianData)
        .select('id, email, name, stripe_customer_id, subscription_status')
        .single()

      if (createError) {
        // TODO: Log error to monitoring service
        return NextResponse.json({ error: 'Failed to create dietitian profile' }, { status: 500 })
      }

      dietitian = newDietitian
    } else if (dietitianError) {
      // TODO: Log error to monitoring service
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Check if already has active subscription or valid trial
    if (dietitian.subscription_status === 'active') {
      return NextResponse.json({ error: 'Subscription already exists' }, { status: 400 })
    }
    
    // Allow users to upgrade during trial period - they can choose to upgrade early

    const body = await request.json()
    const { priceId, planName } = createCheckoutSchema.parse(body)

    let stripeCustomerId = dietitian.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await paymentService.createCustomer(
        dietitian.email,
        dietitian.name || dietitian.email
      )
      
      stripeCustomerId = customer.id
      
      // Update dietitian with stripe customer ID
      const { error: updateError } = await supabase
        .from('dietitians')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', dietitian.id)

      if (updateError) {
        // TODO: Log error to monitoring service
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
      }
    }

    // Determine if user is already in trial (should skip additional trial period)
    let skipTrial = false
    if (dietitian.subscription_status === 'trialing') {
      // Get trial end date to check if still valid
      const { data: trialInfo } = await supabase
        .from('dietitians')
        .select('trial_ends_at')
        .eq('id', dietitian.id)
        .single()
      
      if (trialInfo?.trial_ends_at) {
        const trialEndDate = new Date(trialInfo.trial_ends_at)
        const now = new Date()
        
        // If user is still in valid trial, skip adding another trial period
        if (trialEndDate > now) {
          skipTrial = true
        }
      }
    }

    // Create checkout session
    const checkoutSession = await paymentService.createCheckoutSession(
      stripeCustomerId,
      priceId,
      {
        dietitian_id: dietitian.id,
        plan_name: planName
      },
      skipTrial // Skip trial if user is already in trial period
    )

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url
    })

  } catch (error) {
    // TODO: Log error to monitoring service
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}