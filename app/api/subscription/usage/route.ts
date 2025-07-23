import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the dietitian ID from the auth user ID
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json({ error: 'Dietitian not found' }, { status: 404 })
    }

    const dietitianId = dietitian.id
    let current = 0

    switch (type) {
      case 'clients':
        // Clients use dietitians.id as foreign key
        const { count: clientCount, error: clientError } = await supabase
          .from('clients')
          .select('id', { count: 'exact' })
          .eq('dietitian_id', dietitianId)

        if (clientError) throw clientError
        current = clientCount || 0
        break

      case 'meal_plans':
        // Meal plans use auth_user_id directly as foreign key
        const { count: planCount, error: planError } = await supabase
          .from('meal_plans')
          .select('id', { count: 'exact' })
          .eq('dietitian_id', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

        if (planError) throw planError
        current = planCount || 0
        break

      case 'ai_generations':
        // Track AI generations from dedicated ai_generations table
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const { count: aiCount, error: aiError } = await supabase
          .from('ai_generations')
          .select('id', { count: 'exact' })
          .eq('dietitian_id', user.id)
          .eq('generation_successful', true)
          .gte('created_at', startOfMonth.toISOString())

        if (aiError) throw aiError
        current = aiCount || 0
        break

      default:
        return NextResponse.json({ error: 'Invalid usage type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      current,
      type
    })

  } catch (error) {
    console.error('Get usage error:', error)
    return NextResponse.json(
      { error: 'Failed to get usage data' },
      { status: 500 }
    )
  }
}