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

    // For now, assume the user is a client making feedback
    // In a real system, you'd need proper client authentication
    // This is a simplified approach for the demo
    
    // Get the meal plan to determine the dietitian
    const { data: mealPlan } = await supabase
      .from('meal_plans')
      .select('id, client_id, dietitian_id')
      .eq('id', meal_plan_id)
      .single()

    if (!mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 })
    }

    // Use the meal plan data we already fetched
    const clientId = mealPlan.client_id
    const dietitianId = mealPlan.dietitian_id

    // Check if feedback already exists for this meal plan
    const { data: existingFeedback } = await supabase
      .from('meal_plan_feedback')
      .select('id')
      .eq('meal_plan_id', meal_plan_id)
      .eq('client_id', clientId)
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
          client_id: clientId,
          dietitian_id: dietitianId,
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
    
    // Assume user is a nutritionist and get feedback for their meal plans
    let query = supabase
      .from('meal_plan_feedback')
      .select(`
        *,
        meal_plans!inner(
          id,
          name,
          client_id,
          clients!inner(
            id,
            name,
            email
          )
        )
      `)
      .eq('dietitian_id', user.id)
      .order('created_at', { ascending: false })

    if (meal_plan_id) {
      query = query.eq('meal_plan_id', meal_plan_id)
    }

    const { data: feedback, error } = await query

    if (error) throw error

    return NextResponse.json({ feedback: feedback || [] })
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    )
  }
}