import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('recipe_id')
    const mealPlanId = searchParams.get('meal_plan_id')
    const category = searchParams.get('category')
    const isTemplate = searchParams.get('is_template') === 'true'

    // Build query
    let query = supabase
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
        )
      `)
      .eq('dietitian_id', dietitian.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (recipeId) {
      query = query.eq('recipe_id', recipeId)
    }
    
    if (mealPlanId) {
      query = query.eq('meal_plan_id', mealPlanId)
    }
    
    if (category) {
      query = query.eq('prep_category', category)
    }
    
    if (isTemplate) {
      query = query.eq('is_template', true)
    }

    const { data: instructions, error } = await query

    if (error) throw error

    // Sort prep steps and ingredient details by their order
    const processedInstructions = instructions?.map(instruction => ({
      ...instruction,
      prep_steps: instruction.prep_steps?.sort((a, b) => a.order_position - b.order_position) || [],
      ingredient_prep_details: instruction.ingredient_prep_details?.sort((a, b) => a.prep_order - b.prep_order) || []
    }))

    return NextResponse.json({ instructions: processedInstructions || [] })
  } catch (error) {
    console.error("Error fetching meal prep instructions:", error)
    return NextResponse.json(
      { error: "Failed to fetch instructions" },
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
      prep_steps,
      ingredient_prep_details,
      nutrition_timing,
      auto_generate
    } = await request.json()

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    // Ensure either recipe_id or meal_plan_id is provided (but not both)
    if ((!recipe_id && !meal_plan_id) || (recipe_id && meal_plan_id)) {
      return NextResponse.json(
        { error: "Either recipe_id or meal_plan_id must be provided, but not both" },
        { status: 400 }
      )
    }

    // If auto_generate is true and recipe_id is provided, use the function
    if (auto_generate && recipe_id) {
      const { data: generatedId, error: generateError } = await supabase
        .rpc('generate_basic_prep_instructions', {
          p_recipe_id: recipe_id,
          p_dietitian_id: dietitian.id
        })

      if (generateError) throw generateError

      // Fetch the generated instruction
      const { data: generated, error: fetchError } = await supabase
        .from('meal_prep_instructions')
        .select(`
          *,
          prep_steps (*),
          ingredient_prep_details (*),
          nutrition_timing (*)
        `)
        .eq('id', generatedId)
        .single()

      if (fetchError) throw fetchError

      return NextResponse.json({ instruction: generated }, { status: 201 })
    }

    // Create the main instruction record
    const { data: instruction, error: instructionError } = await supabase
      .from('meal_prep_instructions')
      .insert({
        recipe_id,
        meal_plan_id,
        dietitian_id: dietitian.id,
        title,
        description,
        prep_time_minutes,
        difficulty_level,
        equipment_needed,
        prep_category,
        servings,
        storage_instructions,
        nutrition_notes,
        is_template: is_template || false
      })
      .select()
      .single()

    if (instructionError) throw instructionError

    // Insert prep steps if provided
    if (prep_steps && prep_steps.length > 0) {
      const stepsToInsert = prep_steps.map((step: any, index: number) => ({
        meal_prep_instruction_id: instruction.id,
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

    // Insert ingredient prep details if provided
    if (ingredient_prep_details && ingredient_prep_details.length > 0) {
      const ingredientsToInsert = ingredient_prep_details.map((ingredient: any, index: number) => ({
        meal_prep_instruction_id: instruction.id,
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

    // Insert nutrition timing if provided
    if (nutrition_timing && nutrition_timing.length > 0) {
      const nutritionToInsert = nutrition_timing.map((timing: any) => ({
        meal_prep_instruction_id: instruction.id,
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

    // Fetch the complete instruction with all related data
    const { data: completeInstruction, error: fetchError } = await supabase
      .from('meal_prep_instructions')
      .select(`
        *,
        prep_steps (*),
        ingredient_prep_details (*),
        nutrition_timing (*)
      `)
      .eq('id', instruction.id)
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json({ instruction: completeInstruction }, { status: 201 })
  } catch (error) {
    console.error("Error creating meal prep instruction:", error)
    return NextResponse.json(
      { error: "Failed to create instruction" },
      { status: 500 }
    )
  }
}