import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { templateId, clientId, customizations } = await request.json()

    console.log('Request data:', { templateId, clientId, customizations })

    // Validate required fields
    if (!templateId || !clientId) {
      return NextResponse.json(
        { error: "Template ID and Client ID are required" },
        { status: 400 }
      )
    }

    // Fetch the template
    const { data: template, error: templateError } = await supabase
      .from('meal_plan_templates')
      .select('*')
      .eq('id', templateId)
      .eq('dietitian_id', user.id)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Verify client belongs to dietitian
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .eq('dietitian_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    // Convert template structure to meal plan content
    const planContent: any = {
      generated_by: 'template',
      template_id: templateId,
      template_name: template.name,
      meal_structure: template.meal_structure,
      target_macros: template.target_macros,
      difficulty: template.difficulty,
      notes: customizations?.notes || template.description || '',
      customizations: customizations || {},
      created_from_template_at: new Date().toISOString()
    }

    // Apply customizations if provided
    if (customizations) {
      if (customizations.target_calories) {
        planContent.target_calories = customizations.target_calories
      }
      if (customizations.duration_days) {
        planContent.duration_days = customizations.duration_days
      }
      if (customizations.meal_modifications) {
        planContent.meal_modifications = customizations.meal_modifications
      }
    }

    // Create the meal plan
    const mealPlanData = {
      dietitian_id: user.id,
      client_id: clientId,
      template_id: templateId,
      generation_method: 'template',
      name: customizations?.name || `${template.name} - ${client.name}`,
      description: customizations?.description || `Plan basé sur le modèle "${template.name}" pour ${client.name}`,
      duration_days: customizations?.duration_days || template.duration_days,
      target_calories: customizations?.target_calories || template.target_calories,
      plan_content: planContent,
      status: 'draft'
    }

    console.log('Creating meal plan with data:', mealPlanData)

    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .insert(mealPlanData)
      .select(`
        *,
        clients (name),
        meal_plan_templates (name)
      `)
      .single()

    console.log('Meal plan creation result:', { mealPlan, mealPlanError })

    if (mealPlanError) throw mealPlanError

    // Update template usage statistics
    await supabase
      .from('meal_plan_templates')
      .update({
        usage_count: template.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', templateId)

    return NextResponse.json({ 
      mealPlan,
      message: `Plan alimentaire créé avec succès à partir du modèle "${template.name}"` 
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating meal plan from template:", error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to create meal plan from template: ${errorMessage}` },
      { status: 500 }
    )
  }
}