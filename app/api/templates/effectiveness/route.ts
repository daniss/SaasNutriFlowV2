import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('template_id')

    // Get template effectiveness data
    const { data: templates, error: templatesError } = await supabase
      .from('meal_plan_templates')
      .select(`
        id,
        name,
        category,
        usage_count,
        created_at,
        updated_at
      `)
      .eq('dietitian_id', user.id)
      .order('usage_count', { ascending: false })

    if (templatesError) throw templatesError

    // Get feedback data for templates
    const { data: feedback, error: feedbackError } = await supabase
      .from('meal_plan_feedback')
      .select(`
        id,
        meal_plan_id,
        rating,
        satisfaction_rating,
        difficulty_rating,
        would_recommend,
        created_at,
        meal_plans!inner(
          id,
          name,
          template_id,
          client_id,
          created_at
        )
      `)
      .eq('dietitian_id', user.id)
      .not('meal_plans.template_id', 'is', null)

    if (feedbackError) throw feedbackError

    // Calculate effectiveness metrics for each template
    const effectivenessData = templates.map(template => {
      const templateFeedback = feedback.filter(f => {
        const mealPlan = Array.isArray(f.meal_plans) ? f.meal_plans[0] : f.meal_plans
        return mealPlan && mealPlan.template_id === template.id
      })
      
      if (templateFeedback.length === 0) {
        return {
          template_id: template.id,
          template_name: template.name,
          category: template.category,
          usage_count: template.usage_count,
          total_feedback: 0,
          average_rating: 0,
          average_satisfaction: 0,
          average_difficulty: 0,
          recommendation_rate: 0,
          effectiveness_score: 0,
          performance_category: 'Needs Improvement',
          created_at: template.created_at,
          updated_at: template.updated_at
        }
      }

      const totalFeedback = templateFeedback.length
      const averageRating = templateFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedback
      const averageSatisfaction = templateFeedback.reduce((sum, f) => sum + (f.satisfaction_rating || 0), 0) / totalFeedback
      const averageDifficulty = templateFeedback.reduce((sum, f) => sum + (f.difficulty_rating || 0), 0) / totalFeedback
      const recommendationRate = templateFeedback.filter(f => f.would_recommend).length / totalFeedback * 100
      
      // Calculate effectiveness score (weighted average)
      const effectivenessScore = (
        (averageRating * 0.3) +
        (averageSatisfaction * 0.3) +
        ((6 - averageDifficulty) * 0.2) + // Invert difficulty (lower is better)
        ((recommendationRate / 100) * 5 * 0.2)
      )

      // Determine performance category
      let performanceCategory = 'Needs Improvement'
      if (effectivenessScore >= 4.0) {
        performanceCategory = 'Excellent'
      } else if (effectivenessScore >= 3.0) {
        performanceCategory = 'Good'
      }

      return {
        template_id: template.id,
        template_name: template.name,
        category: template.category,
        usage_count: template.usage_count,
        total_feedback: totalFeedback,
        average_rating: Math.round(averageRating * 10) / 10,
        average_satisfaction: Math.round(averageSatisfaction * 10) / 10,
        average_difficulty: Math.round(averageDifficulty * 10) / 10,
        recommendation_rate: Math.round(recommendationRate * 10) / 10,
        effectiveness_score: Math.round(effectivenessScore * 10) / 10,
        performance_category: performanceCategory,
        created_at: template.created_at,
        updated_at: template.updated_at
      }
    })

    // Filter by template_id if provided
    if (templateId) {
      const singleTemplate = effectivenessData.find(e => e.template_id === templateId)
      if (!singleTemplate) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 })
      }
      return NextResponse.json({ effectiveness: singleTemplate })
    }

    return NextResponse.json({ effectiveness: effectivenessData })
  } catch (error) {
    console.error("Error fetching template effectiveness:", error)
    return NextResponse.json(
      { error: "Failed to fetch template effectiveness" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { template_id, effectiveness_score, notes } = await request.json()

    // Validate input
    if (!template_id || effectiveness_score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify template ownership
    const { data: template, error: templateError } = await supabase
      .from('meal_plan_templates')
      .select('id')
      .eq('id', template_id)
      .eq('dietitian_id', user.id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Insert or update effectiveness tracking
    const { data, error } = await supabase
      .from('template_effectiveness')
      .upsert({
        template_id,
        dietitian_id: user.id,
        effectiveness_score,
        notes,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ effectiveness: data }, { status: 201 })
  } catch (error) {
    console.error("Error updating template effectiveness:", error)
    return NextResponse.json(
      { error: "Failed to update template effectiveness" },
      { status: 500 }
    )
  }
}