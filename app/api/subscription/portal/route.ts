import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentService } from '@/lib/payment-service'

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
      .select('id, stripe_customer_id')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json({ error: 'Dietitian not found' }, { status: 404 })
    }

    if (!dietitian.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    // Create billing portal session
    const portalSession = await paymentService.createBillingPortalSession(
      dietitian.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/settings`
    )

    return NextResponse.json({
      success: true,
      portalUrl: portalSession.url
    })

  } catch (error) {
    // TODO: Log API error to monitoring service
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}