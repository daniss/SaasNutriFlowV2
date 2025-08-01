import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { DynamicMealPlan, MealSlot, generateMealId } from "@/lib/meal-plan-types"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { templateId, clientId, customizations } = await request.json()

    // TODO: Log request data to monitoring service

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

    // TODO: Log template fetch result to monitoring service

    if (templateError || !template) {
      // TODO: Log template not found error to monitoring service
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Verify client belongs to dietitian
    // RLS policies will automatically filter clients for the authenticated user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .single()

    // TODO: Log client fetch result to monitoring service

    if (clientError || !client) {
      // TODO: Log client not found error to monitoring service
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    // Transform template meal_structure to dynamic meal plan format
    async function transformTemplateToPlanContent(templateStructure: any, duration: number): Promise<DynamicMealPlan> {
      const days = []
      
      // Ensure templateStructure is array format
      const templateDays = Array.isArray(templateStructure) ? templateStructure : []
      
      // Convert template day structure to dynamic meal plan day structure
      for (let dayNum = 1; dayNum <= duration; dayNum++) {
        const templateDay = templateDays.find(d => d.day === dayNum)
        
        if (templateDay && templateDay.meals) {
          // Transform template meals to dynamic meal slots with recipe support
          const meals: MealSlot[] = await Promise.all(
            templateDay.meals.map(async (meal: any, index: number) => {
              const mealSlot: MealSlot = {
                id: generateMealId(dayNum, meal.name),
                name: meal.name,
                time: meal.time || '12:00',
                description: meal.description || meal.name || 'Repas à définir',
                calories_target: meal.calories_target || null,
                enabled: true,
                order: index
              }

              // If the meal has a recipe_id, fetch recipe details
              if (meal.recipe_id) {
                mealSlot.recipe_id = meal.recipe_id
                
                // Try to fetch recipe details for better description
                try {
                  const { data: recipe, error } = await supabase
                    .from('recipes')
                    .select(`
                      name, 
                      description,
                      calories_per_serving, 
                      prep_time, 
                      cook_time, 
                      protein_per_serving,
                      carbs_per_serving,
                      fat_per_serving
                    `)
                    .eq('id', meal.recipe_id)
                    .eq('dietitian_id', user!.id)
                    .single()

                  if (!error && recipe) {
                    // Update meal description with recipe info
                    mealSlot.description = recipe.description || recipe.name
                    
                    // If we have nutritional info, update calories target
                    if (recipe.calories_per_serving) {
                      mealSlot.calories_target = recipe.calories_per_serving
                    }
                    
                    // Preserve the original meal name for recipe matching
                    mealSlot.original_meal_name = recipe.name
                  }
                } catch (error) {
                  // TODO: Log recipe fetch error to monitoring service
                }
              }

              return mealSlot
            })
          )
          
          const dayPlan = {
            day: dayNum,
            date: new Date(Date.now() + (dayNum - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            meals: meals,
            notes: templateDay.notes || '',
            templateData: templateDay
          }
          days.push(dayPlan)
        } else {
          // Create placeholder for missing days with default meal structure
          const defaultMeals: MealSlot[] = [
            {
              id: generateMealId(dayNum, 'Petit-déjeuner'),
              name: 'Petit-déjeuner',
              time: '08:00',
              description: 'Repas à définir',
              enabled: false,
              order: 0
            },
            {
              id: generateMealId(dayNum, 'Déjeuner'),
              name: 'Déjeuner',
              time: '12:00',
              description: 'Repas à définir',
              enabled: false,
              order: 1
            },
            {
              id: generateMealId(dayNum, 'Dîner'),
              name: 'Dîner',
              time: '19:00',
              description: 'Repas à définir',
              enabled: false,
              order: 2
            }
          ]
          
          days.push({
            day: dayNum,
            date: new Date(Date.now() + (dayNum - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            meals: defaultMeals,
            notes: '',
            templateData: null
          })
        }
      }
      
      return { 
        days,
        generated_by: 'template' as const
      }
    }


    // Helper function to transform meal with recipe lookup
    async function transformMealWithRecipes(mealData: any, mealType: string): Promise<string[]> {
      if (!mealData) return []
      
      // If mealData has a recipe_id, try to fetch the recipe
      if (mealData.recipe_id) {
        try {
          const { data: recipe, error } = await supabase
            .from('recipes')
            .select(`
              name, 
              calories_per_serving, 
              prep_time, 
              cook_time, 
              protein_per_serving,
              carbs_per_serving,
              fat_per_serving
            `)
            .eq('id', mealData.recipe_id)
            .eq('dietitian_id', user!.id)
            .single()

          if (!error && recipe) {
            const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
            const nutritionInfo = []
            
            if (recipe.calories_per_serving) nutritionInfo.push(`${recipe.calories_per_serving} kcal`)
            if (recipe.protein_per_serving) nutritionInfo.push(`P: ${recipe.protein_per_serving}g`)
            if (recipe.carbs_per_serving) nutritionInfo.push(`G: ${recipe.carbs_per_serving}g`)
            if (recipe.fat_per_serving) nutritionInfo.push(`L: ${recipe.fat_per_serving}g`)
            
            const timeInfo = totalTime > 0 ? ` - ${totalTime} min` : ''
            const nutritionText = nutritionInfo.length > 0 ? ` (${nutritionInfo.join(', ')})` : ''
            
            return [`${recipe.name}${nutritionText}${timeInfo}`]
          }
        } catch (error) {
          // TODO: Log recipe fetch error to monitoring service
        }
      }
      
      // Fallback to original template structure
      if (mealData.name) {
        const calories = mealData.calories ? ` (${mealData.calories} kcal` : ''
        const time = mealData.prep_time ? ` - ${mealData.prep_time}` : ''
        const closing = (calories || time) ? ')' : ''
        
        return [`${mealData.name}${calories}${time}${closing}`]
      }
      
      // Handle array of meal items
      if (Array.isArray(mealData)) {
        const transformedMeals = []
        for (const item of mealData) {
          const transformed = await transformMealWithRecipes(item, mealType)
          transformedMeals.push(...transformed)
        }
        return transformedMeals
      }
      
      return []
    }

    // Convert template structure to meal plan content
    // Calculate duration based on the actual number of days in template structure
    const templateDays = Array.isArray(template.meal_structure) ? template.meal_structure : []
    const duration = templateDays.length > 0 ? templateDays.length : 1
    const transformedMealData = await transformTemplateToPlanContent(template.meal_structure, duration)
    
    const planContent: DynamicMealPlan = {
      generated_by: 'template',
      template_id: templateId,
      template_name: template.name,
      days: transformedMealData.days,
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
      duration_days: duration,
      calories_range: customizations?.target_calories || template.target_calories,
      plan_content: planContent,
      status: 'draft'
    }

    // TODO: Log meal plan creation data to monitoring service

    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .insert(mealPlanData)
      .select(`
        *,
        clients (name),
        meal_plan_templates (name)
      `)
      .single()

    // TODO: Log meal plan creation result to monitoring service

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
    // TODO: Log meal plan creation error to monitoring service
    
    // More detailed error logging
    if (error instanceof Error) {
      // TODO: Log detailed error information to monitoring service
    }
    
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
    return NextResponse.json(
      { error: `Failed to create meal plan from template: ${errorMessage}` },
      { status: 500 }
    )
  }
}