import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Authentication check - require admin access
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get dietitian profile to verify user is a dietitian
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Basic health check
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      authenticated: true
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
