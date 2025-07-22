import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Add GET handler to verify endpoint is reachable
export async function GET() {
  return NextResponse.json({ 
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}

// Stripe webhook handler for subscription events
export async function POST(request: NextRequest) {
  console.log('Webhook received at:', new Date().toISOString())
  
  try {
    const supabase = await createClient()
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }
    
    console.log('Processing webhook with signature:', signature?.substring(0, 20) + '...')

    let event
    try {
      // Verify Stripe signature
      const elements = signature.split(',')
      const signatureObject: Record<string, string> = {}
      
      for (const element of elements) {
        const [key, value] = element.split('=')
        signatureObject[key] = value
      }

      const timestamp = signatureObject.t
      const signatures = [signatureObject.v1]

      if (!timestamp || !signatures[0]) {
        throw new Error('Invalid signature format')
      }

      const payload = timestamp + '.' + body
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload, 'utf8')
        .digest('hex')

      const signatureMatches = signatures.some(sig => 
        crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(sig, 'hex'))
      )

      if (!signatureMatches) {
        throw new Error('Signature verification failed')
      }

      event = JSON.parse(body)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    console.log('Processing webhook event:', event.type, event.id)

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(supabase, event.data.object)
          break

        case 'customer.subscription.created':
          await handleSubscriptionCreated(supabase, event.data.object)
          break

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(supabase, event.data.object)
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(supabase, event.data.object)
          break

        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(supabase, event.data.object)
          break

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(supabase, event.data.object)
          break

        case 'customer.subscription.trial_will_end':
          await handleTrialWillEnd(supabase, event.data.object)
          break

        default:
          console.log('Unhandled event type:', event.type)
      }

      return NextResponse.json({ received: true })
    } catch (error) {
      console.error('Error processing webhook event:', error)
      return NextResponse.json({ error: 'Event processing failed' }, { status: 500 })
    }

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Event handlers
async function handleCheckoutSessionCompleted(supabase: any, session: any) {
  console.log('Handling checkout session completed:', session.id)

  const customerId = session.customer
  const subscriptionId = session.subscription
  const metadata = session.metadata

  if (!customerId || !subscriptionId || !metadata?.dietitian_id) {
    console.error('Missing required data in checkout session:', { customerId, subscriptionId, metadata })
    return
  }

  // Check if user's trial was already expired
  const { data: currentDietitian } = await supabase
    .from('dietitians')
    .select('trial_ends_at, subscription_status')
    .eq('id', metadata.dietitian_id)
    .single()

  const now = new Date()
  const trialExpired = currentDietitian?.trial_ends_at 
    ? new Date(currentDietitian.trial_ends_at) < now 
    : false

  // If trial was expired, activate subscription immediately
  // If trial was not expired or no trial, let Stripe handle the trial period
  const newStatus = trialExpired ? 'active' : 'trialing'
  const trialEndsAt = trialExpired 
    ? null 
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  // Update dietitian subscription status
  const updateData: any = {
    subscription_id: subscriptionId,
    subscription_status: newStatus,
    subscription_plan: metadata.plan_name,
    subscription_started_at: new Date().toISOString()
  }

  if (trialEndsAt) {
    updateData.trial_ends_at = trialEndsAt
  }

  const { error: updateError } = await supabase
    .from('dietitians')
    .update(updateData)
    .eq('id', metadata.dietitian_id)

  if (updateError) {
    console.error('Failed to update dietitian subscription:', updateError)
    throw updateError
  }

  // Log subscription event
  await logSubscriptionEvent(
    supabase,
    metadata.dietitian_id,
    'checkout_completed',
    session.id,
    subscriptionId,
    currentDietitian?.subscription_status,
    newStatus,
    null,
    metadata.plan_name,
    { session_id: session.id, trial_expired: trialExpired }
  )
}

async function handleSubscriptionCreated(supabase: any, subscription: any) {
  console.log('Handling subscription created:', subscription.id)

  const { data: dietitian } = await supabase
    .from('dietitians')
    .select('id')
    .eq('stripe_customer_id', subscription.customer)
    .single()

  if (!dietitian) {
    console.error('Dietitian not found for customer:', subscription.customer)
    return
  }

  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
  const status = subscription.status

  const { error } = await supabase
    .from('dietitians')
    .update({
      subscription_id: subscription.id,
      subscription_status: status,
      trial_ends_at: trialEnd?.toISOString(),
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('id', dietitian.id)

  if (error) {
    console.error('Failed to update subscription:', error)
    throw error
  }

  await logSubscriptionEvent(
    supabase,
    dietitian.id,
    'subscription_created',
    null,
    subscription.id,
    null,
    status,
    null,
    null,
    { subscription }
  )
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  console.log('Handling subscription updated:', subscription.id)

  const { data: dietitian } = await supabase
    .from('dietitians')
    .select('id, subscription_status, subscription_plan')
    .eq('subscription_id', subscription.id)
    .single()

  if (!dietitian) {
    console.error('Dietitian not found for subscription:', subscription.id)
    return
  }

  const previousStatus = dietitian.subscription_status
  const newStatus = subscription.status

  // Determine plan name from price ID
  const priceId = subscription.items.data[0]?.price?.id
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('name')
    .eq('stripe_price_id', priceId)
    .single()

  const planName = plan?.name || dietitian.subscription_plan

  const { error } = await supabase
    .from('dietitians')
    .update({
      subscription_status: newStatus,
      subscription_plan: planName,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      subscription_ends_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null
    })
    .eq('id', dietitian.id)

  if (error) {
    console.error('Failed to update subscription:', error)
    throw error
  }

  await logSubscriptionEvent(
    supabase,
    dietitian.id,
    'subscription_updated',
    null,
    subscription.id,
    previousStatus,
    newStatus,
    dietitian.subscription_plan,
    planName,
    { subscription }
  )
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  console.log('Handling subscription deleted:', subscription.id)

  const { data: dietitian } = await supabase
    .from('dietitians')
    .select('id, subscription_status')
    .eq('subscription_id', subscription.id)
    .single()

  if (!dietitian) {
    console.error('Dietitian not found for subscription:', subscription.id)
    return
  }

  const previousStatus = dietitian.subscription_status

  const { error } = await supabase
    .from('dietitians')
    .update({
      subscription_status: 'canceled',
      subscription_ends_at: new Date().toISOString()
    })
    .eq('id', dietitian.id)

  if (error) {
    console.error('Failed to update subscription:', error)
    throw error
  }

  await logSubscriptionEvent(
    supabase,
    dietitian.id,
    'subscription_canceled',
    null,
    subscription.id,
    previousStatus,
    'canceled',
    null,
    null,
    { subscription }
  )
}

async function handleInvoicePaymentSucceeded(supabase: any, invoice: any) {
  console.log('Handling invoice payment succeeded:', invoice.id)

  const subscriptionId = invoice.subscription
  if (!subscriptionId) return

  const { data: dietitian } = await supabase
    .from('dietitians')
    .select('id')
    .eq('subscription_id', subscriptionId)
    .single()

  if (!dietitian) {
    console.error('Dietitian not found for subscription:', subscriptionId)
    return
  }

  await logSubscriptionEvent(
    supabase,
    dietitian.id,
    'payment_succeeded',
    null,
    subscriptionId,
    null,
    null,
    null,
    null,
    { invoice_id: invoice.id, amount: invoice.amount_paid }
  )
}

async function handleInvoicePaymentFailed(supabase: any, invoice: any) {
  console.log('Handling invoice payment failed:', invoice.id)

  const subscriptionId = invoice.subscription
  if (!subscriptionId) return

  const { data: dietitian } = await supabase
    .from('dietitians')
    .select('id, subscription_status')
    .eq('subscription_id', subscriptionId)
    .single()

  if (!dietitian) {
    console.error('Dietitian not found for subscription:', subscriptionId)
    return
  }

  // Update to past_due status
  const { error } = await supabase
    .from('dietitians')
    .update({
      subscription_status: 'past_due'
    })
    .eq('id', dietitian.id)

  if (error) {
    console.error('Failed to update subscription to past_due:', error)
  }

  await logSubscriptionEvent(
    supabase,
    dietitian.id,
    'payment_failed',
    null,
    subscriptionId,
    dietitian.subscription_status,
    'past_due',
    null,
    null,
    { invoice_id: invoice.id, amount: invoice.amount_due }
  )
}

async function handleTrialWillEnd(supabase: any, subscription: any) {
  console.log('Handling trial will end:', subscription.id)

  const { data: dietitian } = await supabase
    .from('dietitians')
    .select('id')
    .eq('subscription_id', subscription.id)
    .single()

  if (!dietitian) {
    console.error('Dietitian not found for subscription:', subscription.id)
    return
  }

  await logSubscriptionEvent(
    supabase,
    dietitian.id,
    'trial_will_end',
    null,
    subscription.id,
    null,
    null,
    null,
    null,
    { trial_end: subscription.trial_end }
  )

  // TODO: Send email notification to user about trial ending
}

async function logSubscriptionEvent(
  supabase: any,
  dietitianId: string,
  eventType: string,
  stripeEventId: string | null = null,
  stripeSubscriptionId: string | null = null,
  previousStatus: string | null = null,
  newStatus: string | null = null,
  previousPlan: string | null = null,
  newPlan: string | null = null,
  metadata: any = null
) {
  const { error } = await supabase.rpc('log_subscription_event', {
    p_dietitian_id: dietitianId,
    p_event_type: eventType,
    p_stripe_event_id: stripeEventId,
    p_stripe_subscription_id: stripeSubscriptionId,
    p_previous_status: previousStatus,
    p_new_status: newStatus,
    p_previous_plan: previousPlan,
    p_new_plan: newPlan,
    p_metadata: metadata
  })

  if (error) {
    console.error('Failed to log subscription event:', error)
  }
}