import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get dietitian profile
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: instruction, error } = await supabase
      .from('meal_prep_instructions')
      .select(`
        id,
        recipe_id,
        meal_plan_id,
        title,
        description,
        prep_time_minutes,
        difficulty_level,
        equipment_needed,
        prep_category,
        servings,
        storage_instructions,
        nutrition_notes,
        is_template,
        created_at,
        updated_at,
        prep_steps (
          id,
          step_number,
          step_type,
          title,
          description,
          duration_minutes,
          temperature,
          equipment,
          tips,
          order_position,
          is_optional
        ),
        ingredient_prep_details (
          id,
          ingredient_name,
          quantity,
          unit,
          prep_method,
          prep_notes,
          storage_method,
          shelf_life_days,
          prep_order
        ),
        nutrition_timing (
          id,
          meal_timing,
          nutritional_focus,
          macro_breakdown,
          serving_suggestions,
          timing_notes
        ),
        recipe_templates (
          id,
          name,
          category
        ),
        meal_plan_templates (
          id,
          name,
          category
        )
      `)
      .eq('id', params.id)
      .eq('dietitian_id', dietitian.id)
      .single()

    if (error) {
      return NextResponse.json({ error: "Instruction not found" }, { status: 404 })
    }

    // Sort related data by order
    const processedInstruction = {
      ...instruction,
      prep_steps: instruction.prep_steps?.sort((a, b) => a.order_position - b.order_position) || [],
      ingredient_prep_details: instruction.ingredient_prep_details?.sort((a, b) => a.prep_order - b.prep_order) || []
    }

    return NextResponse.json({ instruction: processedInstruction })
  } catch (error) {
    console.error("Error fetching meal prep instruction:", error)
    return NextResponse.json(
      { error: "Failed to fetch instruction" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get dietitian profile
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      title,
      description,
      prep_time_minutes,
      difficulty_level,
      equipment_needed,
      prep_category,
      servings,
      storage_instructions,
      nutrition_notes,
      is_template,
      prep_steps,
      ingredient_prep_details,
      nutrition_timing
    } = await request.json()

    // Update the main instruction record
    const { data: instruction, error: instructionError } = await supabase
      .from('meal_prep_instructions')
      .update({
        title,
        description,
        prep_time_minutes,
        difficulty_level,
        equipment_needed,
        prep_category,
        servings,
        storage_instructions,
        nutrition_notes,
        is_template,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('dietitian_id', dietitian.id)
      .select()
      .single()

    if (instructionError) {
      return NextResponse.json({ error: "Instruction not found or unauthorized" }, { status: 404 })
    }

    // Update prep steps if provided
    if (prep_steps) {
      // Delete existing steps
      await supabase
        .from('prep_steps')
        .delete()
        .eq('meal_prep_instruction_id', params.id)

      // Insert new steps
      if (prep_steps.length > 0) {
        const stepsToInsert = prep_steps.map((step: any, index: number) => ({
          meal_prep_instruction_id: params.id,
          step_number: step.step_number || index + 1,
          step_type: step.step_type,
          title: step.title,
          description: step.description,
          duration_minutes: step.duration_minutes,
          temperature: step.temperature,
          equipment: step.equipment,
          tips: step.tips,
          order_position: step.order_position || index + 1,
          is_optional: step.is_optional || false
        }))

        const { error: stepsError } = await supabase
          .from('prep_steps')
          .insert(stepsToInsert)

        if (stepsError) throw stepsError
      }
    }

    // Update ingredient prep details if provided
    if (ingredient_prep_details) {
      // Delete existing ingredient details
      await supabase
        .from('ingredient_prep_details')
        .delete()
        .eq('meal_prep_instruction_id', params.id)

      // Insert new ingredient details
      if (ingredient_prep_details.length > 0) {
        const ingredientsToInsert = ingredient_prep_details.map((ingredient: any, index: number) => ({
          meal_prep_instruction_id: params.id,
          ingredient_name: ingredient.ingredient_name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          prep_method: ingredient.prep_method,
          prep_notes: ingredient.prep_notes,
          storage_method: ingredient.storage_method,
          shelf_life_days: ingredient.shelf_life_days,
          prep_order: ingredient.prep_order || index + 1
        }))

        const { error: ingredientsError } = await supabase
          .from('ingredient_prep_details')
          .insert(ingredientsToInsert)

        if (ingredientsError) throw ingredientsError
      }
    }

    // Update nutrition timing if provided
    if (nutrition_timing) {
      // Delete existing nutrition timing
      await supabase
        .from('nutrition_timing')
        .delete()
        .eq('meal_prep_instruction_id', params.id)

      // Insert new nutrition timing
      if (nutrition_timing.length > 0) {
        const nutritionToInsert = nutrition_timing.map((timing: any) => ({
          meal_prep_instruction_id: params.id,
          meal_timing: timing.meal_timing,
          nutritional_focus: timing.nutritional_focus,
          macro_breakdown: timing.macro_breakdown,
          serving_suggestions: timing.serving_suggestions,
          timing_notes: timing.timing_notes
        }))

        const { error: nutritionError } = await supabase
          .from('nutrition_timing')
          .insert(nutritionToInsert)

        if (nutritionError) throw nutritionError
      }
    }

    // Fetch the updated instruction with all related data
    const { data: updatedInstruction, error: fetchError } = await supabase
      .from('meal_prep_instructions')
      .select(`
        *,
        prep_steps (*),
        ingredient_prep_details (*),
        nutrition_timing (*)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json({ instruction: updatedInstruction })
  } catch (error) {
    console.error("Error updating meal prep instruction:", error)
    return NextResponse.json(
      { error: "Failed to update instruction" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get dietitian profile
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete instruction (cascading will handle related records)
    const { error } = await supabase
      .from('meal_prep_instructions')
      .delete()
      .eq('id', params.id)
      .eq('dietitian_id', dietitian.id)

    if (error) {
      return NextResponse.json({ error: "Instruction not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting meal prep instruction:", error)
    return NextResponse.json(
      { error: "Failed to delete instruction" },
      { status: 500 }
    )
  }
}