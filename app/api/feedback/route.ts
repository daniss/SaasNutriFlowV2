import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      meal_plan_id, 
      rating, 
      feedback_text, 
      difficulty_rating, 
      satisfaction_rating, 
      would_recommend 
    } = body

    // Validate required fields
    if (!meal_plan_id || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get client info from user ID
    const { data: client } = await supabase
      .from('clients')
      .select('id, dietitian_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Check if meal plan exists and belongs to this client
    const { data: mealPlan } = await supabase
      .from('meal_plans')
      .select('id, client_id')
      .eq('id', meal_plan_id)
      .eq('client_id', client.id)
      .single()

    if (!mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 })
    }

    // Check if feedback already exists for this meal plan
    const { data: existingFeedback } = await supabase
      .from('meal_plan_feedback')
      .select('id')
      .eq('meal_plan_id', meal_plan_id)
      .eq('client_id', client.id)
      .single()

    if (existingFeedback) {
      // Update existing feedback
      const { data: updatedFeedback, error } = await supabase
        .from('meal_plan_feedback')
        .update({
          rating,
          feedback_text,
          difficulty_rating,
          satisfaction_rating,
          would_recommend
        })
        .eq('id', existingFeedback.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ 
        success: true, 
        feedback: updatedFeedback 
      })
    } else {
      // Create new feedback
      const { data: newFeedback, error } = await supabase
        .from('meal_plan_feedback')
        .insert({
          meal_plan_id,
          client_id: client.id,
          dietitian_id: client.dietitian_id,
          rating,
          feedback_text,
          difficulty_rating,
          satisfaction_rating,
          would_recommend
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ 
        success: true, 
        feedback: newFeedback 
      })
    }
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meal_plan_id = searchParams.get('meal_plan_id')
    
    // Get user profile to determine if they're a client or dietitian
    const { data: profile } = await supabase
      .from('dietitians')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (profile) {
      // User is a dietitian - get all feedback for their meal plans
      let query = supabase
        .from('meal_plan_feedback')
        .select(`
          *,
          meal_plans!inner(
            id,
            title,
            client_id,
            clients!inner(
              id,
              name,
              email
            )
          )
        `)
        .eq('dietitian_id', profile.id)
        .order('created_at', { ascending: false })

      if (meal_plan_id) {
        query = query.eq('meal_plan_id', meal_plan_id)
      }

      const { data: feedback, error } = await query

      if (error) throw error

      return NextResponse.json({ feedback })
    } else {
      // User is a client - get their own feedback
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 })
      }

      let query = supabase
        .from('meal_plan_feedback')
        .select(`
          *,
          meal_plans!inner(
            id,
            title
          )
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (meal_plan_id) {
        query = query.eq('meal_plan_id', meal_plan_id)
      }

      const { data: feedback, error } = await query

      if (error) throw error

      return NextResponse.json({ feedback })
    }
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    )
  }
}