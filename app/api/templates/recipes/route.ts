import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Get recipes for template creation
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const search = url.searchParams.get('search')

    let query = supabase
      .from('recipes')
      .select(`
        id,
        name,
        description,
        category,
        prep_time,
        cook_time,
        servings,
        calories_per_serving,
        protein_per_serving,
        carbs_per_serving,
        fat_per_serving,
        fiber_per_serving,
        difficulty,
        tags,
        usage_count
      `)
      .eq('dietitian_id', user.id)
      .order('usage_count', { ascending: false })

    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`)
    }

    const { data: recipes, error } = await query.limit(50)

    if (error) {
      // TODO: Log database error to monitoring service
      return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
    }

    return NextResponse.json({ recipes })

  } catch (error) {
    // TODO: Log API error to monitoring service
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// Update template meal to use recipe
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { templateId, dayNumber, mealType, recipeId, customization } = await request.json()

    if (!templateId || !dayNumber || !mealType) {
      return NextResponse.json(
        { error: "Template ID, day number, and meal type are required" },
        { status: 400 }
      )
    }

    // Get the current template
    const { data: template, error: templateError } = await supabase
      .from('meal_plan_templates')
      .select('meal_structure')
      .eq('id', templateId)
      .eq('dietitian_id', user.id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Get recipe details if recipeId is provided
    let recipeData = null
    if (recipeId) {
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select(`
          id,
          name,
          calories_per_serving,
          prep_time,
          cook_time,
          protein_per_serving,
          carbs_per_serving,
          fat_per_serving,
          servings,
          usage_count
        `)
        .eq('id', recipeId)
        .eq('dietitian_id', user.id)
        .single()

      if (!recipeError && recipe) {
        recipeData = recipe
      }
    }

    // Update the meal structure
    const mealStructure = template.meal_structure
    const dayKey = `day_${dayNumber}`
    
    if (!mealStructure[dayKey]) {
      mealStructure[dayKey] = {}
    }

    if (recipeData) {
      // Link to recipe
      mealStructure[dayKey][mealType] = {
        recipe_id: recipeData.id,
        name: recipeData.name,
        calories: recipeData.calories_per_serving,
        prep_time: `${(recipeData.prep_time || 0) + (recipeData.cook_time || 0)} min`,
        protein: recipeData.protein_per_serving,
        carbs: recipeData.carbs_per_serving,
        fat: recipeData.fat_per_serving,
        servings: recipeData.servings,
        ...customization // Allow overrides
      }
    } else {
      // Custom meal (no recipe link)
      mealStructure[dayKey][mealType] = {
        recipe_id: null,
        name: customization?.name || "Repas personnalisé",
        calories: customization?.calories || null,
        prep_time: customization?.prep_time || null,
        ...customization
      }
    }

    // Update the template
    const { error: updateError } = await supabase
      .from('meal_plan_templates')
      .update({ 
        meal_structure: mealStructure,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .eq('dietitian_id', user.id)

    if (updateError) {
      // TODO: Log database error to monitoring service
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    // Update recipe usage count if a recipe was linked
    if (recipeId) {
      await supabase
        .from('recipes')
        .update({ 
          usage_count: (recipeData?.usage_count || 0) + 1
        })
        .eq('id', recipeId)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Template updated successfully',
      updatedMeal: mealStructure[dayKey][mealType]
    })

  } catch (error) {
    // TODO: Log API error to monitoring service
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}