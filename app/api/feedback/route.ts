import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      title,
      description,
      urgency,
      stepsToReproduce,
      expectedBehavior,
      userEmail,
      userName,
    } = body

    // Validate required fields
    if (!type || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get dietitian info for context
    const { data: dietitian } = await supabase
      .from('dietitians')
      .select('id, name')
      .eq('auth_user_id', user.id)
      .single()

    // Store feedback data
    const feedbackData = {
      user_id: user.id,
      dietitian_id: dietitian?.id,
      type,
      title,
      description,
      urgency: urgency || 'medium',
      steps_to_reproduce: stepsToReproduce,
      expected_behavior: expectedBehavior,
      user_email: userEmail,
      user_name: userName || dietitian?.name,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    // Log feedback for now (in production, integrate with your preferred system)
    console.log('📝 New feedback received:', {
      ...feedbackData,
      timestamp: new Date().toLocaleString('fr-FR'),
    })

    // Here you could integrate with:
    // - Email service to notify your team
    // - Slack webhook
    // - Notion database
    // - GitHub issues
    // - Any feedback management tool

    return NextResponse.json({
      success: true,
      message: 'Feedback received successfully',
      estimatedResponse: '48 hours'
    })

  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}