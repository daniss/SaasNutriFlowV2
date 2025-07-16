import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { ProgressIntegrationService } from "@/lib/progress-integration"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('template_id')
    const category = searchParams.get('category')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    // Get template effectiveness metrics
    const effectiveness = await ProgressIntegrationService.getTemplateEffectiveness(user.id)
    
    let filteredEffectiveness = effectiveness

    // Filter by template if specified
    if (templateId) {
      filteredEffectiveness = effectiveness.filter(e => e.template_id === templateId)
    }

    // Filter by category if specified
    if (category) {
      // Get templates in the specified category
      const { data: templates } = await supabase
        .from('meal_plan_templates')
        .select('id')
        .eq('dietitian_id', user.id)
        .eq('category', category)

      const templateIds = templates?.map(t => t.id) || []
      filteredEffectiveness = filteredEffectiveness.filter(e => 
        templateIds.includes(e.template_id)
      )
    }

    // Apply limit if specified
    if (limit) {
      filteredEffectiveness = filteredEffectiveness.slice(0, limit)
    }

    // Get additional template information for context
    const enrichedEffectiveness = await Promise.all(
      filteredEffectiveness.map(async (eff) => {
        const { data: template } = await supabase
          .from('meal_plan_templates')
          .select('name, category, client_type, goal_type, created_at, rating, usage_count')
          .eq('id', eff.template_id)
          .single()

        return {
          ...eff,
          template_name: template?.name || 'Unknown',
          template_category: template?.category || 'general',
          template_client_type: template?.client_type,
          template_goal_type: template?.goal_type,
          template_created_at: template?.created_at,
          template_rating: template?.rating || 0,
          template_usage_count: template?.usage_count || 0
        }
      })
    )

    return NextResponse.json({ 
      effectiveness: enrichedEffectiveness,
      total: effectiveness.length,
      filtered: filteredEffectiveness.length
    })
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

    const { template_id } = await request.json()

    if (!template_id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    // Verify template ownership
    const { data: template } = await supabase
      .from('meal_plan_templates')
      .select('id')
      .eq('id', template_id)
      .eq('dietitian_id', user.id)
      .single()

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Trigger effectiveness calculation
    const { error: updateError } = await supabase.rpc('update_template_effectiveness', {
      p_template_id: template_id
    })

    if (updateError) {
      console.error("Error updating template effectiveness:", updateError)
      return NextResponse.json(
        { error: "Failed to update template effectiveness" },
        { status: 500 }
      )
    }

    // Get updated effectiveness data
    const effectiveness = await ProgressIntegrationService.getTemplateEffectiveness(user.id)
    const templateEffectiveness = effectiveness.find(e => e.template_id === template_id)

    return NextResponse.json({ 
      effectiveness: templateEffectiveness,
      message: "Template effectiveness updated successfully"
    })
  } catch (error) {
    console.error("Error updating template effectiveness:", error)
    return NextResponse.json(
      { error: "Failed to update template effectiveness" },
      { status: 500 }
    )
  }
}