import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentService } from '@/lib/payment-service'
import { z } from 'zod'

const createCheckoutSchema = z.object({
  priceId: z.string(),
  planName: z.enum(['starter', 'professional'])
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get dietitian record
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id, email, first_name, last_name, stripe_customer_id, subscription_status')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json({ error: 'Dietitian not found' }, { status: 404 })
    }

    // Check if already has active subscription
    if (dietitian.subscription_status === 'active' || dietitian.subscription_status === 'trialing') {
      return NextResponse.json({ error: 'Subscription already exists' }, { status: 400 })
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