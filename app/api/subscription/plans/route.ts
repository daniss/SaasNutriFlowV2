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
      console.error('Failed to fetch subscription plans:', error)
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
    console.error('Get subscription plans error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription plans' },
      { status: 500 }
    )
  }
}