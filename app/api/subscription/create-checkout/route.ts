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
      .select('id, email, first_name, last_name, stripe_customer_id, subscription_status')
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
      
      const dietitianData = {
        auth_user_id: user.id,
        email: profile?.email || user.email || '',
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        phone: profile?.phone,
        address: profile?.address,
        city: profile?.city,
        state: profile?.state,
        zip_code: profile?.zip_code,
        subscription_status: 'trialing',
        subscription_plan: 'starter',
        trial_ends_at: trialEndsAt
      }

      const { data: newDietitian, error: createError } = await supabase
        .from('dietitians')
        .insert(dietitianData)
        .select('id, email, first_name, last_name, stripe_customer_id, subscription_status')
        .single()

      if (createError) {
        console.error('Error creating dietitian record:', createError)
        return NextResponse.json({ error: 'Failed to create dietitian profile' }, { status: 500 })
      }

      dietitian = newDietitian
    } else if (dietitianError) {
      console.error('Error fetching dietitian:', dietitianError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Check if already has active subscription or valid trial
    if (dietitian.subscription_status === 'active') {
      return NextResponse.json({ error: 'Subscription already exists' }, { status: 400 })
    }
    
    // For trialing status, check if trial is still valid
    if (dietitian.subscription_status === 'trialing') {
      // Get trial end date from the dietitian record
      const { data: trialInfo } = await supabase
        .from('dietitians')
        .select('trial_ends_at')
        .eq('id', dietitian.id)
        .single()
      
      if (trialInfo?.trial_ends_at) {
        const trialEndDate = new Date(trialInfo.trial_ends_at)
        const now = new Date()
        
        // If trial is still valid, prevent checkout
        if (trialEndDate > now) {
          return NextResponse.json({ error: 'Trial is still active' }, { status: 400 })
        }
      }
    }

    const body = await request.json()
    const { priceId, planName } = createCheckoutSchema.parse(body)

    let stripeCustomerId = dietitian.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await paymentService.createCustomer(
        dietitian.email,
        `${dietitian.first_name || ''} ${dietitian.last_name || ''}`.trim() || dietitian.email
      )
      
      stripeCustomerId = customer.id
      
      // Update dietitian with stripe customer ID
      const { error: updateError } = await supabase
        .from('dietitians')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', dietitian.id)

      if (updateError) {
        console.error('Failed to update dietitian with stripe customer ID:', updateError)
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
      }
    }

    // Create checkout session
    const checkoutSession = await paymentService.createCheckoutSession(
      stripeCustomerId,
      priceId,
      {
        dietitian_id: dietitian.id,
        plan_name: planName
      }
    )

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url
    })

  } catch (error) {
    console.error('Create checkout error:', error)
    
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