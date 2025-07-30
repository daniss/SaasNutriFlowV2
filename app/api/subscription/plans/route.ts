import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get active subscription plans
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) {
      // TODO: Log database error to monitoring service
      return NextResponse.json(
        { error: 'Failed to fetch subscription plans' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      plans
    })

  } catch (error) {
    // TODO: Log API error to monitoring service
    return NextResponse.json(
      { error: 'Failed to get subscription plans' },
      { status: 500 }
    )
  }
}